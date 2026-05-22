import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { ArrowLeft, LogOut, Save } from 'lucide-react'

const campoVacio = {
  tipo:     'persona_juridica',
  nombre:   '',
  uid:      '',
  tipo_uid: '',
  contacto: '',
  email:    '',
  telefono: '',
}

const TIPOS_UID = {
  persona_juridica: [
    { value: 'uid_che',  label: 'UID (CHE-XXX.XXX.XXX) — Suiza'     },
    { value: 'ruc',      label: 'RUC — Ecuador / Perú'               },
    { value: 'nif',      label: 'NIF/CIF — España'                   },
    { value: 'otro',     label: 'Otro registro tributario'           },
  ],
  persona_natural: [
    { value: 'uid_che',  label: 'UID (CHE-XXX.XXX.XXX) — Suiza'     },
    { value: 'cedula',   label: 'Cédula de identidad'                },
    { value: 'pasaporte',label: 'Pasaporte'                          },
    { value: 'ruc',      label: 'RUC — Ecuador / Perú'               },
    { value: 'otro',     label: 'Otro documento'                     },
  ],
}

export default function NuevoPatrocinador() {
  const navigate                  = useNavigate()
  const [form, setForm]           = useState(campoVacio)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState(false)

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const handleTipo = (tipo) => {
    setForm(f => ({ ...f, tipo, tipo_uid: '', uid: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const { error: err } = await supabase
      .from('patrocinador')
      .insert({
        tipo:     form.tipo,
        nombre:   form.nombre,
        uid:      form.uid      || null,
        tipo_uid: form.tipo_uid || null,
        contacto: form.contacto || null,
        email:    form.email    || null,
        telefono: form.telefono || null,
      })

    if (err) {
      setError(err.message)
      setGuardando(false)
      return
    }

    setExito(true)
    setTimeout(() => navigate('/funcionario/patrocinadores'), 1500)
  }

  const tiposUid = TIPOS_UID[form.tipo] || []

  const placeholderUid = () => {
    if (form.tipo_uid === 'uid_che')   return 'CHE-123.456.789'
    if (form.tipo_uid === 'ruc')       return 'ej: 1234567890001'
    if (form.tipo_uid === 'cedula')    return 'ej: 1234567890'
    if (form.tipo_uid === 'pasaporte') return 'ej: AB123456'
    return 'Número de identificación'
  }

  if (exito) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-xs">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-[#1e3a6e] font-bold text-lg">¡Patrocinador registrado!</h2>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/patrocinadores')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Nuevo patrocinador</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Tipo */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Tipo de patrocinador</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'persona_juridica', label: 'Empresa / Entidad' },
              { value: 'persona_natural',  label: 'Persona natural'   },
            ].map(op => (
              <button key={op.value} type="button" onClick={() => handleTipo(op.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors border
                  ${form.tipo === op.value
                    ? 'bg-[#1e3a6e] text-white border-[#1e3a6e]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#1e3a6e]'
                  }`}>
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datos principales */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Datos</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {form.tipo === 'persona_juridica' ? 'Nombre de la empresa / entidad *' : 'Nombre completo *'}
            </label>
            <input type="text" value={form.nombre} onChange={set('nombre')} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>

          {form.tipo === 'persona_juridica' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Persona de contacto</label>
              <input type="text" value={form.contacto} onChange={set('contacto')}
                placeholder="Nombre del representante"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={set('email')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
            <input type="tel" value={form.telefono} onChange={set('telefono')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]" />
          </div>
        </div>

        {/* Identificación fiscal */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-[#1e3a6e]">Identificación fiscal / tributaria</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {form.tipo === 'persona_juridica'
                ? 'Número de registro de la empresa u organización'
                : 'UID si es profesional independiente, o número de documento personal'}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo de identificación</label>
            <select value={form.tipo_uid} onChange={set('tipo_uid')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]">
              <option value="">— Seleccionar —</option>
              {tiposUid.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {form.tipo_uid && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Número</label>
              <input
                type="text"
                value={form.uid}
                onChange={set('uid')}
                placeholder={placeholderUid()}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a6e] font-mono"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="text-[#c0152a] text-sm text-center bg-red-50 rounded-xl py-3">{error}</p>
        )}

        <button type="submit" disabled={guardando}
          className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#162d58] transition-colors disabled:opacity-50">
          <Save size={17} />
          {guardando ? 'Guardando...' : 'Registrar patrocinador'}
        </button>
      </form>
    </div>
  )
}