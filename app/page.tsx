'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    validarSesion()
  }, [])

  async function validarSesion() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', user.id)
    .single()

  setUsuario({
    ...user,
    nombre: perfil?.nombre || user.email,
  })
  }

  async function salir() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const opciones = [
    {
      titulo: 'Tabla de posiciones',
      descripcion: 'Consulta el ranking general de participantes.',
      ruta: '/posiciones',
      emoji: '🏆',
    },
    {
      titulo: 'Pronósticos por fecha',
      descripcion: 'Registra marcadores de mañana, pasado mañana o una fecha futura.',
      ruta: '/pronosticos-fecha',
      emoji: '📅',
    },
    {
      titulo: 'Pronósticos por grupo',
      descripcion: 'Registra marcadores organizados por grupo.',
      ruta: '/pronosticos-grupo',
      emoji: '⚽',
    },
    {
      titulo: 'Resultados',
      descripcion: 'Consulta pronósticos y puntajes por partido.',
      ruta: '/resultados',
      emoji: '📊',
    },
    {
      titulo: 'Reglamento',
      descripcion: 'Consulta las reglas oficiales de La Polla del Mundial.',
      ruta: '/reglas',
      emoji: '📜',
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-700 via-green-600 to-yellow-400 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white/95 rounded-3xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-green-800">
                La Polla del Mundial
              </h1>
              <p className="text-gray-600 mt-2">
                Después de 30 años… esta polla ya es tradición 😎
              </p>
              {usuario && (
                <p className="text-sm text-gray-500 mt-1">
                  Sesión iniciada:<b> {usuario.nombre}</b>
                </p>
              )}
            </div>

            <button
              onClick={salir}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-5 py-3"
            >
              Salir
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opciones.map((opcion) => (
            <button
              key={opcion.ruta}
              onClick={() => (window.location.href = opcion.ruta)}
              className="bg-white rounded-3xl p-6 text-left shadow-xl border-4 border-transparent hover:border-yellow-400 hover:scale-[1.02] transition"
            >
              <div className="text-5xl mb-4">{opcion.emoji}</div>

              <h2 className="text-2xl font-black text-green-800 mb-2">
                {opcion.titulo}
              </h2>

              <p className="text-gray-600">
                {opcion.descripcion}
              </p>
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}