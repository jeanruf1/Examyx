import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, orgId } = await req.json()

    if (!email || !orgId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // 0. Verifica se o perfil já existe na organização
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return NextResponse.json({ error: 'Este e-mail já está pré-cadastrado.' }, { status: 400 })
    }

    // 1. Criar o perfil "vazio" (Apenas para o professor poder 'reivindicar' depois)
    // Usamos um UUID temporário ou apenas inserimos se a tabela permitir
    // Como a tabela profiles geralmente depende de um ID do Auth, 
    // vamos criar o usuário no Auth mas com uma senha aleatória que ninguém sabe.
    const tempPassword = Math.random().toString(36).slice(-12)
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })

    if (authError) throw authError

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        full_name: fullName,
        org_id: orgId,
        role: 'teacher',
        email: email // Guardamos o email para a busca do 'Primeiro Acesso'
      })

    if (profileError) throw profileError

    return NextResponse.json({ success: true, userId: authUser.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
