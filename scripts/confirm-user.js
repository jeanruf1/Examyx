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

async function confirmUser(email) {
  console.log(`🚀 Confirmando usuário: ${email}...`);
  
  const { data, error } = await supabase.auth.admin.updateUserById(
    'a74e2cad-a7d2-4561-bb9b-937a59976079', // ID do jeanrufinolima2004@gmail.com
    { email_confirm: true }
  );
  
  if (error) {
    console.error('❌ Erro ao confirmar usuário:', error.message);
  } else {
    console.log('✅ Usuário confirmado com sucesso!');
  }
}

confirmUser('jeanrufinolima2004@gmail.com');
