'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function fechaColombia(offsetDias = 0) {
  const ahora = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' })
  )

  ahora.setDate(ahora.getDate() + offsetDias)

  const year = ahora.getFullYear()
  const month = String(ahora.getMonth() + 1).padStart(2, '0')
  const day = String(ahora.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function RegistrarMarcadorPage() {
  const [usuario, setUsuario] = useState<any>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaColombia(0))
  const [partidos, setPartidos] = useState<any[]>([])
  const [marcadores, setMarcadores] = useState<any>({})
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    validarAdmin()
  }, [])

  useEffect(() => {
    if (esAdmin) {
      cargarPartidos(fechaSeleccionada)
    }
  }, [esAdmin, fechaSeleccionada])

  async function validarAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    setUsuario(user)

    const { data, error } = await supabase
      .from('administradores')
      .select('usuario_id')
      .eq('usuario_id', user.id)
      .single()

    if (error || !data) {
      setMensaje('No tienes permisos para registrar marcadores.')
      setEsAdmin(false)
      return
    }

    setEsAdmin(true)
  }

  async function cargarPartidos(fecha: string) {
    setCargando(true)
    setMensaje('')

    const inicio = `${fecha}T00:00:00-05:00`
    const fin = `${fecha}T23:59:59-05:00`

    const { data, error } = await supabase
      .from('partidos')
      .select(`
        id,
        grupo,
        fecha_hora,
        goles_equipo_1_real,
        goles_equipo_2_real,
        equipo_1:equipos!partidos_equipo_1_id_fkey(id, nombre),
        equipo_2:equipos!partidos_equipo_2_id_fkey(id, nombre)
      `)
      .gte('fecha_hora', inicio)
      .lte('fecha_hora', fin)
      .order('fecha_hora', { ascending: true })

    if (error) {
      setMensaje(error.message)
      setCargando(false)
      return
    }

    setPartidos(data || [])

    const iniciales: any = {}

    ;(data || []).forEach((partido: any) => {
      iniciales[partido.id] = {
        goles1: partido.goles_equipo_1_real ?? '',
        goles2: partido.goles_equipo_2_real ?? '',
      }
    })

    setMarcadores(iniciales)
    setCargando(false)
  }

  function cambiarMarcador(partidoId: number, campo: string, valor: string) {
    setMarcadores({
      ...marcadores,
      [partidoId]: {
        ...marcadores[partidoId],
        [campo]: valor,
      },
    })
  }

  async function registrarResultado(partidoId: number) {
    const marcador = marcadores[partidoId]

    if (
      !marcador ||
      marcador.goles1 === '' ||
      marcador.goles2 === '' ||
      Number(marcador.goles1) < 0 ||
      Number(marcador.goles2) < 0
    ) {
      setMensaje('Debes ingresar un marcador válido.')
      return
    }

    const confirmar = confirm(
      '¿Confirmas registrar este resultado? Esto actualizará los puntos de todos los usuarios.'
    )

    if (!confirmar) return

    const { error } = await supabase.rpc('registrar_resultado_partido', {
      p_partido_id: partidoId,
      p_goles_1: Number(marcador.goles1),
      p_goles_2: Number(marcador.goles2),
    })

    if (error) {
      setMensaje(error.message)
      return
    }

    setMensaje('Resultado registrado y puntajes actualizados correctamente.')
    cargarPartidos(fechaSeleccionada)

    setTimeout(() => setMensaje(''), 3000)
  }

  if (!esAdmin) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-yellow-400 p-6 text-gray-900">
        <div className="max-w-4xl mx-auto">
          <header className="bg-white rounded-[2rem] shadow-2xl border-4 border-yellow-400 p-6 mb-6">
            <div className="text-5xl mb-2">🔐⚽</div>

            <h1 className="text-3xl md:text-4xl font-black text-green-800">
              Registrar marcador
            </h1>

            <p className="text-gray-700 mt-2 font-medium">
              Esta sección solo está disponible para la administración.
            </p>
          </header>

          <section className="bg-red-100 border border-red-400 rounded-3xl p-5 shadow-xl">
            <p className="font-black text-red-800">
              {mensaje || 'Validando permisos...'}
            </p>

            <button
              className="mt-5 bg-white text-green-800 border-2 border-green-800 hover:bg-green-50 font-black rounded-xl px-5 py-3"
              onClick={() => (window.location.href = '/')}
            >
              Volver al inicio
            </button>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-yellow-400 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white rounded-[2rem] shadow-2xl border-4 border-yellow-400 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-5xl mb-2">🛠️⚽</div>

              <h1 className="text-3xl md:text-4xl font-black text-green-800">
                Registrar marcador final
              </h1>

              <p className="text-gray-700 mt-2 font-medium">
                Actualiza el resultado oficial de cada partido y recalcula los puntos automáticamente.
              </p>

              {usuario && (
                <p className="text-sm text-gray-600 mt-2">
                  Sesión administrativa: {usuario.email}
                </p>
              )}
            </div>

            <button
              className="bg-white text-green-800 border-2 border-green-800 hover:bg-green-50 font-black rounded-xl px-5 py-3"
              onClick={() => (window.location.href = '/')}
            >
              Volver al inicio
            </button>
          </div>
        </header>

        <section className="bg-white rounded-3xl shadow-xl p-5 mb-6">
          <h2 className="text-xl font-black text-green-800 mb-4">
            Seleccionar fecha
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              className="bg-green-800 hover:bg-green-900 text-white font-black rounded-2xl px-5 py-3 shadow-lg"
              onClick={() => setFechaSeleccionada(fechaColombia(0))}
            >
              Partidos de hoy
            </button>

            <button
              className="bg-green-800 hover:bg-green-900 text-white font-black rounded-2xl px-5 py-3 shadow-lg"
              onClick={() => setFechaSeleccionada(fechaColombia(-1))}
            >
              Partidos de ayer
            </button>

            <input
              type="date"
              className="border-2 border-gray-300 rounded-2xl px-5 py-3 text-gray-900 font-bold bg-white focus:outline-none focus:border-green-700"
              value={fechaSeleccionada}
              max={fechaColombia(0)}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
          </div>

          <p className="text-gray-700 mt-4 font-medium">
            Solo se permite registrar resultados de hoy o fechas anteriores.
          </p>
        </section>

        {mensaje && (
          <div className="bg-green-100 border border-green-400 rounded-2xl p-4 mb-6 text-green-900 font-bold">
            {mensaje}
          </div>
        )}

        {cargando && (
          <div className="bg-white rounded-3xl shadow-xl p-5 mb-6">
            <p className="text-gray-700 font-bold">Cargando partidos...</p>
          </div>
        )}

        {!cargando && partidos.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 rounded-2xl p-5 mb-6 text-yellow-900 font-bold">
            No hay partidos para la fecha seleccionada.
          </div>
        )}

        <section className="space-y-4">
          {partidos.map((partido: any) => (
            <div
              key={partido.id}
              className="bg-white rounded-3xl shadow-xl border border-gray-200 p-5"
            >
              <p className="text-sm text-gray-700 font-bold mb-4">
                Grupo {partido.grupo} · 🗓️ {formatearFecha(partido.fecha_hora)}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_40px_90px_1fr] gap-3 items-center">
                <p className="font-black text-lg text-green-900 md:text-right">
                  {partido.equipo_1.nombre}
                </p>

                <input
                  type="number"
                  min="0"
                  className="border-2 border-gray-300 rounded-2xl p-3 text-center text-xl font-black bg-white text-gray-900 focus:outline-none focus:border-green-700"
                  value={marcadores[partido.id]?.goles1 ?? ''}
                  onChange={(e) =>
                    cambiarMarcador(partido.id, 'goles1', e.target.value)
                  }
                />

                <p className="text-center font-black text-green-800">vs</p>

                <input
                  type="number"
                  min="0"
                  className="border-2 border-gray-300 rounded-2xl p-3 text-center text-xl font-black bg-white text-gray-900 focus:outline-none focus:border-green-700"
                  value={marcadores[partido.id]?.goles2 ?? ''}
                  onChange={(e) =>
                    cambiarMarcador(partido.id, 'goles2', e.target.value)
                  }
                />

                <p className="font-black text-lg text-green-900">
                  {partido.equipo_2.nombre}
                </p>
              </div>

              <button
                onClick={() => registrarResultado(partido.id)}
                className="mt-5 w-full md:w-auto bg-green-800 hover:bg-green-900 text-white font-black rounded-2xl px-5 py-3 shadow-lg"
              >
                Registrar resultado y actualizar puntos
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}