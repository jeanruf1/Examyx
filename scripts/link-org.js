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

async function linkOrg() {
  const userId = 'a74e2cad-a7d2-4561-bb9b-937a59976079';
  
  // Pegar a primeira escola
  const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
  
  if (!orgs || orgs.length === 0) {
    console.log('🏗️ Nenhuma escola encontrada. Criando uma escola padrão...');
    const { data: newOrg, error: orgError } = await supabase.from('organizations').insert({
      name: 'Escola Demonstrativa',
      slug: 'escola-demo',
      plan: 'pro'
    }).select().single();
    
    if (orgError) {
      console.error('❌ Erro ao criar escola:', orgError.message);
      return;
    }
    
    const { error: updateError } = await supabase.from('profiles').update({ org_id: newOrg.id }).eq('id', userId);
    if (updateError) console.error('❌ Erro ao vincular perfil:', updateError.message);
    else console.log('✅ Perfil vinculado à nova escola:', newOrg.name);
  } else {
    const { error: updateError } = await supabase.from('profiles').update({ org_id: orgs[0].id }).eq('id', userId);
    if (updateError) console.error('❌ Erro ao vincular perfil:', updateError.message);
    else console.log('✅ Perfil vinculado à escola existente:', orgs[0].name);
  }
}

linkOrg();
