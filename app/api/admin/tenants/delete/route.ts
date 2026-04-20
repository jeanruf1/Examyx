import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Verificar se é superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { tenantId } = await req.json()
    if (!tenantId) return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 })

    const serviceClient = createServiceClient()

    // 1. Buscar todos os perfis ligados a essa escola
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('org_id', tenantId)

    // ── TRAVA DE SEGURANÇA ──────────────────────────────────────────────
    // Filtrar para NUNCA deletar a si mesmo (o admin que está logado)
    const userIds = (profiles?.map(p => p.id) || []).filter(id => id !== user.id)

    // 2. Deletar usuários do Supabase Auth (Exceto você mesmo)
    for (const uid of userIds) {
      const { error: authError } = await serviceClient.auth.admin.deleteUser(uid)
      if (authError) console.error(`[Delete Auth User ${uid}]`, authError.message)
    }

    // 3. Deletar a organização
    // Se você estiver nela, seu profile.org_id ficará NULL ou será deletado 
    // dependendo da FK, mas seu LOGIN (Auth) estará salvo.
    const { error: deleteError } = await serviceClient
      .from('organizations')
      .delete()
      .eq('id', tenantId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[Delete Tenant]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
