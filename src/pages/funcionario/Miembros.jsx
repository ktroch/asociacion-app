import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { Users, LogOut, ArrowLeft, Plus, Search, ChevronRight, ScanLine } from 'lucide-react'
import EscanerQR from '../../components/EscanerQR'

export default function Miembros() {
  const navigate = useNavigate()
  const [miembros, setMiembros]       = useState([])
  const [busqueda, setBusqueda]       = useState('')
  const [cargando, setCargando]       = useState(true)
  const [escaneando, setEscaneando]   = useState(false)
  const [errorQR, setErrorQR]         = useState('')

  useEffect(() => { cargarMiembros() }, [])

  const cargarMiembros = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('persona')
      .select(`id, nombre, apellido, codigo_unico, miembro(id, estado, fecha_vencimiento)`)
      .eq('rol', 'miembro')
      .order('apellido')
    setMiembros(data || [])
    setCargando(false)
  }

  const miembrosFiltrados = miembros.filter(m =>
    `${m.nombre} ${m.apellido} ${m.codigo_unico}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  const estadoColor = (estado) => {
    if (estado === 'activo')   return 'bg-green-100 text-green-700'
    if (estado === 'inactivo') return 'bg-gray-100 text-gray-500'
    return 'bg-red-100 text-red-600'
  }

  const handleQR = async (codigo) => {
    setEscaneando(false)
    setErrorQR('')

    const { data } = await supabase
      .from('persona')
      .select('id, rol')
      .eq('codigo_unico', codigo)
      .single()

    if (!data) {
      setErrorQR(`No se encontró ningún miembro con el código: ${codigo}`)
      return
    }

    navigate(`/funcionario/miembros/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* Escáner QR */}
      {escaneando && (
        <EscanerQR
          onResultado={handleQR}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      {/* Header */}
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario')}><ArrowLeft size={20} /></button>
          <Users size={20} />
          <span className="font-bold text-base">Miembros</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Barra de búsqueda */}
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

          {/* Botón escanear QR */}
          <button
            onClick={() => { setErrorQR(''); setEscaneando(true) }}
            className="bg-white border border-gray-200 text-[#1e3a6e] px-3 py-2.5 rounded-xl hover:border-[#1e3a6e] transition-colors"
            title="Escanear QR"
          >
            <ScanLine size={20} />
          </button>

          {/* Botón nuevo */}
          <button
            onClick={() => navigate('/funcionario/miembros/nuevo')}
            className="bg-[#1e3a6e] text-white px-4 py-2.5 rounded-xl flex items-center gap-1.5 text-sm font-medium hover:bg-[#162d58] transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {/* Error QR */}
        {errorQR && (
          <div className="bg-red-50 border border-red-100 text-[#c0152a] text-sm rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <span>{errorQR}</span>
            <button onClick={() => setErrorQR('')} className="ml-2 text-red-300 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : miembrosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-2 opacity-30" />
            <p>No hay miembros registrados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {miembrosFiltrados.map(m => (
              <button
                key={m.id}
                onClick={() => navigate(`/funcionario/miembros/${m.id}`)}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between hover:shadow-md transition-all text-left"
              >
                <div>
                  <p className="font-medium text-[#1e3a6e] text-sm">
                    {m.apellido}, {m.nombre}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.codigo_unico}</p>
                </div>
                <div className="flex items-center gap-2">
                  {m.miembro?.[0] && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor(m.miembro[0].estado)}`}>
                      {m.miembro[0].estado}
                    </span>
                  )}
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