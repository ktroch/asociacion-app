import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Mail, Phone, User, Hash, Building2, Pencil } from 'lucide-react'

export default function DetallePatrocinador() {
  const { id }                    = useParams()
  const navigate                  = useNavigate()
  const [p, setP]                 = useState(null)
  const [cargando, setCargando]   = useState(true)

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('patrocinador')
      .select('*')
      .eq('id', id)
      .single()
    setP(data)
    setCargando(false)
  }

  const tipoLabel = (tipo) =>
    tipo === 'persona_juridica' ? 'Empresa / Entidad' : 'Persona natural'

  const tipoColor = (tipo) =>
    tipo === 'persona_juridica'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-green-100 text-green-700'

  if (cargando) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (!p) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Patrocinador no encontrado</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/patrocinadores')}>
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-base">Detalle del patrocinador</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Tarjeta de perfil */}
        <div className="bg-[#1e3a6e] rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-[#162d58] rounded-xl p-3 flex-shrink-0">
              {p.tipo === 'persona_juridica'
                ? <Building2 size={28} className="text-white/70" />
                : <User      size={28} className="text-white/70" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-2 inline-block ${tipoColor(p.tipo)}`}>
                {tipoLabel(p.tipo)}
              </span>
              <p className="text-white font-bold text-base leading-tight">{p.nombre}</p>
              {p.contacto && (
                <p className="text-blue-200 text-sm mt-1">Contacto: {p.contacto}</p>
              )}
              {p.uid && (
                <p className="text-blue-200 text-xs mt-1 font-mono">
                  {p.tipo_uid?.toUpperCase()}: {p.uid}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botón editar */}
        <button
          onClick={() => navigate(`/funcionario/patrocinadores/${id}/editar`)}
          className="bg-white text-[#1e3a6e] border border-[#1e3a6e] rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#eef2fa] transition-colors"
        >
          <Pencil size={15} />
          Editar patrocinador
        </button>

        {/* Información */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Información completa</p>

          {[
            { icono: Mail,  label: 'Email',    valor: p.email    || '—' },
            { icono: Phone, label: 'Teléfono', valor: p.telefono || '—' },
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

          {p.uid && (
            <div className="flex items-start gap-3">
              <div className="bg-[#eef2fa] rounded-lg p-1.5 flex-shrink-0">
                <Hash size={14} className="text-[#1e3a6e]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  {p.tipo_uid?.toUpperCase() || 'Identificación fiscal'}
                </p>
                <p className="text-sm text-gray-700 font-mono">{p.uid}</p>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}