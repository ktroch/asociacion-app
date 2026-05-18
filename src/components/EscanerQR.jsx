import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

export default function EscanerQR({ onResultado, onCerrar }) {
  const scannerRef = useRef(null)
  const [iniciado, setIniciado] = useState(false)
  const idDiv = 'qr-reader'

  useEffect(() => {
    let scanner

    const iniciar = async () => {
      await new Promise(r => setTimeout(r, 300))

      scanner = new Html5Qrcode(idDiv, { verbose: false })
      scannerRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 230, height: 230 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (texto) => {
            scanner.stop().finally(() => onResultado(texto))
          },
          () => {}
        )
        setIniciado(true)
      } catch (err) {
        console.error('Error cámara:', err)
      }
    }

    iniciar()

    return () => {
      if (scannerRef.current) {
        scannerRef.current.isScanning &&
          scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const cerrar = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().finally(onCerrar)
    } else {
      onCerrar()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">

        <div className="bg-[#1e3a6e] px-4 py-3 flex items-center justify-between">
          <p className="text-white font-medium text-sm">Escanear tarjeta QR</p>
          <button onClick={cerrar} className="text-white hover:text-red-300 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div
            id={idDiv}
            className="w-full rounded-xl overflow-hidden"
          />
          <p className="text-center text-gray-400 text-xs mt-3">
            {iniciado
              ? 'Apunta el QR al centro del recuadro'
              : 'Iniciando cámara...'}
          </p>
        </div>

      </div>
    </div>
  )
}