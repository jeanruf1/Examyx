import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

// ─── Setup ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error(chalk.red('❌ Variáveis de ambiente não encontradas!'));
  console.error('Verifique se o arquivo .env.local existe com as chaves:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  OPENAI_API_KEY');
  process.exit(1);
}

// Supabase com service_role (bypass do RLS para seed)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// ─── Configurações ────────────────────────────────────────────────────────────

const PDF_PATH    = path.join(__dirname, '..', 'BNCC_EI_EF_110518_versaofinal_site.pdf');
const BATCH_SIZE  = 20;   // quantos embeddings gerar de uma vez (limit rate OpenAI)
const DELAY_MS    = 500;  // delay entre batches (evitar rate limit)

// ─── Mapeamento de abreviações de disciplinas ────────────────────────────────

const SUBJECT_MAP = {
  'LP': 'Língua Portuguesa',
  'MA': 'Matemática',
  'CI': 'Ciências',
  'GE': 'Geografia',
  'HI': 'História',
  'AR': 'Arte',
  'EF': 'Educação Física',
  'ER': 'Ensino Religioso',
  'LI': 'Língua Inglesa',
  'LM': 'Língua/Linguagens',
  'CO': 'Computação',
};

// Mapeamento de séries/anos
const GRADE_MAP = {
  '01': '1º ano',
  '02': '2º ano',
  '03': '3º ano',
  '04': '4º ano',
  '05': '5º ano',
  '06': '6º ano',
  '07': '7º ano',
  '08': '8º ano',
  '09': '9º ano',
  // Faixas (quando a habilidade cobre múltiplos anos)
  '15': '1º ao 5º ano',
  '35': '3º ao 5º ano',
  '69': '6º ao 9º ano',
  '67': '6º e 7º ano',
  '89': '8º e 9º ano',
};

// ─── Parser de competências da BNCC ──────────────────────────────────────────

function extractBNCCCompetencies(text) {
  const competencies = [];
  const seen = new Set();

  // Regex para capturar código + descrição
  // Padrão: (EF01LP01) seguido do texto da habilidade
  // O texto vai até o próximo código ou fim de parágrafo
  const pattern = /\((EF\d{2}[A-Z]{2}\d{2})\)\s*([^(]+?)(?=\s*\([A-Z]{2}\d{2}[A-Z]{2}\d{2}\)|$)/gs;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const code        = match[1].trim();
    const description = match[2]
      .replace(/\s+/g, ' ')     // normalizar espaços
      .replace(/\n/g, ' ')      // remover quebras de linha
      .trim();

    // Filtrar descrições muito curtas (falsos positivos)
    if (description.length < 30) continue;

    // Evitar duplicatas
    if (seen.has(code)) continue;
    seen.add(code);

    // Extrair partes do código: EF + grade(2) + subject(2) + number(2)
    const gradeCode   = code.substring(2, 4);  // ex: "06"
    const subjectCode = code.substring(4, 6);  // ex: "MA"
    const subject     = SUBJECT_MAP[subjectCode] || subjectCode;
    const grade       = GRADE_MAP[gradeCode];
    const gradeRange  = determineGradeRange(gradeCode);
    const stage       = determineStage(gradeCode);

    competencies.push({
      code,
      description,
      subject,
      subject_code: subjectCode,
      grade,
      grade_range: gradeRange,
      stage,
      theme: null,  // pode ser enriquecido depois
    });
  }

  return competencies;
}

function determineStage(gradeCode) {
  const num = parseInt(gradeCode);
  if (num <= 5 || gradeCode === '15' || gradeCode === '35') {
    return 'Ensino Fundamental — Anos Iniciais';
  }
  return 'Ensino Fundamental — Anos Finais';
}

function determineGradeRange(gradeCode) {
  // Para códigos que cobrem múltiplos anos
  const ranges = {
    '15': '1º ao 5º ano',
    '35': '3º ao 5º ano',
    '69': '6º ao 9º ano',
    '67': '6º e 7º ano',
    '89': '8º e 9º ano',
  };
  if (ranges[gradeCode]) return ranges[gradeCode];

  const num = parseInt(gradeCode);
  if (num <= 5) return '1º ao 5º ano (Anos Iniciais)';
  return '6º ao 9º ano (Anos Finais)';
}

// ─── Gerar embeddings em batch ────────────────────────────────────────────────

async function generateEmbeddings(texts) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts,
  });
  return response.data.map(item => item.embedding);
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Verificar competências já importadas ────────────────────────────────────

