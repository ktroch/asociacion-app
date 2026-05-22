import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, User, Phone, Mail, MapPin, Calendar, Hash, Briefcase } from 'lucide-react'

export default function DetallePersonal() {
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const [persona, setPersona]   = useState(null)
  const [extra, setExtra]       = useState(null)
  const [cargando, setCargando] = useState(true)
  const [fotoError, setFotoError] = useState(false)

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('persona')
      .select(`*, funcionario(*), docente(*)`)
      .eq('id', id)
      .single()

    if (data) {
      setPersona(data)
      setExtra(
        data.rol === 'funcionario' ? data.funcionario?.[0] :
        data.rol === 'docente'     ? data.docente?.[0]     : null
      )
    }
    setCargando(false)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (!persona) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Persona no encontrada</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/personal')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Detalle del personal</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Tarjeta de perfil */}
        <div className="bg-[#1e3a6e] rounded-2xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#162d58] border-2 border-white/20 flex-shrink-0 flex items-center justify-center">
            {persona.foto_url && !fotoError ? (
              <img
                src={persona.foto_url}
                className="w-full h-full object-cover"
                alt="foto"
                onError={() => setFotoError(true)}
              />
            ) : (
              <User size={28} className="text-white/30" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-1 inline-block
              ${persona.rol === 'funcionario' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
              {persona.rol}
            </span>
            <p className="text-white font-bold text-base leading-tight">
              {persona.apellido}, {persona.nombre}
            </p>
            <p className="text-blue-200 text-xs mt-1 font-mono truncate">{persona.codigo_unico}</p>
            {extra && (
              <p className="text-blue-200 text-xs mt-1">
                {persona.rol === 'funcionario' ? extra.cargo : extra.especialidad}
              </p>
            )}
          </div>
        </div>

        {/* Botón editar */}
        <button
          onClick={() => navigate(`/funcionario/personal/${id}/editar`)}
          className="bg-white text-[#1e3a6e] border border-[#1e3a6e] rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#eef2fa] transition-colors"
        >
          Editar datos
        </button>

        {/* Información */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Información completa</p>
          {[
            { icono: Hash,     label: 'Código único',  valor: persona.codigo_unico },
            { icono: User,     label: 'Documento',     valor: `${persona.tipo_documento.replace(/_/g,' ')} · ${persona.num_documento}` },
            { icono: Calendar, label: 'Nacimiento',    valor: formatFecha(persona.fecha_nacimiento) },
            { icono: Phone,    label: 'Teléfono',      valor: persona.telefono  || '—' },
            { icono: Mail,     label: 'Email',         valor: persona.email     || '—' },
            { icono: MapPin,   label: 'Dirección',     valor: persona.direccion || '—' },
            { icono: Briefcase,label: persona.rol === 'funcionario' ? 'Cargo' : 'Especialidad',
              valor: persona.rol === 'funcionario' ? extra?.cargo || '—' : extra?.especialidad || '—' },
          ].map(({ icono: Icono, label, valor }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="bg-[#eef2fa] rounded-lg p-1.5 flex-shrink-0">
                <Icono size={14} className="text-[#1e3a6e]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-700">{valor}</p>
              </div>
            </div>
          ))}

          {/* Username */}
          {persona.username && (
            <div className="flex items-start gap-3">
              <div className="bg-[#eef2fa] rounded-lg p-1.5 flex-shrink-0">
                <User size={14} className="text-[#1e3a6e]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Usuario de acceso</p>
                <p className="text-sm text-gray-700 font-mono">{persona.username}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}