import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getUsuario, cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Plus, Search, ChevronRight, TrendingUp, Save, X } from 'lucide-react'
import FiltroPeriodo from '../../components/FiltroPeriodo'

const MONEDAS = ['CHF', 'EUR', 'USD']

export default function Ingresos() {
  const navigate                      = useNavigate()
  const usuario                       = getUsuario()
  const [ingresos, setIngresos]       = useState([])
  const [busqueda, setBusqueda]       = useState('')
  const [cargando, setCargando]       = useState(true)
  const [periodo, setPeriodo]         = useState({ mes: '', anio: '' })
  const [total, setTotal]             = useState(0)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')
  const [funcionarioId, setFuncionarioId] = useState(null)

  const [form, setForm] = useState({
    concepto: '',
    monto:    '',
    moneda:   'CHF',
    fecha:    new Date().toISOString().split('T')[0],
  })

  useEffect(() => { cargarFuncionario(); }, [])
  useEffect(() => { cargar() }, [periodo])

  const cargarFuncionario = async () => {
    const { data } = await supabase
      .from('funcionario')
      .select('id')
      .eq('persona_id', usuario?.id)
      .single()
    setFuncionarioId(data?.id || null)
  }

  const cargar = async () => {
    setCargando(true)
    let query = supabase
      .from('ingreso_propio')
      .select('*, funcionario(persona(nombre, apellido))')
      .order('fecha', { ascending: false })

    if (periodo.anio) {
      const inicio = `${periodo.anio}-${periodo.mes || '01'}-01`
      const fin    = periodo.mes
        ? `${periodo.anio}-${periodo.mes}-31`
        : `${periodo.anio}-12-31`
      query = query.gte('fecha', inicio).lte('fecha', fin)
    }

    const { data } = await query
    setIngresos(data || [])
    setTotal((data || []).reduce((a, i) => a + Number(i.monto || 0), 0))
    setCargando(false)
  }

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.concepto.trim() || !form.monto) {
      setError('Concepto y monto son obligatorios')
      return
    }
    setGuardando(true)
    setError('')

    const { error: err } = await supabase.from('ingreso_propio').insert({
      concepto:      form.concepto.trim(),
      monto:         parseFloat(form.monto),
      moneda:        form.moneda,
      fecha:         form.fecha,
      funcionario_id: funcionarioId,
    })

    if (err) { setError(err.message); setGuardando(false); return }

    setForm({ concepto: '', monto: '', moneda: 'CHF', fecha: new Date().toISOString().split('T')[0] })
    setMostrarForm(false)
    cargar()
    setGuardando(false)
  }

  const filtrados = ingresos.filter(i =>
    i.concepto.toLowerCase().includes(busqueda.toLowerCase())
  )

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
          <button onClick={() => navigate('/funcionario/gastos')}><ArrowLeft size={20} /></button>
          <TrendingUp size={20} />
          <span className="font-bold text-base">Ingresos propios</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Resumen */}
        <div className="bg-[#1e3a6e] rounded-2xl p-4 mb-4 shadow">
          <p className="text-blue-200 text-xs mb-1">Total ingresos propios</p>
          <p className="text-white text-3xl font-bold">
            {total.toFixed(2)} <span className="text-lg text-blue-200">CHF</span>
          </p>
          <p className="text-blue-200 text-xs mt-1">{ingresos.length} registros</p>
        </div>

        {/* Filtro período */}
        <div className="mb-4">
          <FiltroPeriodo valor={periodo} onChange={setPeriodo} />
        </div>

        {/* Buscador y botón */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por concepto..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>
          <button onClick={() => { setMostrarForm(true); setError('') }}
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
            <TrendingUp size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay ingresos en este período</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtrados.map(i => (
              <div key={i.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1e3a6e] text-sm truncate">{i.concepto}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{formatFecha(i.fecha)}</p>
                    {i.funcionario?.persona && (
                      <>
                        <span className="text-gray-200 text-xs">·</span>
                        <p className="text-xs text-gray-400">
                          {i.funcionario.persona.nombre} {i.funcionario.persona.apellido}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <p className="font-bold text-green-600 text-sm flex-shrink-0 ml-2">
                  +{Number(i.monto).toFixed(2)} {i.moneda}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal nuevo ingreso */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">Nuevo ingreso propio</p>
              <button onClick={() => setMostrarForm(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Concepto *</label>
                <input type="text" value={form.concepto} onChange={set('concepto')}
                  placeholder="ej: Venta de comida en feria estatal"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto *</label>
                  <input type="number" step="0.01" min="0"
                    value={form.monto} onChange={set('monto')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Moneda</label>
                  <select value={form.moneda} onChange={set('moneda')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
                    {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
                <input type="date" value={form.fecha} onChange={set('fecha')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>
            </div>

            {error && (
              <p className="text-[#c0152a] text-xs text-center bg-red-50 rounded-lg py-2">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMostrarForm(false)}
                className="py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={guardando}
                className="py-2.5 rounded-xl bg-[#1e3a6e] text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Save size={14} />
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}