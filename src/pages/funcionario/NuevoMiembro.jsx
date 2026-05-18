import { useState, useRef } from 'react'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { generarCodigoUnico, generarUsername } from '../../utils/codigoUnico'
import { ArrowLeft, LogOut, Camera, X, RotateCcw } from 'lucide-react'

const TIPOS_DOC = [
  { value: 'tarjeta_identificacion', label: 'Tarjeta de identificación' },
  { value: 'permiso_residencia',     label: 'Permiso de residencia'     },
  { value: 'pasaporte',              label: 'Pasaporte'                 },
]

const ROLES = [
  { value: 'miembro',      label: 'Miembro'      },
  { value: 'docente',      label: 'Docente'       },
  { value: 'funcionario',  label: 'Funcionario'   },
]

const campoVacio = {
  rol:             'miembro',
  tipo_documento:  'tarjeta_identificacion',
  num_documento:   '',
  nombre:          '',
  apellido:        '',
  telefono:        '',
  email:           '',
  direccion:       '',
  fecha_nacimiento:'',
  cargo:           '',
  especialidad:    '',
  password:        '',
}

export default function NuevoMiembro() {
  const [form, setForm]                 = useState(campoVacio)
  const [fotoPreview, setFotoPreview]   = useState(null)
  const [fotoFile, setFotoFile]         = useState(null)
  const [firmaPreview, setFirmaPreview] = useState(null)
  const [firmaFile, setFirmaFile]       = useState(null)
  const [cargando, setCargando]         = useState(false)
  const [error, setError]               = useState('')
  const [exito, setExito]               = useState(false)
  const [dibujando, setDibujando]       = useState(false)
  const [hayFirma, setHayFirma]         = useState(false)

  const fotoInputRef  = useRef()
  const canvasRef     = useRef()
  const ultimoPunto   = useRef(null)

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
    setCargando(true)
    setError('')

    if (!fotoFile) {
      setError('La foto es obligatoria')
      setCargando(false)
      return
    }

    if ((form.rol === 'funcionario' || form.rol === 'docente') && !form.password) {
      setError('La contraseña es obligatoria para funcionarios y docentes')
      setCargando(false)
      return
    }

    try {
      const codigo   = await generarCodigoUnico(form.num_documento, supabase)
      const fotoUrl  = await subirArchivo(fotoFile, 'fotos', codigo)

      let firmaUrl = null
      if (firmaFile) {
        const firmaBlob = new File([firmaFile], `${codigo}.png`, { type: 'image/png' })
        firmaUrl = await subirArchivo(firmaBlob, 'firmas', codigo)
      }

      // Generar username solo para funcionarios y docentes
      let username = null
      if (form.rol === 'funcionario' || form.rol === 'docente') {
        username = await generarUsername(form.nombre, form.apellido, supabase)
      }

      const { data: persona, error: errPersona } = await supabase
        .from('persona')
        .insert({
          codigo_unico:     codigo,
          tipo_documento:   form.tipo_documento,
          num_documento:    form.num_documento,
          nombre:           form.nombre.trim(),
          apellido:         form.apellido.trim(),
          telefono:         form.telefono,
          email:            form.email,
          direccion:        form.direccion,
          fecha_nacimiento: form.fecha_nacimiento,
          foto_url:         fotoUrl,
          firma_url:        firmaUrl,
          rol:              form.rol,
          username:         username,
          password_hash:    form.password || null,
        })
        .select()
        .single()

      if (errPersona) throw new Error(errPersona.message)

      // Insertar en tabla específica según rol
      if (form.rol === 'miembro') {
        const hoy = new Date()
        const vencimiento = new Date(hoy.setFullYear(hoy.getFullYear() + 5))
          .toISOString().split('T')[0]
        await supabase.from('miembro').insert({
          persona_id:        persona.id,
          fecha_ingreso:     new Date().toISOString().split('T')[0],
          fecha_vencimiento: vencimiento,
          estado:            'activo',
        })
      }

      if (form.rol === 'docente') {
        await supabase.from('docente').insert({
          persona_id:   persona.id,
          especialidad: form.especialidad,
          estado:       'activo',
        })
      }

      if (form.rol === 'funcionario') {
        await supabase.from('funcionario').insert({
          persona_id: persona.id,
          cargo:      form.cargo,
          estado:     'activo',
        })
      }

      setExito(true)
      setTimeout(() => {
        const destino = form.rol === 'miembro'
          ? '/funcionario/miembros'
          : '/funcionario'
        window.location.href = destino
      }, 2000)

    } catch (err) {
      setError(err.message || 'Ocurrió un error, intenta de nuevo')
    }

    setCargando(false)
  }

  const tituloRol = ROLES.find(r => r.value === form.rol)?.label || 'Persona'

  if (exito) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-xs">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[#1e3a6e] font-bold text-lg">¡{tituloRol} registrado!</h2>
        <p className="text-gray-500 text-sm mt-1">Redirigiendo...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-base">Nuevo registro</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Selector de rol */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-3">Tipo de registro</p>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, rol: r.value }))}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors border
                  ${form.rol === r.value
                    ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a6e]'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Foto */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-3">Foto *</p>
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
                className="text-sm bg-[#eef2fa] text-[#1e3a6e] px-4 py-2 rounded-lg font-medium hover:bg-[#dde6f5] transition-colors flex items-center gap-2">
                <Camera size={15} /> Tomar o subir foto
              </button>
              {fotoPreview && (
                <button type="button" onClick={() => { setFotoPreview(null); setFotoFile(null) }}
                  className="text-sm text-red-400 flex items-center gap-1">
                  <X size={13} /> Quitar foto
                </button>
              )}
            </div>
          </div>
          <input ref={fotoInputRef} type="file" accept="image/*" capture="environment"
            className="hidden" onChange={handleFoto} />
        </div>

        {/* Datos personales */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Datos personales</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo de documento *</label>
            <select value={form.tipo_documento} onChange={set('tipo_documento')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
              {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Número de documento *</label>
            <input type="text" value={form.num_documento} onChange={set('num_documento')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
              <input type="text" value={form.nombre} onChange={set('nombre')} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Apellido *</label>
              <input type="text" value={form.apellido} onChange={set('apellido')} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fecha de nacimiento *</label>
            <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} required
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

        {/* Campos extra según rol */}
        {form.rol === 'funcionario' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            <p className="text-sm font-medium text-[#1e3a6e]">Datos del funcionario</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cargo</label>
              <input type="text" value={form.cargo} onChange={set('cargo')}
                placeholder="ej: Coordinador, Director..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Usuario generado</label>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 font-mono">
                {form.nombre && form.apellido
                  ? (form.nombre[0] + form.apellido).toLowerCase()
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
                  : 'Se genera automáticamente'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Contraseña inicial *</label>
              <input type="password" value={form.password} onChange={set('password')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
          </div>
        )}

        {form.rol === 'docente' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
            <p className="text-sm font-medium text-[#1e3a6e]">Datos del docente</p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Especialidad</label>
              <input type="text" value={form.especialidad} onChange={set('especialidad')}
                placeholder="ej: Inglés, Informática..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Usuario generado</label>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2.5 font-mono">
                {form.nombre && form.apellido
                  ? (form.nombre[0] + form.apellido).toLowerCase()
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
                  : 'Se genera automáticamente'}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Contraseña inicial *</label>
              <input type="password" value={form.password} onChange={set('password')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
          </div>
        )}

        {/* Firma */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-[#1e3a6e] mb-1">Firma</p>
          <p className="text-xs text-gray-400 mb-3">Dibuja la firma en el recuadro</p>
          <canvas
            ref={canvasRef}
            width={500} height={160}
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

        <button type="submit" disabled={cargando}
          className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium hover:bg-[#162d58] transition-colors disabled:opacity-50 text-sm">
          {cargando ? 'Registrando...' : `Registrar ${tituloRol}`}
        </button>

      </form>
    </div>
  )
}