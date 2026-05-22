import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getUsuario, cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Save, Receipt } from 'lucide-react'

const CATEGORIAS = [
  { value: 'alimentacion',   label: 'Alimentación'   },
  { value: 'transporte',     label: 'Transporte'     },
  { value: 'materiales',     label: 'Materiales'     },
  { value: 'servicios',      label: 'Servicios'      },
  { value: 'eventos',        label: 'Eventos'        },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'arriendo',       label: 'Arriendo'       },
  { value: 'sueldos',        label: 'Sueldos'        },
  { value: 'otro',           label: 'Otro'           },
]

const MONEDAS = ['CHF', 'EUR', 'USD']

export default function NuevoGasto() {
  const navigate                  = useNavigate()
  const usuario                   = getUsuario()
  const [funcionarioId, setFuncionarioId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState(false)
  const [comprobanteFile, setComprobanteFile] = useState(null)

  const [form, setForm] = useState({
    categoria:   '',
    descripcion: '',
    monto:       '',
    moneda:      'CHF',
    fecha:       new Date().toISOString().split('T')[0],
  })

  useEffect(() => { cargarFuncionario() }, [])

  const cargarFuncionario = async () => {
    const { data } = await supabase
      .from('funcionario')
      .select('id')
      .eq('persona_id', usuario?.id)
      .single()
    setFuncionarioId(data?.id || null)
  }

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const handleComprobante = (e) => {
    const file = e.target.files[0]
    if (file) setComprobanteFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.categoria) { setError('Selecciona una categoría'); return }
    setGuardando(true)
    setError('')

    try {
      let comprobanteUrl = null

      if (comprobanteFile) {
        const path = `comprobantes/${Date.now()}-${comprobanteFile.name}`
        await supabase.storage.from('personas').upload(path, comprobanteFile, { upsert: true })
        const { data } = supabase.storage.from('personas').getPublicUrl(path)
        comprobanteUrl = data.publicUrl
      }

      const { error: err } = await supabase.from('gasto').insert({
        categoria:       form.categoria,
        descripcion:     form.descripcion,
        monto:           parseFloat(form.monto),
        moneda:          form.moneda,
        fecha:           form.fecha,
        funcionario_id:  funcionarioId,
        comprobante_url: comprobanteUrl,
      })

      if (err) throw new Error(err.message)

      setExito(true)
      setTimeout(() => navigate('/funcionario/gastos'), 1500)

    } catch (err) {
      setError(err.message)
    }

    setGuardando(false)
  }

  if (exito) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-xs">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[#1e3a6e] font-bold text-lg">¡Gasto registrado!</h2>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/gastos')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Nuevo gasto</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Datos del gasto</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Categoría *</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(f => ({ ...f, categoria: c.value }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-colors border text-left
                    ${form.categoria === c.value
                      ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a6e]'
                    }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Descripción *</label>
            <input type="text" value={form.descripcion} onChange={set('descripcion')} required
              placeholder="ej: Compra de material de oficina"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Monto *</label>
              <input type="number" step="0.01" min="0"
                value={form.monto} onChange={set('monto')} required
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
            <input type="date" value={form.fecha} onChange={set('fecha')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>
        </div>

        {/* Comprobante */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-1">Comprobante</p>
          <p className="text-xs text-gray-400 mb-3">Foto o PDF del recibo (opcional)</p>
          <label className="flex items-center gap-3 cursor-pointer bg-[#eef2fa] rounded-xl px-4 py-3 hover:bg-[#dde6f5] transition-colors">
            <Receipt size={18} className="text-[#1e3a6e]" />
            <span className="text-sm text-[#1e3a6e] font-medium">
              {comprobanteFile ? comprobanteFile.name : 'Subir comprobante'}
            </span>
            <input type="file" accept="image/*,application/pdf"
              className="hidden" onChange={handleComprobante} />
          </label>
        </div>

        {error && (
          <p className="text-[#c0152a] text-sm text-center bg-red-50 rounded-xl py-3">{error}</p>
        )}

        <button type="submit" disabled={guardando}
          className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#162d58] transition-colors disabled:opacity-50">
          <Save size={17} />
          {guardando ? 'Guardando...' : 'Registrar gasto'}
        </button>
      </form>
    </div>
  )
}