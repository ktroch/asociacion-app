import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Search, Package, AlertTriangle } from 'lucide-react'

export default function Inventario() {
  const navigate                    = useNavigate()
  const [productos, setProductos]   = useState([])
  const [busqueda, setBusqueda]     = useState('')
  const [cargando, setCargando]     = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('producto_stock')
      .select('*')
      .order('nombre')
    setProductos(data || [])
    setCargando(false)
  }

  const filtrados = productos.filter(p =>
    `${p.nombre} ${p.categoria || ''}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  const stockColor = (cantidad) => {
    if (cantidad <= 0)  return 'bg-red-100 text-red-700'
    if (cantidad <= 10) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const stockLabel = (cantidad) => {
    if (cantidad <= 0)  return 'Sin stock'
    if (cantidad <= 10) return 'Stock bajo'
    return 'Disponible'
  }

  const totalProductos  = productos.length
  const sinStock        = productos.filter(p => p.cantidad <= 0).length
  const stockBajo       = productos.filter(p => p.cantidad > 0 && p.cantidad <= 10).length

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario')}><ArrowLeft size={20} /></button>
          <Package size={20} />
          <span className="font-bold text-base">Inventario</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Productos',  valor: totalProductos, color: 'bg-white',          texto: 'text-[#1e3a6e]' },
            { label: 'Stock bajo', valor: stockBajo,      color: 'bg-yellow-50',      texto: 'text-yellow-700' },
            { label: 'Sin stock',  valor: sinStock,       color: 'bg-red-50',         texto: 'text-red-700'    },
          ].map(item => (
            <div key={item.label} className={`${item.color} rounded-xl p-3 shadow-sm border border-gray-100 text-center`}>
              <p className={`text-2xl font-bold ${item.texto}`}>{item.valor}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Alerta stock bajo */}
        {(sinStock > 0 || stockBajo > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-700 text-sm">
              {sinStock > 0 && `${sinStock} producto(s) sin stock. `}
              {stockBajo > 0 && `${stockBajo} producto(s) con stock bajo.`}
            </p>
          </div>
        )}

        {/* Buscador */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar producto o categoría..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay productos en inventario</p>
            <p className="text-xs mt-1">Se agregan automáticamente al registrar donaciones de materiales</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtrados.map(p => (
              <div key={p.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-[#eef2fa] rounded-lg p-2 flex-shrink-0">
                    <Package size={16} className="text-[#1e3a6e]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1e3a6e] text-sm">{p.nombre}</p>
                    {p.categoria && (
                      <p className="text-xs text-gray-400">{p.categoria}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1e3a6e]">
                      {p.cantidad} <span className="text-xs font-normal text-gray-400">{p.unidad}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockColor(p.cantidad)}`}>
                    {stockLabel(p.cantidad)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}