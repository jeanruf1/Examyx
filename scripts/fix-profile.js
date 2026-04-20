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

async function checkProfile() {
  const email = 'jeanrufinolima2004@gmail.com';
  const userId = 'a74e2cad-a7d2-4561-bb9b-937a59976079';
  
  console.log(`🔍 Verificando perfil para: ${email}...`);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('❌ Erro no perfil:', profileError.message);
    
    // Se não existir perfil, talvez precisemos criar um e associar a uma escola
    if (profileError.code === 'PGRST116') {
      console.log('⚠️ Perfil não encontrado. Tentando criar um perfil de teste...');
      
      // Pegar a primeira organização se existir
      const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
      
      if (orgs && orgs.length > 0) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: userId,
          org_id: orgs[0].id,
          full_name: 'Jean Rufino',
          role: 'superadmin'
        });
        
        if (insertError) console.error('❌ Erro ao criar perfil:', insertError.message);
        else console.log('✅ Perfil criado e associado à escola:', orgs[0].name);
      } else {
        console.error('❌ Nenhuma organização encontrada para associar.');
      }
    }
  } else {
    console.log('✅ Perfil encontrado:', profile.full_name);
    console.log('🏫 Escola:', profile.organizations?.name || 'Nenhuma');
  }
}

checkProfile();
