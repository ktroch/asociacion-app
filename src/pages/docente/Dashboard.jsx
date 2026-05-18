import { BookOpen, ClipboardList, CheckSquare, GraduationCap, LogOut } from 'lucide-react'
import { getUsuario, cerrarSesion } from '../../utils/auth'

const modulos = [
  { titulo: 'Mis cursos',      icono: BookOpen,      ruta: '/docente/cursos'         },
  { titulo: 'Inscripciones',   icono: ClipboardList,  ruta: '/docente/inscripciones'  },
  { titulo: 'Asistencia',      icono: CheckSquare,    ruta: '/docente/asistencia'     },
  { titulo: 'Calificaciones',  icono: GraduationCap,  ruta: '/docente/calificaciones' },
]

export default function DashboardDocente() {
  const usuario = getUsuario()

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      <header className="bg-[#1e3a6e] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="APA" className="h-9 object-contain" />
          <span className="font-bold text-base tracking-wide">APA</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-blue-200">Docente</p>
            <p className="text-sm font-medium">{usuario?.nombre} {usuario?.apellido}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 bg-[#c0152a] hover:bg-[#a01020] transition-colors text-white text-sm px-3 py-2 rounded-lg"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="px-4 pt-6 pb-2">
        <h2 className="text-[#1e3a6e] text-lg font-bold">
          Hola, {usuario?.nombre} 👋
        </h2>
        <p className="text-gray-500 text-sm">Panel de docente</p>
      </div>

      <main className="p-4 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {modulos.map(({ titulo, icono: Icono, ruta }) => (
          <button
            key={titulo}
            onClick={() => window.location.href = ruta}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-[#1e3a6e] transition-all group"
          >
            <div className="bg-[#eef2fa] group-hover:bg-[#1e3a6e] transition-colors rounded-xl p-3">
              <Icono size={28} className="text-[#1e3a6e] group-hover:text-white transition-colors" />
            </div>
            <span className="text-[#1e3a6e] font-medium text-sm">{titulo}</span>
          </button>
        ))}
      </main>

    </div>
  )
}