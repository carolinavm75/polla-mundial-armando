'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  async function registrar() {
    setMensaje('')
    setCargando(true)

    if (!nombre || !email || !password) {
      setMensaje('Debes completar nombre, correo y contraseña.')
      setCargando(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
        },
      },
    })

    if (error) {
      setMensaje(error.message)
      setCargando(false)
      return
    }

    if (!data.user) {
      setMensaje('No se pudo crear el usuario.')
      setCargando(false)
      return
    }

    const { error: errorUsuario } = await supabase.from('usuarios').insert({
      id: data.user.id,
      nombre,
      correo: email,
    })

    if (errorUsuario) {
      setMensaje(errorUsuario.message)
      setCargando(false)
      return
    }

    const { data: partidos, error: errorPartidos } = await supabase
      .from('partidos')
      .select('id')

    if (errorPartidos) {
      setMensaje(errorPartidos.message)
      setCargando(false)
      return
    }

    const pronosticosIniciales = (partidos || []).map((partido) => ({
      usuario_id: data.user!.id,
      partido_id: partido.id,
      goles_equipo_1: 0,
      goles_equipo_2: 0,
      puntos: null,
    }))

    const { error: errorPronosticos } = await supabase
      .from('pronosticos')
      .insert(pronosticosIniciales)

    if (errorPronosticos) {
      setMensaje(errorPronosticos.message)
      setCargando(false)
      return
    }

    setMensaje('Usuario registrado correctamente. Ahora puedes iniciar sesión.')
    setCargando(false)

    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-yellow-400 flex items-center justify-center p-6 text-gray-900">
      <section className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-yellow-400">
        <div className="bg-green-800 text-white p-6 text-center">
          <div className="text-5xl mb-3">⚽🔥</div>
          <h1 className="text-3xl font-black">Crear cuenta</h1>
          <p className="text-yellow-300 font-bold mt-2">
            Entra a competir por la gloria mundialista
          </p>
        </div>

        <div className="p-6 space-y-4">
          <input
            className="w-full border-2 border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-green-700"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <input
            className="w-full border-2 border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-green-700"
            placeholder="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border-2 border-gray-300 rounded-xl p-3 text-gray-900 focus:outline-none focus:border-green-700"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={registrar}
            disabled={cargando}
            className="w-full bg-green-800 hover:bg-green-900 text-white font-black rounded-xl p-3 shadow-lg disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Registrarme'}
          </button>

          <button
            onClick={() => (window.location.href = '/login')}
            className="w-full border-2 border-green-800 text-green-800 font-black rounded-xl p-3"
          >
            Ya tengo cuenta
          </button>

          {mensaje && (
            <p className="text-sm font-bold text-center text-red-700">
              {mensaje}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}