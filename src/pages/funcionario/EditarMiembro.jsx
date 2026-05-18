import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Camera, X, RotateCcw, Save } from 'lucide-react'

const TIPOS_DOC = [
  { value: 'tarjeta_identificacion', label: 'Tarjeta de identificación' },
  { value: 'permiso_residencia',     label: 'Permiso de residencia'     },
  { value: 'pasaporte',              label: 'Pasaporte'                 },
]

export default function EditarMiembro() {
  const { id } = useParams()
  const [form, setForm]               = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile]       = useState(null)
  const [firmaPreview, setFirmaPreview] = useState(null)
  const [firmaFile, setFirmaFile]     = useState(null)
  const [hayFirma, setHayFirma]       = useState(false)
  const [dibujando, setDibujando]     = useState(false)
  const [cargando, setCargando]       = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState(false)

  const fotoInputRef  = useRef()
  const canvasRef     = useRef()
  const ultimoPunto   = useRef(null)

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    const { data } = await supabase
      .from('persona')
      .select('*')
      .eq('id', id)
      .single()
    if (data) {
      setForm({
        tipo_documento:   data.tipo_documento,
        num_documento:    data.num_documento,
        nombre:           data.nombre,
        apellido:         data.apellido,
        telefono:         data.telefono || '',
        email:            data.email    || '',
        direccion:        data.direccion || '',
        fecha_nacimiento: data.fecha_nacimiento || '',
      })
      setFotoPreview(data.foto_url  || null)
      setFirmaPreview(data.firma_url || null)
    }
    setCargando(false)
  }

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  const iniciarTrazo = (e) => {
    e.preventDefault()
    setDibujando(true)
    ultimoPunto.current = getPos(e, canvasRef.current)
  }

  const dibujar = (e) => {
    e.preventDefault()
    if (!dibujando) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e3a6e'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.stroke()
    ultimoPunto.current = pos
    setHayFirma(true)
  }

  const terminarTrazo = () => setDibujando(false)

  const limpiarFirma = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHayFirma(false)
    setFirmaPreview(null)
    setFirmaFile(null)
  }

  const capturarFirma = () => {
    canvasRef.current.toBlob(blob => {
      setFirmaFile(blob)
      setFirmaPreview(canvasRef.current.toDataURL())
    })
  }

  const subirArchivo = async (file, carpeta, nombre) => {
    const ext  = file.name?.split('.').pop() || 'png'
    const path = `${carpeta}/${nombre}.${ext}`
    await supabase.storage.from('personas').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('personas').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    try {
      const { data: personaActual } = await supabase
        .from('persona')
        .select('codigo_unico, foto_url, firma_url')
        .eq('id', id)
        .single()

      const codigo = personaActual.codigo_unico
      const updates = { ...form }

      if (fotoFile) {
        updates.foto_url = await subirArchivo(fotoFile, 'fotos', codigo)
      }

      if (firmaFile) {
        const firmaBlob = new File([firmaFile], `${codigo}.png`, { type: 'image/png' })
        updates.firma_url = await subirArchivo(firmaBlob, 'firmas', codigo)
      }

      const { error: err } = await supabase
        .from('persona')
        .update(updates)
        .eq('id', id)

      if (err) throw new Error(err.message)

      setExito(true)
      setTimeout(() => window.location.href = `/funcionario/miembros/${id}`, 1500)

    } catch (err) {
      setError(err.message || 'Error al guardar')
    }

    setGuardando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (exito) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-xs">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[#1e3a6e] font-bold text-lg">¡Datos actualizados!</h2>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Editar miembro</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Foto */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-3">Foto</p>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fotoInputRef.current.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:border-[#1e3a6e] transition-colors flex-shrink-0"
            >
              {fotoPreview
                ? <img src={fotoPreview} className="w-full h-full object-cover" alt="foto" />
                : <Camera size={28} className="text-gray-300" />
              }
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => fotoInputRef.current.click()}
                className="text-sm bg-[#eef2fa] text-[#1e3a6e] px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                <Camera size={15} /> Cambiar foto
              </button>
              {fotoFile && (
                <button type="button" onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                  className="text-xs text-red-400 flex items-center gap-1">
                  <X size={13} /> Cancelar cambio
                </button>
              )}
            </div>
          </div>
          <input ref={fotoInputRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFoto} />
        </div>

        {/* Datos personales */}
        {form && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            <p className="text-sm font-medium text-[#1e3a6e]">Datos personales</p>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo de documento</label>
              <select value={form.tipo_documento} onChange={set('tipo_documento')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
                {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Número de documento</label>
              <input type="text" value={form.num_documento} onChange={set('num_documento')} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input type="text" value={form.nombre} onChange={set('nombre')} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Apellido</label>
                <input type="text" value={form.apellido} onChange={set('apellido')} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
              <input type="tel" value={form.telefono} onChange={set('telefono')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={set('email')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Dirección</label>
              <input type="text" value={form.direccion} onChange={set('direccion')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
          </div>
        )}

        {/* Nueva firma */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-1">Actualizar firma</p>
          {firmaPreview && !firmaFile && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Firma actual:</p>
              <img src={firmaPreview} className="h-10 object-contain border border-gray-100 rounded-lg p-1" alt="firma actual" />
            </div>
          )}
          <p className="text-xs text-gray-400 mb-2">Dibuja para reemplazar la firma actual</p>
          <canvas
            ref={canvasRef}
            width={500} height={140}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none cursor-crosshair"
            onMouseDown={iniciarTrazo} onMouseMove={dibujar}
            onMouseUp={terminarTrazo} onMouseLeave={terminarTrazo}
            onTouchStart={iniciarTrazo} onTouchMove={dibujar} onTouchEnd={terminarTrazo}
          />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={limpiarFirma}
              className="text-xs text-gray-400 flex items-center gap-1 hover:text-red-400 transition-colors">
              <RotateCcw size={12} /> Limpiar
            </button>
            {hayFirma && (
              <button type="button" onClick={capturarFirma}
                className="text-xs text-[#1e3a6e] flex items-center gap-1 ml-auto font-medium">
                ✓ Confirmar firma
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[#c0152a] text-sm text-center bg-red-50 rounded-xl py-3">{error}</p>
        )}

        <button type="submit" disabled={guardando}
          className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#162d58] transition-colors disabled:opacity-50">
          <Save size={17} />
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}