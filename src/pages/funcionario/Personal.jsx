import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Plus, Search, ChevronRight, UserCog } from 'lucide-react'

export default function Personal() {
  const navigate = useNavigate()
  const [personas, setPersonas]     = useState([])
  const [busqueda, setBusqueda]     = useState('')
  const [filtroRol, setFiltroRol]   = useState('todos')
  const [cargando, setCargando]     = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('persona')
      .select(`
        id, nombre, apellido, codigo_unico, rol, email, telefono,
        funcionario(id, cargo, estado),
        docente(id, especialidad, estado)
      `)
      .in('rol', ['funcionario', 'docente'])
      .order('apellido')
    setPersonas(data || [])
    setCargando(false)
  }

  const filtrados = personas.filter(p => {
    const coincideRol = filtroRol === 'todos' || p.rol === filtroRol
    const coincideBusqueda = `${p.nombre} ${p.apellido} ${p.codigo_unico}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
    return coincideRol && coincideBusqueda
  })

  const rolColor = (rol) =>
    rol === 'funcionario'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700'

  const estadoPersona = (p) => {
    if (p.rol === 'funcionario') return p.funcionario?.[0]?.estado || '—'
    if (p.rol === 'docente')     return p.docente?.[0]?.estado    || '—'
    return '—'
  }

  const subinfo = (p) => {
    if (p.rol === 'funcionario') return p.funcionario?.[0]?.cargo       || 'Sin cargo'
    if (p.rol === 'docente')     return p.docente?.[0]?.especialidad    || 'Sin especialidad'
    return ''
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario')}><ArrowLeft size={20} /></button>
          <UserCog size={20} />
          <span className="font-bold text-base">Personal</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Filtro por rol */}
        <div className="flex gap-2 mb-3">
          {[
            { value: 'todos',       label: 'Todos'        },
            { value: 'funcionario', label: 'Funcionarios' },
            { value: 'docente',     label: 'Docentes'     },
          ].map(op => (
            <button
              key={op.value}
              onClick={() => setFiltroRol(op.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border
                ${filtroRol === op.value
                  ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a6e]'
                }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Barra de búsqueda y botón nuevo */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
            />
          </div>
          <button
            onClick={() => navigate('/funcionario/miembros/nuevo')}
            className="bg-[#1e3a6e] text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium hover:bg-[#162d58] transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserCog size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay personal registrado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtrados.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/funcionario/personal/${p.id}`)}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-md transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-[#1e3a6e] text-sm">
                      {p.apellido}, {p.nombre}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolColor(p.rol)}`}>
                      {p.rol}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{subinfo(p)}</p>
                  <p className="text-xs text-gray-300 font-mono">{p.codigo_unico}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${estadoPersona(p) === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {estadoPersona(p)}
                  </span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}