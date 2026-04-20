import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCodes() {
  const codes = ['EF07CI04', 'EF07CI05', 'EF07CI06'];
  console.log(`🔍 Verificando códigos BNCC na sua base de dados...`);
  
  const { data, error } = await supabase
    .from('bncc_competencies')
    .select('code, description, grade, subject')
    .in('code', codes);
    
  if (error) {
    console.error('Erro:', error.message);
  } else {
    data.forEach(item => {
      console.log(`\n📌 Código: ${item.code}`);
      console.log(`📚 Disciplina: ${item.subject} | Ano: ${item.grade}`);
      console.log(`📝 Descrição: ${item.description}`);
    });
  }
}

checkCodes();
