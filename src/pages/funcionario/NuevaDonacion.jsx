import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getUsuario, cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Save, Plus, Trash2, Package, Banknote } from 'lucide-react'

const MONEDAS = ['CHF', 'EUR', 'USD']

export default function NuevaDonacion() {
  const navigate                          = useNavigate()
  const usuario                           = getUsuario()
  const [tipo, setTipo]                   = useState('material')
  const [patrocinadores, setPatrocinadores] = useState([])
  const [productos, setProductos]         = useState([])
  const [funcionarioId, setFuncionarioId] = useState(null)
  const [guardando, setGuardando]         = useState(false)
  const [error, setError]                 = useState('')
  const [exito, setExito]                 = useState(false)

  // Form dinero
  const [formDinero, setFormDinero] = useState({
    patrocinador_id: '',
    monto:           '',
    moneda:          'CHF',
    descripcion:     '',
    fecha:           new Date().toISOString().split('T')[0],
  })

  // Form material — lista de productos
  const [formMaterial, setFormMaterial] = useState({
    patrocinador_id: '',
    fecha:           new Date().toISOString().split('T')[0],
    observaciones:   '',
  })
  const [items, setItems] = useState([{ nombre: '', categoria: '', cantidad: '', unidad: 'kg' }])

  useEffect(() => { cargarDatos() }, [])

  const cargarDatos = async () => {
    const [{ data: pats }, { data: func }] = await Promise.all([
      supabase.from('patrocinador').select('id, nombre').order('nombre'),
      supabase.from('funcionario').select('id').eq('persona_id', usuario?.id).single(),
    ])
    setPatrocinadores(pats || [])
    setFuncionarioId(func?.id || null)
  }

  const setDinero = (campo) => (e) =>
    setFormDinero(f => ({ ...f, [campo]: e.target.value }))

  const setMaterial = (campo) => (e) =>
    setFormMaterial(f => ({ ...f, [campo]: e.target.value }))

  const setItem = (idx, campo) => (e) => {
    setItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, [campo]: e.target.value } : it
    ))
  }

  const agregarItem = () =>
    setItems(prev => [...prev, { nombre: '', categoria: '', cantidad: '', unidad: 'kg' }])

  const quitarItem = (idx) =>
    setItems(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    try {
      if (tipo === 'dinero') {
        const { error: err } = await supabase.from('donacion').insert({
          tipo:            'dinero',
          patrocinador_id: formDinero.patrocinador_id || null,
          funcionario_id:  funcionarioId,
          fecha:           formDinero.fecha,
          monto:           parseFloat(formDinero.monto),
          moneda:          formDinero.moneda,
          descripcion:     formDinero.descripcion || null,
          cantidad:        null,
          unidad:          null,
        })
        if (err) throw new Error(err.message)

      } else {
        // Registrar cada producto como donación y actualizar stock
        for (const item of items) {
          if (!item.nombre || !item.cantidad) continue

          // Registrar donación
          const { error: errDon } = await supabase.from('donacion').insert({
            tipo:            'material',
            patrocinador_id: formMaterial.patrocinador_id || null,
            funcionario_id:  funcionarioId,
            fecha:           formMaterial.fecha,
            descripcion:     item.nombre,
            cantidad:        parseInt(item.cantidad),
            unidad:          item.unidad,
            monto:           null,
            moneda:          null,
          })
          if (errDon) throw new Error(errDon.message)

          // Buscar si el producto ya existe en stock
          const { data: stockExistente } = await supabase
            .from('producto_stock')
            .select('id, cantidad')
            .eq('nombre', item.nombre.trim())
            .single()

          if (stockExistente) {
            // Sumar al stock existente
            await supabase
              .from('producto_stock')
              .update({ cantidad: stockExistente.cantidad + parseInt(item.cantidad) })
              .eq('id', stockExistente.id)
          } else {
            // Crear nuevo producto en stock
            await supabase.from('producto_stock').insert({
              nombre:    item.nombre.trim(),
              categoria: item.categoria || null,
              cantidad:  parseInt(item.cantidad),
              unidad:    item.unidad,
            })
          }
        }
      }

      setExito(true)
      setTimeout(() => navigate('/funcionario/donaciones'), 1500)

    } catch (err) {
      setError(err.message)
    }

    setGuardando(false)
  }

  if (exito) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-xs">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[#1e3a6e] font-bold text-lg">¡Donación registrada!</h2>
        {tipo === 'material' && (
          <p className="text-gray-400 text-sm mt-1">El inventario fue actualizado</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/donaciones')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Nueva donación</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Tipo de donación */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-3">Tipo de donación</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'material', label: 'Materiales / Comestibles', icono: Package  },
              { value: 'dinero',   label: 'Dinero',                   icono: Banknote },
            ].map(op => (
              <button key={op.value} type="button" onClick={() => setTipo(op.value)}
                className={`py-3 rounded-xl text-sm font-medium transition-colors border flex flex-col items-center gap-1.5
                  ${tipo === op.value
                    ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a6e]'
                  }`}>
                <op.icono size={20} />
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── FORMULARIO DINERO ── */}
        {tipo === 'dinero' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <p className="text-sm font-medium text-[#1e3a6e]">Datos de la donación</p>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Patrocinador</label>
                <select value={formDinero.patrocinador_id} onChange={setDinero('patrocinador_id')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
                  <option value="">— Seleccionar —</option>
                  {patrocinadores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto *</label>
                  <input type="number" step="0.01" min="0"
                    value={formDinero.monto} onChange={setDinero('monto')} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Moneda</label>
                  <select value={formDinero.moneda} onChange={setDinero('moneda')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
                    {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
                <input type="date" value={formDinero.fecha} onChange={setDinero('fecha')} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Observaciones</label>
                <input type="text" value={formDinero.descripcion} onChange={setDinero('descripcion')}
                  placeholder="ej: Transferencia bancaria de enero"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>
            </div>
          </>
        )}

        {/* ── FORMULARIO MATERIAL ── */}
        {tipo === 'material' && (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <p className="text-sm font-medium text-[#1e3a6e]">Datos generales</p>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Patrocinador</label>
                <select value={formMaterial.patrocinador_id} onChange={setMaterial('patrocinador_id')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
                  <option value="">— Seleccionar —</option>
                  {patrocinadores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
                <input type="date" value={formMaterial.fecha} onChange={setMaterial('fecha')} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Observaciones generales</label>
                <input type="text" value={formMaterial.observaciones} onChange={setMaterial('observaciones')}
                  placeholder="ej: Entregado en el almacén principal"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>
            </div>

            {/* Lista de productos */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#1e3a6e]">Productos recibidos</p>
                <button type="button" onClick={agregarItem}
                  className="text-xs text-[#1e3a6e] flex items-center gap-1 font-medium bg-[#eef2fa] px-3 py-1.5 rounded-lg">
                  <Plus size={13} /> Agregar
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">Producto {idx + 1}</p>
                    {items.length > 1 && (
                      <button type="button" onClick={() => quitarItem(idx)}
                        className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <input type="text" placeholder="Nombre del producto *"
                    value={item.nombre} onChange={setItem(idx, 'nombre')} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] bg-white" />

                  <input type="text" placeholder="Categoría (ej: lácteos, granos...)"
                    value={item.categoria} onChange={setItem(idx, 'categoria')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] bg-white" />

                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="1" placeholder="Cantidad *"
                      value={item.cantidad} onChange={setItem(idx, 'cantidad')} required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] bg-white" />
                    <select value={item.unidad} onChange={setItem(idx, 'unidad')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] bg-white">
                      {['kg', 'g', 'L', 'ml', 'unidad', 'caja', 'bolsa', 'lata'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {error && (
          <p className="text-[#c0152a] text-sm text-center bg-red-50 rounded-xl py-3">{error}</p>
        )}

        <button type="submit" disabled={guardando}
          className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#162d58] transition-colors disabled:opacity-50">
          <Save size={17} />
          {guardando ? 'Registrando...' : 'Registrar donación'}
        </button>
      </form>
    </div>
  )
}