import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

export default function EscanerQR({ onResultado, onCerrar }) {
  const scannerRef  = useRef(null)
  const [estado, setEstado] = useState('iniciando')
  const idDiv = 'qr-reader-box'

  useEffect(() => {
    let scanner
    let montado = true

    const iniciar = async () => {
      await new Promise(r => setTimeout(r, 400))
      if (!montado) return

      try {
        scanner = new Html5Qrcode(idDiv, { verbose: false })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 200 },
          (texto) => {
            if (!montado) return
            montado = false
            scanner.stop().catch(() => {}).finally(() => onResultado(texto))
          },
          () => {}
        )

        if (montado) setEstado('listo')
      } catch (err) {
        console.error(err)
        if (montado) setEstado('error')
      }
    }

    iniciar()

    return () => {
      montado = false
      scannerRef.current?.isScanning &&
        scannerRef.current.stop().catch(() => {})
    }
  }, [])

  const cerrar = () => {
    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      scanner.stop().catch(() => {}).finally(onCerrar)
    } else {
      onCerrar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-xs">

        {/* Header */}
        <div className="bg-[#1e3a6e] px-4 py-3 flex items-center justify-between">
          <p className="text-white font-medium text-sm">Escanear QR</p>
          <button onClick={cerrar} className="text-white">
            <X size={20} />
          </button>
        </div>

        {/* Área del escáner — solo un div limpio, sin nada dentro */}
        <div className="p-3">
          <div id={idDiv} className="rounded-xl overflow-hidden w-full" />

          <p className="text-center text-xs mt-3 pb-1
            {estado === 'error' ? 'text-red-400' : 'text-gray-400'}">
            {estado === 'iniciando' && 'Iniciando cámara...'}
            {estado === 'listo'     && 'Apunta el QR al recuadro'}
            {estado === 'error'     && 'No se pudo acceder a la cámara'}
          </p>
        </div>

      </div>
    </div>
  )
}