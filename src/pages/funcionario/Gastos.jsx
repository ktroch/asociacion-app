import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import FiltroPeriodo from '../../components/FiltroPeriodo'
import { ArrowLeft, LogOut, Plus, Search, ChevronRight, TrendingDown } from 'lucide-react'

const CATEGORIAS = {
  alimentacion:   { label: 'Alimentación',   color: 'bg-orange-100 text-orange-700'  },
  transporte:     { label: 'Transporte',     color: 'bg-blue-100 text-blue-700'      },
  materiales:     { label: 'Materiales',     color: 'bg-purple-100 text-purple-700'  },
  servicios:      { label: 'Servicios',      color: 'bg-teal-100 text-teal-700'      },
  eventos:        { label: 'Eventos',        color: 'bg-pink-100 text-pink-700'      },
  arriendo:       { label: 'Arriendo',       color: 'bg-indigo-100 text-indigo-700'  },
  sueldos:        { label: 'Sueldos',        color: 'bg-cyan-100 text-cyan-700'      },
  administrativo: { label: 'Administrativo', color: 'bg-gray-100 text-gray-700'      },
  otro:           { label: 'Otro',           color: 'bg-yellow-100 text-yellow-700'  },
}

export default function Gastos() {
  const navigate                              = useNavigate()
  const [gastos, setGastos]                   = useState([])
  const [busqueda, setBusqueda]               = useState('')
  const [filtro, setFiltro]                   = useState('todos')
  const [cargando, setCargando]               = useState(true)
  const [periodo, setPeriodo]                 = useState({ mes: '', anio: '' })
  const [balanceDinero, setBalanceDinero]     = useState({ donado: 0, gastado: 0 })

  useEffect(() => { cargar() }, [periodo])

  const cargar = async () => {
    setCargando(true)

    // ── Gastos del período ──
    let query = supabase
      .from('gasto')
      .select('*')
      .order('fecha', { ascending: false })

    if (periodo.anio) {
      const inicio = `${periodo.anio}-${periodo.mes || '01'}-01`
      const fin    = periodo.mes
        ? `${periodo.anio}-${periodo.mes}-31`
        : `${periodo.anio}-12-31`
      query = query.gte('fecha', inicio).lte('fecha', fin)
    }

    const { data } = await query
    setGastos(data || [])

    // ── Balance financiero general (sin filtro de período) ──
    const { data: donacionesDinero } = await supabase
      .from('donacion')
      .select('monto')
      .eq('tipo', 'dinero')

    const { data: todosGastos } = await supabase
      .from('gasto')
      .select('monto')

    const totalDonado  = (donacionesDinero || []).reduce((acc, d) => acc + Number(d.monto || 0), 0)
    const totalGastado = (todosGastos      || []).reduce((acc, g) => acc + Number(g.monto || 0), 0)
    setBalanceDinero({ donado: totalDonado, gastado: totalGastado })

    setCargando(false)
  }

  const filtrados = gastos.filter(g => {
    const coincideCategoria = filtro === 'todos' || g.categoria === filtro
    const coincideBusqueda  = g.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario')}><ArrowLeft size={20} /></button>
          <TrendingDown size={20} />
          <span className="font-bold text-base">Gastos</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Balance financiero general */}
        <div className="bg-[#1e3a6e] rounded-2xl p-4 mb-4 shadow">
          <p className="text-blue-200 text-xs mb-3">Balance financiero general</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-blue-200 text-xs">Donado</p>
              <p className="text-white font-bold text-lg">
                {balanceDinero.donado.toFixed(2)}
                <span className="text-xs text-blue-200 ml-1">CHF</span>
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Gastado</p>
              <p className="text-[#f87171] font-bold text-lg">
                {balanceDinero.gastado.toFixed(2)}
                <span className="text-xs text-blue-200 ml-1">CHF</span>
              </p>
            </div>
            <div>
              <p className="text-blue-200 text-xs">Disponible</p>
              <p className={`font-bold text-lg ${
                balanceDinero.donado - balanceDinero.gastado >= 0
                  ? 'text-green-300'
                  : 'text-red-400'
              }`}>
                {(balanceDinero.donado - balanceDinero.gastado).toFixed(2)}
                <span className="text-xs text-blue-200 ml-1">CHF</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filtro período */}
        <div className="mb-3">
          <FiltroPeriodo valor={periodo} onChange={setPeriodo} />
        </div>

        {/* Filtro por categoría */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex-shrink-0
              ${filtro === 'todos'
                ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                : 'bg-white text-gray-500 border-gray-200'}`}>
            Todos
          </button>
          {Object.entries(CATEGORIAS).map(([key, val]) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border flex-shrink-0
                ${filtro === key
                  ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                  : 'bg-white text-gray-500 border-gray-200'}`}>
              {val.label}
            </button>
          ))}
        </div>

        {/* Buscador y botón */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar gasto..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>
          <button onClick={() => navigate('/funcionario/gastos/nuevo')}
            className="bg-[#1e3a6e] text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium hover:bg-[#162d58] transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingDown size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay gastos registrados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtrados.map(g => (
              <button key={g.id}
                onClick={() => navigate(`/funcionario/gastos/${g.id}`)}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-md transition-all text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-medium text-[#1e3a6e] text-sm truncate">{g.descripcion}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORIAS[g.categoria]?.color}`}>
                      {CATEGORIAS[g.categoria]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{formatFecha(g.fecha)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <p className="font-bold text-[#c0152a] text-sm">{Number(g.monto).toFixed(2)} {g.moneda}</p>
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
