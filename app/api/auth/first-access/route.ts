import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, password, checkOnly } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 })
    }

    // 1. Verificar se existe um perfil pré-cadastrado com esse e-mail
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuário não encontrado. Verifique seu e-mail ou contate sua escola.' }, { status: 404 })
    }

    // 2. Se for apenas uma verificação (Etapa 1), retornamos sucesso aqui
    if (checkOnly) {
      return NextResponse.json({ success: true })
    }

    // 3. Se tiver senha (Etapa 2), atualizamos o usuário no Auth
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: password
    })

    if (authError) throw authError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
