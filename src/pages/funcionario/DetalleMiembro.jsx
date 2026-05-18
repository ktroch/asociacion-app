import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { cerrarSesion } from '../../utils/auth'
import { QRCodeCanvas } from 'qrcode.react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut, CreditCard, Download, User, Phone, Mail, MapPin, Calendar, Hash } from 'lucide-react'
import jsPDF from 'jspdf'

const DISCLAIMER_ES = 'Esta identificación es personal e intransferible. APA Zürich se reserva el derecho de retirarla por uso indebido.'
const DISCLAIMER_EN = 'This ID is personal and non-transferable. APA Zürich reserves the right to withdraw it for improper use.'
const DISCLAIMER_DE = 'Dieser Ausweis ist persoenlich und nicht uebertragbar. APA Zuerich behaelt sich das Recht vor, ihn bei Missbrauch einzuziehen.'

export default function DetalleMiembro() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [persona, setPersona]     = useState(null)
  const [miembro, setMiembro]     = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [generando, setGenerando] = useState(false)
  const [fotoError, setFotoError] = useState(false)
  const [firmaError, setFirmaError] = useState(false)

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('persona')
      .select(`*, miembro(*)`)
      .eq('id', id)
      .single()
    if (data) {
      setPersona(data)
      setMiembro(data.miembro?.[0] || null)
    }
    setCargando(false)
  }

  const estadoColor = (estado) => {
    if (estado === 'activo')   return 'bg-green-100 text-green-700'
    if (estado === 'inactivo') return 'bg-gray-100 text-gray-500'
    return 'bg-red-100 text-red-600'
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  // Carga imagen via fetch para evitar problemas de CORS con canvas
  const cargarImagenComoBase64 = async (url) => {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('No se pudo cargar la imagen')
    const blob = await resp.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const generarTarjetaPDF = async () => {
    setGenerando(true)
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 53.98] })
      const W = 85.6
      const H = 53.98

      // ══════════════════════════════════════
      // CARA FRONTAL
      // ══════════════════════════════════════

      // Fondo azul marino
      pdf.setFillColor(30, 58, 110)
      pdf.rect(0, 0, W, H, 'F')

      // Franja roja derecha
      pdf.setFillColor(192, 21, 42)
      pdf.rect(W - 24, 0, 24, H, 'F')

      // Línea blanca separadora
      pdf.setFillColor(255, 255, 255)
      pdf.rect(W - 24.5, 0, 0.5, H, 'F')

      // Logo APA texto
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('APA', 4, 9)
      pdf.setFontSize(4.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(180, 200, 230)
      pdf.text('Aprende, Preparate y Avanza', 4, 13)

      // Línea divisoria bajo header
      pdf.setDrawColor(255, 255, 255)
      pdf.setLineWidth(0.2)
      pdf.setLineDashPattern([1, 1], 0)
      pdf.line(4, 15.5, W - 26, 15.5)
      pdf.setLineDashPattern([], 0)

      // ── Foto ──
      let fotoData = null
      if (persona.foto_url) {
        try {
          fotoData = await cargarImagenComoBase64(persona.foto_url)
        } catch (e) {
          console.warn('No se pudo cargar la foto:', e)
        }
      }

      if (fotoData) {
        pdf.setFillColor(255, 255, 255)
        pdf.roundedRect(3.5, 17.5, 19, 24, 1, 1, 'F')
        pdf.addImage(fotoData, 'JPEG', 4, 18, 18, 23)
      } else {
        pdf.setFillColor(20, 45, 90)
        pdf.roundedRect(3.5, 17.5, 19, 24, 1, 1, 'F')
        pdf.setTextColor(100, 130, 180)
        pdf.setFontSize(6)
        pdf.text('FOTO', 13, 31, { align: 'center' })
      }

      // ── Datos ──
      const xDatos = 25
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${persona.apellido}, ${persona.nombre}`, xDatos, 22)

      pdf.setFontSize(5.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(180, 200, 230)

      const tipoDoc = {
        tarjeta_identificacion: 'T. Identificacion',
        permiso_residencia:     'Permiso Residencia',
        pasaporte:              'Pasaporte',
      }

      pdf.text(`ID: ${persona.codigo_unico}`, xDatos, 27)
      pdf.text(`Doc: ${tipoDoc[persona.tipo_documento] || ''} ${persona.num_documento}`, xDatos, 31)

      if (miembro) {
        pdf.setTextColor(150, 180, 220)
        pdf.text(`Expedicion: ${formatFecha(miembro.fecha_ingreso)}`, xDatos, 35)
        pdf.text(`Vence: ${formatFecha(miembro.fecha_vencimiento)}`, xDatos, 39)
      }

      // Chip decorativo
      pdf.setFillColor(200, 170, 80)
      pdf.roundedRect(xDatos, 41, 10, 7, 0.5, 0.5, 'F')
      pdf.setDrawColor(180, 150, 60)
      pdf.setLineWidth(0.3)
      pdf.line(xDatos, 44.5, xDatos + 10, 44.5)
      pdf.line(xDatos + 3.3, 41, xDatos + 3.3, 48)
      pdf.line(xDatos + 6.6, 41, xDatos + 6.6, 48)

      // Nota: firma va en el reverso solamente
      // Disclaimer frontal pequeño
      pdf.setFontSize(3.5)
      pdf.setTextColor(100, 130, 170)
      pdf.text('Tarjeta de membresia oficial · APA Zurich © ' + new Date().getFullYear(), 4, 52.5)

      // ── QR en franja roja ──
      const qrCanvas = document.querySelector('#qr-card canvas')
      if (qrCanvas) {
        const qrData = qrCanvas.toDataURL('image/png')
        pdf.addImage(qrData, 'PNG', W - 22, 3, 18, 18)
      }

      // Etiqueta MIEMBRO bajo QR
      pdf.setFillColor(150, 10, 25)
      pdf.rect(W - 24, 22, 24, 8, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('MIEMBRO', W - 12, 27.5, { align: 'center' })

      // Código corto
      pdf.setFontSize(4)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(220, 180, 180)
      const codigoParts = persona.codigo_unico.split('-')
      pdf.text(codigoParts[codigoParts.length - 1], W - 12, 34, { align: 'center' })

      // Decorativo
      pdf.setTextColor(180, 100, 110)
      pdf.setFontSize(16)
      pdf.text('*', W - 12, 46, { align: 'center' })

      // ══════════════════════════════════════
      // CARA TRASERA
      // ══════════════════════════════════════
      pdf.addPage()

      // Fondo blanco con franjas azules
      pdf.setFillColor(248, 250, 255)
      pdf.rect(0, 0, W, H, 'F')
      pdf.setFillColor(30, 58, 110)
      pdf.rect(0, 0, W, 8, 'F')
      pdf.rect(0, H - 8, W, 8, 'F')

      // Header trasero
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'bold')
      pdf.text('APA — Aprende, Preparate y Avanza', W / 2, 5.5, { align: 'center' })

      // Footer trasero con código
      pdf.setFontSize(5)
      pdf.setFont('helvetica', 'normal')
      pdf.text(persona.codigo_unico, W / 2, H - 3.5, { align: 'center' })

      // ── Disclaimers ──
      const margen = 5
      const anchoTexto = W - margen * 2
      let yActual = 12

      // Español
      pdf.setFontSize(5.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 58, 110)
      pdf.text('Espanol:', margen, yActual)
      yActual += 3.5
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(50, 50, 70)
      pdf.setFontSize(5)
      const esLines = pdf.splitTextToSize(DISCLAIMER_ES, anchoTexto)
      pdf.text(esLines, margen, yActual)
      yActual += esLines.length * 3.5 + 3

      // Inglés
      pdf.setFontSize(5.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 58, 110)
      pdf.text('English:', margen, yActual)
      yActual += 3.5
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(50, 50, 70)
      pdf.setFontSize(5)
      const enLines = pdf.splitTextToSize(DISCLAIMER_EN, anchoTexto)
      pdf.text(enLines, margen, yActual)
      yActual += enLines.length * 3.5 + 3

      // Alemán
      pdf.setFontSize(5.5)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(30, 58, 110)
      pdf.text('Deutsch:', margen, yActual)
      yActual += 3.5
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(50, 50, 70)
      pdf.setFontSize(5)
      const deLines = pdf.splitTextToSize(DISCLAIMER_DE, anchoTexto)
      pdf.text(deLines, margen, yActual)
      yActual += deLines.length * 3.5 + 4

      // ── Firma en reverso ──
      let firmaData = null
      if (persona.firma_url) {
        try {
          firmaData = await cargarImagenComoBase64(persona.firma_url)
        } catch (e) {
          console.warn('No se pudo cargar la firma:', e)
        }
      }

      if (firmaData && yActual + 10 < H - 10) {
        pdf.setDrawColor(180, 180, 200)
        pdf.setLineWidth(0.2)
        pdf.addImage(firmaData, 'PNG', margen, yActual, 30, 7)
        yActual += 7.5
        pdf.line(margen, yActual, margen + 30, yActual)
        yActual += 3
        pdf.setFontSize(4)
        pdf.setTextColor(150, 150, 170)
        pdf.text('Firma del titular', margen, yActual)
      }

      pdf.save(`tarjeta-${persona.codigo_unico}.pdf`)

    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF: ' + err.message)
    }
    setGenerando(false)
  }

  if (cargando) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (!persona) return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <p className="text-gray-400">Miembro no encontrado</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/funcionario/miembros')}><ArrowLeft size={20} /></button>
          <span className="font-bold text-base">Detalle del miembro</span>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] text-white text-sm px-3 py-2 rounded-lg">
          <LogOut size={15} />
        </button>
      </header>

      <main className="p-4 max-w-lg mx-auto flex flex-col gap-4 pb-10">

        {/* Preview tarjeta */}
        <div className="bg-[#1e3a6e] rounded-2xl overflow-hidden shadow-lg">
          <div className="flex">
            <div className="flex-1 p-4">
              <div className="flex items-start gap-3">

                {/* Foto */}
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-[#162d58] flex-shrink-0 border-2 border-white/20 flex items-center justify-center">
                  {persona.foto_url && !fotoError ? (
                    <img
                      src={persona.foto_url}
                      className="w-full h-full object-cover"
                      alt="foto"
                      onError={() => setFotoError(true)}
                    />
                  ) : (
                    <User size={24} className="text-white/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[#eef2fa] text-xs font-medium mb-0.5">APA — Miembro</p>
                  <p className="text-white font-bold text-sm leading-tight">
                    {persona.apellido}, {persona.nombre}
                  </p>
                  <p className="text-blue-200 text-xs mt-1 font-mono truncate">{persona.codigo_unico}</p>
                  {miembro && (
                    <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor(miembro.estado)}`}>
                      {miembro.estado}
                    </span>
                  )}
                  {miembro && (
                    <p className="text-blue-200 text-xs mt-1.5">
                      Vence: {formatFecha(miembro.fecha_vencimiento)}
                    </p>
                  )}
                </div>
              </div>

              {/* Firma */}
              {persona.firma_url && !firmaError && (
                <div className="mt-3 border-t border-white/10 pt-2">
                  <img
                    src={persona.firma_url}
                    className="h-8 object-contain opacity-80"
                    alt="firma"
                    onError={() => setFirmaError(true)}
                  />
                </div>
              )}
            </div>

            {/* Franja roja QR */}
            <div className="bg-[#c0152a] w-20 flex flex-col items-center justify-start gap-2 p-2 pt-3">
              <div id="qr-card" className="bg-white rounded p-1">
                <QRCodeCanvas value={persona.codigo_unico} size={58} level="M" />
              </div>
              <div className="mt-1 bg-[#96000f] rounded px-2 py-0.5">
                <p className="text-white text-xs font-bold tracking-widest text-center">MIEMBRO</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-t border-white/10">
            <p className="text-blue-200 text-xs opacity-60">
              Esta tarjeta es propiedad de APA Zürich. En caso de encontrarla, por favor devuélvala.
            </p>
          </div>
        </div>

        {/* Botón PDF */}
        <button onClick={generarTarjetaPDF} disabled={generando}
          className="bg-[#1e3a6e] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#162d58] transition-colors disabled:opacity-50">
          <CreditCard size={18} />
          {generando ? 'Generando PDF...' : 'Descargar tarjeta para imprimir'}
          {!generando && <Download size={16} />}
        </button>
        
        {/* Botón Editar Miembro */}
        <button onClick={() => window.location.href = `/funcionario/miembros/${id}/editar`}
          className="bg-white text-[#1e3a6e] border border-[#1e3a6e] rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-[#eef2fa] transition-colors text-sm"
        >
          Editar datos del miembro
        </button>

        {/* Información completa */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-[#1e3a6e]">Información completa</p>
          {[
            { icono: Hash,     label: 'Código único',  valor: persona.codigo_unico },
            { icono: User,     label: 'Documento',     valor: `${persona.tipo_documento.replace(/_/g,' ')} · ${persona.num_documento}` },
            { icono: Calendar, label: 'Nacimiento',    valor: formatFecha(persona.fecha_nacimiento) },
            { icono: Phone,    label: 'Teléfono',      valor: persona.telefono  || '—' },
            { icono: Mail,     label: 'Email',         valor: persona.email     || '—' },
            { icono: MapPin,   label: 'Dirección',     valor: persona.direccion || '—' },
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
          {miembro && (
            <>
              <div className="flex items-start gap-3">
                <div className="bg-[#eef2fa] rounded-lg p-1.5 flex-shrink-0">
                  <Calendar size={14} className="text-[#1e3a6e]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Fecha de ingreso</p>
                  <p className="text-sm text-gray-700">{formatFecha(miembro.fecha_ingreso)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-[#eef2fa] rounded-lg p-1.5 flex-shrink-0">
                  <Calendar size={14} className="text-[#1e3a6e]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Vencimiento membresía</p>
                  <p className="text-sm text-gray-700">{formatFecha(miembro.fecha_vencimiento)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}