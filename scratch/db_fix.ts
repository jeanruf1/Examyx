import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function applyFix() {
  console.log('Aplicando correção na tabela exams...')
  const { error } = await supabase.rpc('apply_pill_column_fix', {})
  
  // Se o RPC não existir, vamos tentar via query direta se possível (mas o Supabase limita isso)
  // O melhor é pedir para o usuário rodar no painel SQL:
  console.log('Por favor, execute este comando no seu SQL Editor do Supabase:')
  console.log('ALTER TABLE exams ADD COLUMN IF NOT EXISTS review_pill JSONB;')
}

applyFix()
