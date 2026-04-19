import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 })
    }

    // 1. Deletar do Auth (Isso automaticamente remove o perfil se houver Cascade, mas vamos garantir)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // 2. Garantir que o perfil foi removido
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
