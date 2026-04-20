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

async function resetPassword() {
  const email = 'examyxempresa@outlook.com';
  const userId = 'ad95fc58-1d9f-4731-bcea-ef7e8a88ddc7';
  const newPassword = 'ProvaAI123!';
  
  console.log(`🔐 Resetando senha para: ${email}...`);
  
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );
  
  if (error) {
    console.error('❌ Erro ao resetar senha:', error.message);
  } else {
    console.log('✅ Senha resetada com sucesso!');
    console.log(`Email: ${email}`);
    console.log(`Nova Senha: ${newPassword}`);
  }
}

resetPassword();
