import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Plus, Search, ChevronRight, Star } from 'lucide-react'

export default function Patrocinadores() {
  const navigate = useNavigate()
  const [patrocinadores, setPatrocinadores] = useState([])
  const [busqueda, setBusqueda]             = useState('')
  const [cargando, setCargando]             = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('patrocinador')
      .select('*')
      .order('nombre')
    setPatrocinadores(data || [])
    setCargando(false)
  }

  const filtrados = patrocinadores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const tipoLabel = (tipo) =>
    tipo === 'persona_juridica' ? 'Empresa / Entidad' : 'Persona natural'

  const tipoColor = (tipo) =>
    tipo === 'persona_juridica'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-green-100 text-green-700'

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario')}><ArrowLeft size={20} /></button>
          <Star size={20} />
          <span className="font-bold text-base">Patrocinadores</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar patrocinador..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
            />
          </div>
          <button
            onClick={() => navigate('/funcionario/patrocinadores/nuevo')}
            className="bg-[#1e3a6e] text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium hover:bg-[#162d58] transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Star size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay patrocinadores registrados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtrados.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/funcionario/patrocinadores/${p.id}`)}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-md transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-[#1e3a6e] text-sm">{p.nombre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor(p.tipo)}`}>
                      {tipoLabel(p.tipo)}
                    </span>
                  </div>
                  {p.contacto && <p className="text-xs text-gray-400">{p.contacto}</p>}
                  {p.uid && (
                    <p className="text-xs text-gray-300 font-mono">{p.tipo_uid?.toUpperCase()}: {p.uid}</p>
                    )}
                  {p.email    && <p className="text-xs text-gray-300">{p.email}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}