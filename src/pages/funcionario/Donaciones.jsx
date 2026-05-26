import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Plus, Search, ChevronRight, HandHeart, Banknote, Package } from 'lucide-react'
import FiltroPeriodo from '../../components/FiltroPeriodo'

export default function Donaciones() {
  const navigate                          = useNavigate()
  const [donaciones, setDonaciones]       = useState([])
  const [busqueda, setBusqueda]           = useState('')
  const [filtroTipo, setFiltroTipo]       = useState('todos')
  const [periodo, setPeriodo]             = useState({ mes: '', anio: '' })
  const [cargando, setCargando]           = useState(true)

  useEffect(() => { cargar() }, [periodo])

  const cargar = async () => {
    setCargando(true)
    let query = supabase
      .from('donacion')
      .select(`*, patrocinador(nombre, tipo)`)
      .order('fecha', { ascending: false })

    if (periodo.anio) {
      const inicio = `${periodo.anio}-${periodo.mes || '01'}-01`
      const fin    = periodo.mes
        ? `${periodo.anio}-${periodo.mes}-31`
        : `${periodo.anio}-12-31`
      query = query.gte('fecha', inicio).lte('fecha', fin)
    }

    const { data } = await query
    setDonaciones(data || [])
    setCargando(false)
  }

  const filtradas = donaciones.filter(d => {
    const coincideTipo = filtroTipo === 'todos' || d.tipo === filtroTipo
    const coincideBusqueda = `${d.patrocinador?.nombre || ''} ${d.descripcion || ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
    return coincideTipo && coincideBusqueda
  })

  const totalDinero    = donaciones
    .filter(d => d.tipo === 'dinero')
    .reduce((acc, d) => acc + Number(d.monto || 0), 0)

  const totalMateriales = donaciones.filter(d => d.tipo === 'material').length

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const tipoColor = (tipo) =>
    tipo === 'dinero'
      ? 'bg-green-100 text-green-700'
      : 'bg-blue-100 text-blue-700'

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario')}><ArrowLeft size={20} /></button>
          <HandHeart size={20} />
          <span className="font-bold text-base">Donaciones</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Resumen del período */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#1e3a6e] rounded-2xl p-4 shadow">
            <div className="flex items-center gap-2 mb-1">
              <Banknote size={15} className="text-blue-200" />
              <p className="text-blue-200 text-xs">Dinero recibido</p>
            </div>
            <p className="text-white text-xl font-bold">
              {totalDinero.toFixed(2)} <span className="text-sm text-blue-200">CHF</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Package size={15} className="text-[#1e3a6e]" />
              <p className="text-gray-400 text-xs">Donaciones mat.</p>
            </div>
            <p className="text-[#1e3a6e] text-xl font-bold">{totalMateriales}</p>
          </div>
        </div>

        {/* Filtro período */}
        <div className="mb-3">
          <FiltroPeriodo valor={periodo} onChange={setPeriodo} />
        </div>

        {/* Filtros tipo */}
        <div className="flex gap-2 mb-3">
          {[
            { value: 'todos',    label: 'Todas'      },
            { value: 'material', label: 'Materiales' },
            { value: 'dinero',   label: 'Dinero'     },
          ].map(op => (
            <button key={op.value} onClick={() => setFiltroTipo(op.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border
                ${filtroTipo === op.value
                  ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a6e]'
                }`}>
              {op.label}
            </button>
          ))}
        </div>

        {/* Buscador y botón */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por patrocinador..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>
          <button onClick={() => navigate('/funcionario/donaciones/nueva')}
            className="bg-[#1e3a6e] text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium hover:bg-[#162d58] transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <HandHeart size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay donaciones en este período</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtradas.map(d => (
              <button key={d.id}
                onClick={() => navigate(`/funcionario/donaciones/${d.id}`)}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-md transition-all text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-medium text-[#1e3a6e] text-sm">
                      {d.patrocinador?.nombre || 'Sin patrocinador'}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor(d.tipo)}`}>
                      {d.tipo === 'dinero' ? 'Dinero' : 'Material'}
                    </span>
                  </div>
                  {d.tipo === 'dinero'
                    ? <p className="text-xs text-gray-500 font-medium">{d.monto} {d.moneda}</p>
                    : <p className="text-xs text-gray-500 truncate">{d.descripcion}</p>
                  }
                  <p className="text-xs text-gray-300 mt-0.5">{formatFecha(d.fecha)}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}