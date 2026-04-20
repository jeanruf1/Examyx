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

async function checkUsers() {
  console.log('🔍 Verificando usuários no Supabase...');
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    return;
  }
  
  console.log(`✅ Total de usuários: ${users.length}`);
  users.forEach(u => {
    console.log(`- Email: ${u.email} | ID: ${u.id} | Confirmado: ${!!u.email_confirmed_at}`);
  });
}

checkUsers();
