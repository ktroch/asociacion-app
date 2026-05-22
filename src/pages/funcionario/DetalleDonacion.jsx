import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getUsuario, cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Package, Banknote, Calendar, User, Hash, FileText, Trash2 } from 'lucide-react'

export default function DetalleDonacion() {
  const { id }                  = useParams()
  const navigate                = useNavigate()
  const [donacion, setDonacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [eliminando, setEliminando]     = useState(false)
  const [mostrarConfirm, setMostrarConfirm] = useState(false)
  const [motivo, setMotivo]             = useState('')

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('donacion')
      .select(`*, patrocinador(nombre, tipo, uid, tipo_uid), funcionario(persona(nombre, apellido))`)
      .eq('id', id)
      .single()
    setDonacion(data)
    setCargando(false)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (!donacion) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Donación no encontrada</p>
    </div>
  )

  const esDinero = donacion.tipo === 'dinero'

  // Funcion para eliminar la donación abre. 
  const handleEliminar = async () => {
  if (!motivo.trim()) return
  setEliminando(true)

  try {
    const usuario = getUsuario()

    // Guardar en auditoría
    await supabase.from('auditoria_eliminacion').insert({
      tabla:         'donacion',
      registro_id:   donacion.id,
      datos_previos: donacion,
      motivo:        motivo.trim(),
      eliminado_por: usuario?.id || null,
    })

    // Si era material, restar del stock
    if (donacion.tipo === 'material' && donacion.descripcion && donacion.cantidad) {
      const { data: stock } = await supabase
        .from('producto_stock')
        .select('id, cantidad')
        .eq('nombre', donacion.descripcion)
        .single()

      if (stock) {
        await supabase
          .from('producto_stock')
          .update({ cantidad: Math.max(0, stock.cantidad - donacion.cantidad) })
          .eq('id', stock.id)
      }
    }

    // Eliminar donación
    await supabase.from('donacion').delete().eq('id', donacion.id)

    navigate('/funcionario/donaciones')
  } catch (err) {
    setError('Error al eliminar: ' + err.message)
  }

  setEliminando(false)
}
  //Funcion para eliminar cierra aqui


  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/donaciones')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Detalle de donación</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Tarjeta principal */}
        <div className="bg-[#1e3a6e] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-[#162d58] rounded-xl p-3 flex-shrink-0">
              {esDinero
                ? <Banknote size={28} className="text-white/70" />
                : <Package  size={28} className="text-white/70" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-1 inline-block
                ${esDinero ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                {esDinero ? 'Donación en dinero' : 'Donación de materiales'}
              </span>
              <p className="text-white font-bold text-base leading-tight">
                {donacion.patrocinador?.nombre || 'Sin patrocinador'}
              </p>
              {esDinero
                ? <p className="text-green-300 font-bold text-xl mt-1">
                    {donacion.monto} {donacion.moneda}
                  </p>
                : <p className="text-blue-200 text-sm mt-1">
                    {donacion.cantidad} {donacion.unidad} — {donacion.descripcion}
                  </p>
              }
              <p className="text-blue-200 text-xs mt-1">{formatFecha(donacion.fecha)}</p>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Información completa</p>

          {[
            {
              icono: User,
              label: 'Patrocinador',
              valor: donacion.patrocinador?.nombre || '—'
            },
            {
              icono: Calendar,
              label: 'Fecha',
              valor: formatFecha(donacion.fecha)
            },
            {
              icono: User,
              label: 'Registrado por',
              valor: donacion.funcionario?.persona
                ? `${donacion.funcionario.persona.nombre} ${donacion.funcionario.persona.apellido}`
                : '—'
            },
            ...(esDinero ? [
              { icono: Banknote, label: 'Monto',   valor: `${donacion.monto} ${donacion.moneda}` },
              { icono: FileText, label: 'Concepto', valor: donacion.descripcion || '—' },
            ] : [
              { icono: Package,  label: 'Producto',  valor: donacion.descripcion || '—' },
              { icono: Hash,     label: 'Cantidad',  valor: `${donacion.cantidad} ${donacion.unidad}` },
            ]),
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
        </div>

          {/* Botón eliminar */}
            <button
            onClick={() => setMostrarConfirm(true)}
            className="bg-red-50 text-[#c0152a] border border-red-200 rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
            <Trash2 size={15} />
            Eliminar donación
            </button>

            {/* Modal confirmación */}
            {mostrarConfirm && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 rounded-xl p-2">
                    <Trash2 size={20} className="text-[#c0152a]" />
                    </div>
                    <div>
                    <p className="font-bold text-gray-800">Eliminar donación</p>
                    <p className="text-xs text-gray-400">Esta acción quedará registrada en auditoría</p>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                    Motivo de eliminación <span className="text-red-400">*</span>
                    </label>
                    <textarea
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Explica por qué se elimina este registro..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0152a] resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                    onClick={() => { setMostrarConfirm(false); setMotivo('') }}
                    className="py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50"
                    >
                    Cancelar
                    </button>
                    <button
                    onClick={handleEliminar}
                    disabled={!motivo.trim() || eliminando}
                    className="py-2.5 rounded-xl bg-[#c0152a] text-white text-sm font-medium hover:bg-[#a01020] disabled:opacity-50"
                    >
                    {eliminando ? 'Eliminando...' : 'Confirmar'}
                    </button>
                </div>
                </div>
            </div>
            )}

      </main>
    </div>
  )
}