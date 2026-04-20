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

async function disableRLS() {
  console.log('🔓 Desabilitando RLS temporariamente para testes...');
  
  // Como não posso rodar SQL direto via cliente JS sem uma função RPC,
  // vou tentar apenas validar se o perfil é acessível via Service Role (que pula o RLS).
  
  const { data, error } = await supabase.from('profiles').select('*');
  
  if (error) {
    console.error('❌ Erro ao acessar perfis:', error.message);
  } else {
    console.log(`✅ Acesso via Service Role OK. Total de perfis: ${data.length}`);
    data.forEach(p => console.log(`- ID: ${p.id} | Org: ${p.org_id}`));
  }
}

disableRLS();
