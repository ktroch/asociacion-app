import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getUsuario, cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Trash2, CheckCircle, Clock, Receipt, Calendar, Tag, Banknote, Eye, EyeOff } from 'lucide-react'

const CATEGORIAS = {
  alimentacion:   'Alimentación',
  transporte:     'Transporte',
  materiales:     'Materiales',
  servicios:      'Servicios',
  eventos:        'Eventos',
  arriendo:       'Arriendo',
  sueldos:        'Sueldos',
  administrativo: 'Administrativo',
  otro:           'Otro',
}

export default function DetalleGasto() {
  const { id }                              = useParams()
  const navigate                            = useNavigate()
  const usuario                             = getUsuario()
  const [gasto, setGasto]                   = useState(null)
  const [balance, setBalance]               = useState({ disponibleDonaciones: 0, disponiblePropio: 0 })
  const [cargando, setCargando]             = useState(true)
  const [liquidando, setLiquidando]         = useState(false)
  const [eliminando, setEliminando]         = useState(false)
  const [mostrarLiquidar, setMostrarLiquidar] = useState(false)
  const [mostrarEliminar, setMostrarEliminar] = useState(false)
  const [fuente, setFuente]                 = useState('')
  const [motivo, setMotivo]                 = useState('')
  const [contrasena, setContrasena]         = useState('')
  const [verContrasena, setVerContrasena]   = useState(false)
  const [errorLiquidar, setErrorLiquidar]   = useState('')
  const [errorEliminar, setErrorEliminar]   = useState('')
  const [esCreador, setEsCreador]           = useState(false)

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    setCargando(true)

    const { data: g } = await supabase
      .from('gasto')
      .select('*')
      .eq('id', id)
      .single()

    setGasto(g)

    // Verificar si el usuario actual es el creador
    const { data: funcData } = await supabase
      .from('funcionario')
      .select('id')
      .eq('persona_id', usuario?.id)
      .maybeSingle()

    if (funcData && g?.funcionario_id === funcData.id) {
      setEsCreador(true)
    } else {
      setEsCreador(false)
    }

    // Calcular balance disponible excluyendo este gasto
    const [
      { data: donaciones },
      { data: todosGastos },
      { data: ingresos },
    ] = await Promise.all([
      supabase.from('donacion').select('monto').eq('tipo', 'dinero'),
      supabase.from('gasto').select('monto, estado, fuente_pago').neq('id', id),
      supabase.from('ingreso_propio').select('monto'),
    ])

    const totalDonado       = (donaciones  || []).reduce((a, d) => a + Number(d.monto || 0), 0)
    const totalPropio       = (ingresos    || []).reduce((a, i) => a + Number(i.monto || 0), 0)
    const gastadoDonaciones = (todosGastos || [])
      .filter(g => g.estado === 'pagado' && g.fuente_pago === 'donaciones')
      .reduce((a, g) => a + Number(g.monto || 0), 0)
    const gastadoPropio     = (todosGastos || [])
      .filter(g => g.estado === 'pagado' && g.fuente_pago === 'ingresos_propios')
      .reduce((a, g) => a + Number(g.monto || 0), 0)

    setBalance({
      disponibleDonaciones: totalDonado - gastadoDonaciones,
      disponiblePropio:     totalPropio - gastadoPropio,
    })

    setCargando(false)
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const handleLiquidar = async () => {
    setErrorLiquidar('')
    if (!fuente) { setErrorLiquidar('Selecciona la fuente de pago'); return }

    const monto      = Number(gasto.monto)
    const disponible = fuente === 'donaciones'
      ? balance.disponibleDonaciones
      : balance.disponiblePropio

    if (monto > disponible) {
      setErrorLiquidar(
        `Fondos insuficientes. Disponible en ${fuente === 'donaciones' ? 'donaciones' : 'ingresos propios'}: ${disponible.toFixed(2)} CHF`
      )
      return
    }

    setLiquidando(true)
    const { error: err } = await supabase
      .from('gasto')
      .update({
        estado:      'pagado',
        fuente_pago: fuente,
        fecha_pago:  new Date().toISOString().split('T')[0],
      })
      .eq('id', id)

    if (err) { setErrorLiquidar(err.message); setLiquidando(false); return }

    setMostrarLiquidar(false)
    cargar()
    setLiquidando(false)
  }

  const handleEliminar = async () => {
    setErrorEliminar('')

    if (!motivo.trim()) {
      setErrorEliminar('El motivo es obligatorio')
      return
    }
    if (!contrasena.trim()) {
      setErrorEliminar('Debes confirmar tu contraseña')
      return
    }

    setEliminando(true)

    // Verificar contraseña
    const { data: verificacion } = await supabase
      .from('persona')
      .select('id')
      .eq('id', usuario?.id)
      .eq('password_hash', contrasena)
      .maybeSingle()

    if (!verificacion) {
      setErrorEliminar('Contraseña incorrecta')
      setEliminando(false)
      return
    }

    // Registrar en auditoría
    await supabase.from('auditoria_eliminacion').insert({
      tabla:         'gasto',
      registro_id:   gasto.id,
      datos_previos: gasto,
      motivo:        motivo.trim(),
      eliminado_por: usuario?.id || null,
    })

    await supabase.from('gasto').delete().eq('id', id)
    navigate('/funcionario/gastos')
    setEliminando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (!gasto) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Gasto no encontrado</p>
    </div>
  )

  const totalDisponible = balance.disponibleDonaciones + balance.disponiblePropio
  const puedeLiquidar   = Number(gasto.monto) <= totalDisponible

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/gastos')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Detalle del gasto</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Tarjeta principal */}
        <div className="bg-[#1e3a6e] rounded-2xl p-5 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-2
                ${gasto.estado === 'pagado'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-yellow-200 text-yellow-800'}`}>
                {gasto.estado === 'pagado'
                  ? <span className="flex items-center gap-1"><CheckCircle size={11} /> Pagado</span>
                  : <span className="flex items-center gap-1"><Clock size={11} /> Pendiente</span>
                }
              </span>
              <p className="text-white font-bold text-lg leading-tight">{gasto.descripcion}</p>
              <p className="text-blue-200 text-sm mt-1">{CATEGORIAS[gasto.categoria] || gasto.categoria}</p>
            </div>
            <p className="text-white text-2xl font-bold ml-4 flex-shrink-0">
              {Number(gasto.monto).toFixed(2)}
              <span className="text-sm text-blue-200 ml-1">{gasto.moneda}</span>
            </p>
          </div>

          {gasto.estado === 'pagado' && (
            <div className="bg-white/10 rounded-xl p-3 mt-2">
              <p className="text-blue-200 text-xs">
                Liquidado el {formatFecha(gasto.fecha_pago)} con{' '}
                <span className="text-white font-medium">
                  {gasto.fuente_pago === 'donaciones' ? 'fondos donados' : 'fondos propios'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Fondos disponibles — solo si está pendiente */}
        {gasto.estado === 'pendiente' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm font-medium text-[#1e3a6e] mb-3">Fondos disponibles</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#eef2fa] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Donaciones</p>
                <p className={`font-bold ${balance.disponibleDonaciones >= 0 ? 'text-[#1e3a6e]' : 'text-red-500'}`}>
                  {balance.disponibleDonaciones.toFixed(2)} CHF
                </p>
              </div>
              <div className="bg-[#eef2fa] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Fondos propios</p>
                <p className={`font-bold ${balance.disponiblePropio >= 0 ? 'text-[#1e3a6e]' : 'text-red-500'}`}>
                  {balance.disponiblePropio.toFixed(2)} CHF
                </p>
              </div>
            </div>
            {!puedeLiquidar && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Fondos insuficientes — se requieren {Number(gasto.monto).toFixed(2)} CHF, disponibles {totalDisponible.toFixed(2)} CHF
              </p>
            )}
          </div>
        )}

        {/* Información */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Información</p>
          {[
            { icono: Calendar, label: 'Fecha del gasto', valor: formatFecha(gasto.fecha)    },
            { icono: Tag,      label: 'Categoría',       valor: CATEGORIAS[gasto.categoria] },
            { icono: Banknote, label: 'Monto',           valor: `${Number(gasto.monto).toFixed(2)} ${gasto.moneda}` },
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

        {/* Comprobante */}
        {gasto.comprobante_url && (
          <a href={gasto.comprobante_url} target="_blank" rel="noopener noreferrer"
            className="bg-white border border-gray-200 rounded-xl py-3 text-sm text-[#1e3a6e] font-medium flex items-center justify-center gap-2 hover:bg-[#eef2fa] transition-colors">
            <Receipt size={16} />
            Ver comprobante
          </a>
        )}

        {/* Botón liquidar */}
        {gasto.estado === 'pendiente' && (
          <button
            onClick={() => { setMostrarLiquidar(true); setErrorLiquidar(''); setFuente('') }}
            disabled={!puedeLiquidar}
            className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#162d58] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle size={17} />
            Liquidar gasto
          </button>
        )}

        {/* Botón eliminar — solo creador y solo si está pendiente */}
        {esCreador && gasto.estado === 'pendiente' && (
          <button
            onClick={() => { setMostrarEliminar(true); setMotivo(''); setContrasena(''); setErrorEliminar('') }}
            className="bg-red-50 text-[#c0152a] border border-red-200 rounded-xl py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={15} />
            Eliminar gasto
          </button>
        )}

        {/* Modal liquidar */}
        {mostrarLiquidar && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#eef2fa] rounded-xl p-2">
                  <CheckCircle size={20} className="text-[#1e3a6e]" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Liquidar gasto</p>
                  <p className="text-xs text-gray-400">{Number(gasto.monto).toFixed(2)} {gasto.moneda}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">¿Con qué fondos se liquida?</p>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setFuente('donaciones')}
                    disabled={Number(gasto.monto) > balance.disponibleDonaciones}
                    className={`p-3 rounded-xl border text-left transition-colors
                      ${fuente === 'donaciones'
                        ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a6e]'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <p className="text-sm font-medium">Fondos donados</p>
                    <p className={`text-xs mt-0.5 ${fuente === 'donaciones' ? 'text-blue-200' : 'text-gray-400'}`}>
                      Disponible: {balance.disponibleDonaciones.toFixed(2)} CHF
                    </p>
                  </button>

                  <button type="button" onClick={() => setFuente('ingresos_propios')}
                    disabled={Number(gasto.monto) > balance.disponiblePropio}
                    className={`p-3 rounded-xl border text-left transition-colors
                      ${fuente === 'ingresos_propios'
                        ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3a6e]'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <p className="text-sm font-medium">Fondos propios</p>
                    <p className={`text-xs mt-0.5 ${fuente === 'ingresos_propios' ? 'text-blue-200' : 'text-gray-400'}`}>
                      Disponible: {balance.disponiblePropio.toFixed(2)} CHF
                    </p>
                  </button>
                </div>
              </div>

              {errorLiquidar && (
                <p className="text-[#c0152a] text-xs text-center bg-red-50 rounded-lg py-2">{errorLiquidar}</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMostrarLiquidar(false)}
                  className="py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleLiquidar} disabled={liquidando || !fuente}
                  className="py-2.5 rounded-xl bg-[#1e3a6e] text-white text-sm font-medium disabled:opacity-50">
                  {liquidando ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal eliminar */}
        {mostrarEliminar && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 rounded-xl p-2">
                  <Trash2 size={20} className="text-[#c0152a]" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Eliminar gasto</p>
                  <p className="text-xs text-gray-400">Acción auditada — no se puede deshacer</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Motivo de eliminación <span className="text-red-400">*</span>
                </label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)}
                  placeholder="Explica por qué se elimina este registro..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0152a] resize-none" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Confirma tu contraseña <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={verContrasena ? 'text' : 'password'}
                    value={contrasena}
                    onChange={e => setContrasena(e.target.value)}
                    placeholder="Tu contraseña actual"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0152a]"
                  />
                  <button type="button" onClick={() => setVerContrasena(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {verContrasena ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {errorEliminar && (
                <p className="text-[#c0152a] text-xs text-center bg-red-50 rounded-lg py-2">
                  {errorEliminar}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMostrarEliminar(false)}
                  className="py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleEliminar}
                  disabled={!motivo.trim() || !contrasena.trim() || eliminando}
                  className="py-2.5 rounded-xl bg-[#c0152a] text-white text-sm font-medium disabled:opacity-50">
                  {eliminando ? 'Verificando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}