async function getExistingCodes() {
  const { data, error } = await supabase
    .from('bncc_competencies')
    .select('code');

  if (error) throw error;
  return new Set(data.map(row => row.code));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(chalk.blue.bold('\n🎓 ProvaAI — Importador da BNCC\n'));

  // 1. Verificar PDF
  if (!fs.existsSync(PDF_PATH)) {
    console.error(chalk.red(`❌ PDF não encontrado em: ${PDF_PATH}`));
    console.error('Certifique-se que o arquivo está na raiz do projeto.');
    process.exit(1);
  }

  console.log(chalk.yellow(`📄 Lendo PDF: ${path.basename(PDF_PATH)}`));
  console.log(chalk.gray('   (600 páginas, isso pode levar ~1 minuto...)'));

  // 2. Parsear PDF
  const pdfBuffer = fs.readFileSync(PDF_PATH);
  const pdfData   = await pdf(pdfBuffer);
  const text      = pdfData.text;

  console.log(chalk.green(`✅ PDF lido! ${pdfData.numpages} páginas, ${text.length.toLocaleString()} caracteres`));

  // 3. Extrair competências
  console.log(chalk.yellow('\n🔍 Extraindo habilidades da BNCC...'));
  const competencies = extractBNCCCompetencies(text);

  if (competencies.length === 0) {
    console.error(chalk.red('❌ Nenhuma competência encontrada!'));
    console.error('O PDF pode estar em formato diferente do esperado.');
    // Salvar amostra do texto para debug
    fs.writeFileSync(path.join(__dirname, 'pdf_sample.txt'), text.substring(0, 5000));
    console.log(chalk.gray('   Amostra do texto salva em scripts/pdf_sample.txt para diagnóstico'));
    process.exit(1);
  }

  // Estatísticas do que foi encontrado
  const bySubject = {};
  competencies.forEach(c => {
    bySubject[c.subject] = (bySubject[c.subject] || 0) + 1;
  });

  console.log(chalk.green(`✅ ${competencies.length} habilidades encontradas!\n`));
  console.log(chalk.gray('   Por disciplina:'));
  Object.entries(bySubject).sort((a, b) => b[1] - a[1]).forEach(([subj, count]) => {
    console.log(chalk.gray(`   • ${subj}: ${count}`));
  });

  // 4. Verificar quais já foram importadas (para retomar se interrompido)
  console.log(chalk.yellow('\n🔎 Verificando importações anteriores...'));
  const existingCodes  = await getExistingCodes();
  const toImport = competencies.filter(c => !existingCodes.has(c.code));

  if (existingCodes.size > 0) {
    console.log(chalk.green(`   ✅ ${existingCodes.size} já importadas, pulando...`));
  }
  console.log(chalk.blue(`   📥 ${toImport.length} para importar agora`));

  if (toImport.length === 0) {
    console.log(chalk.green.bold('\n🎉 Todas as habilidades já foram importadas!'));
    return;
  }

  // 5. Gerar embeddings e importar em batches
  console.log(chalk.yellow(`\n🤖 Gerando embeddings com OpenAI (batches de ${BATCH_SIZE})...`));
  console.log(chalk.gray('   Custo estimado: ~$0.05 para toda a BNCC\n'));

  const progressBar = new cliProgress.SingleBar({
    format: `${chalk.cyan('{bar}')} {percentage}% | {value}/{total} | ETA: {eta}s | {code}`,
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
  });

  progressBar.start(toImport.length, 0, { code: 'iniciando...' });

  let imported = 0;
  let errors   = 0;

  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE);

    try {
      // Texto para embedding: código + descrição (dá mais contexto semântico)
      const texts = batch.map(c =>
        `Habilidade BNCC ${c.code}: ${c.description}. Disciplina: ${c.subject}. ${c.grade || c.grade_range}.`
      );

      // Gerar embeddings
      const embeddings = await generateEmbeddings(texts);

      // Preparar rows para inserção
      const rows = batch.map((c, idx) => ({
        code:        c.code,
        description: c.description,
        subject:     c.subject,
        stage:       c.stage,
        grade_range: c.grade_range,
        grade:       c.grade || null,
        theme:       c.theme,
        embedding:   JSON.stringify(embeddings[idx]),  // pgvector aceita array
      }));

      // Inserir no Supabase (upsert = atualiza se já existir)
      const { error } = await supabase
        .from('bncc_competencies')
        .upsert(rows, { onConflict: 'code' });

      if (error) {
        console.error(chalk.red(`\n   Erro ao inserir batch: ${error.message}`));
        errors += batch.length;
      } else {
        imported += batch.length;
      }

    } catch (err) {
      console.error(chalk.red(`\n   Erro no batch ${i}: ${err.message}`));
      errors += batch.length;
    }

    progressBar.update(Math.min(i + BATCH_SIZE, toImport.length), {
      code: batch[batch.length - 1]?.code || '...'
    });

    // Rate limiting: esperar entre batches
    if (i + BATCH_SIZE < toImport.length) {
      await sleep(DELAY_MS);
    }
  }

  progressBar.stop();

  // 6. Resumo final
  console.log(chalk.green.bold(`\n✅ Importação concluída!`));
  console.log(chalk.green(`   • ${imported} habilidades importadas com embeddings`));
  if (errors > 0) {
    console.log(chalk.red(`   • ${errors} erros (rode novamente para tentar de novo)`));
  }
  console.log(chalk.blue(`\n   Total no banco: ${existingCodes.size + imported} habilidades BNCC`));
  console.log(chalk.gray('   Busca vetorial pronta para uso no ProvaAI! 🎓\n'));
}

main().catch(err => {
  console.error(chalk.red('\n❌ Erro fatal:'), err);
  process.exit(1);
});
