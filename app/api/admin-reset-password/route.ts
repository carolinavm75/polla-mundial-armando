import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { adminId, userId, nuevaPassword } = await request.json()

  if (!adminId || !userId || !nuevaPassword) {
    return NextResponse.json(
      { error: 'Faltan datos para actualizar la contraseña.' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('administradores')
    .select('usuario_id')
    .eq('usuario_id', adminId)
    .single()

  if (adminError || !adminData) {
    return NextResponse.json(
      { error: 'No autorizado.' },
      { status: 403 }
    )
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: nuevaPassword,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    mensaje: 'Contraseña actualizada correctamente.',
  })
}
