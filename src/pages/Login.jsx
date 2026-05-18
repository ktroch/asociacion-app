import { useState } from 'react'
import { supabase } from '../services/supabase'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    const { data, error } = await supabase
      .from('persona')
      .select('id, nombre, apellido, rol, username')
      .eq('username', username.toLowerCase().trim())
      .single()

    if (error || !data) {
      setError('Usuario no encontrado')
      setCargando(false)
      return
    }

    // Por ahora verificamos password simple, luego lo securizamos
    const { data: auth, error: authError } = await supabase
      .from('persona')
      .select('id')
      .eq('username', username.toLowerCase().trim())
      .eq('password_hash', password)
      .single()

    if (authError || !auth) {
      setError('Contraseña incorrecta')
      setCargando(false)
      return
    }

    // Guardamos sesión en localStorage por ahora
    localStorage.setItem('usuario', JSON.stringify(data))
    window.location.href = data.rol === 'funcionario' ? '/funcionario' : '/docente'
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/icon-512.png" alt="Logo APA" className="h-24 object-contain" />
        </div>

        {/* Título */}
        <h1 className="text-center text-[#1e3a6e] text-2xl font-bold mb-1">
          Bienvenido
        </h1>
        <p className="text-center text-[#4a4a4a] text-sm mb-6">
          Aprende, Prepárate y Avanza
        </p>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-[#4a4a4a] font-medium mb-1 block">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="ej: jgomez"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
            />
          </div>

          <div>
            <label className="text-sm text-[#4a4a4a] font-medium mb-1 block">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
            />
          </div>

          {error && (
            <p className="text-[#c0152a] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="bg-[#1e3a6e] text-white rounded-lg py-2.5 font-medium hover:bg-[#162d58] transition-colors disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          APA © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}