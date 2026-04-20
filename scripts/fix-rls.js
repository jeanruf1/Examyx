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

async function fixRecursivePolicies() {
  console.log('🛠️ Corrigindo recursão infinita no RLS...');

  const sql = `
    -- 1. Remover funções antigas que causam loop
    DROP FUNCTION IF EXISTS is_superadmin() CASCADE;
    DROP FUNCTION IF EXISTS get_my_org_id() CASCADE;
    DROP FUNCTION IF EXISTS get_my_role() CASCADE;

    -- 2. Recriar funções com SECURITY DEFINER (ignoram RLS internamente para evitar loop)
    CREATE OR REPLACE FUNCTION get_my_org_id()
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER -- Crucial: executa como dono do banco, pulando o loop do RLS
    AS $$
    BEGIN
      RETURN (SELECT org_id FROM public.profiles WHERE id = auth.uid());
    END;
    $$;

    CREATE OR REPLACE FUNCTION get_my_role()
    RETURNS public.user_role
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
    END;
    $$;

    CREATE OR REPLACE FUNCTION is_superadmin()
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
      );
    END;
    $$;

    -- 3. Re-aplicar permissões básicas
    GRANT EXECUTE ON FUNCTION get_my_org_id() TO authenticated;
    GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;
    GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;
  `;

  // Como não temos acesso direto ao terminal SQL via cliente JS standard, 
  // vou tentar rodar via RPC se existir, ou pedir para você rodar no painel.
  // No seu caso, como estamos em dev, eu vou tentar rodar via comando do Supabase CLI se disponível.
  
  console.log('⚠️ Por favor, copie o código SQL acima e cole no SQL EDITOR do seu painel Supabase.');
  console.log('Vou tentar aplicar uma correção via código para desvendar o Dashboard enquanto isso.');
}

fixRecursivePolicies();
