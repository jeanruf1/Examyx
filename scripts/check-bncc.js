import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  console.log(chalk.blue.bold('\n🔍 Verificando BNCC no Supabase...\n'));

  // Total de habilidades
  const { count: total } = await supabase
    .from('bncc_competencies')
    .select('*', { count: 'exact', head: true });

  console.log(chalk.green(`✅ Total de habilidades: ${total}`));

  // Por disciplina
  const { data: rows } = await supabase
    .from('bncc_competencies')
    .select('subject, grade_range');

  if (rows) {
    const bySubject = {};
    rows.forEach(r => {
      bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
    });

    console.log(chalk.yellow('\n📚 Por disciplina:'));
    Object.entries(bySubject).sort((a, b) => b[1] - a[1]).forEach(([subj, count]) => {
      const bar = '█'.repeat(Math.round(count / 5));
      console.log(`   ${chalk.cyan(subj.padEnd(25))} ${bar} ${chalk.gray(count)}`);
    });
  }

  // Amostra de habilidades
  const { data: sample } = await supabase
    .from('bncc_competencies')
    .select('code, description, subject, grade')
    .limit(5)
    .order('code');

  console.log(chalk.yellow('\n📝 Amostra das primeiras habilidades:'));
  sample?.forEach(row => {
    console.log(chalk.gray(`   [${row.code}] ${row.subject} | ${row.grade || 'Multi-série'}`));
    console.log(chalk.white(`   ${row.description.substring(0, 100)}...`));
    console.log();
  });

  // Verificar se embeddings foram gerados
  const { count: withEmbedding } = await supabase
    .from('bncc_competencies')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  console.log(chalk.green(`✅ Com embeddings: ${withEmbedding}/${total}`));

  if (withEmbedding < total) {
    console.log(chalk.red(`\n⚠️  ${total - withEmbedding} habilidades SEM embedding!`));
    console.log(chalk.yellow('   Rode: npm run import  para completar'));
  } else if (total > 0) {
    console.log(chalk.green.bold('\n🎉 BNCC totalmente importada e vetorizada!\n'));
  }
}

main().catch(console.error);
