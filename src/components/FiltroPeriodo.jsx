export default function FiltroPeriodo({ valor, onChange }) {
  const anioActual = new Date().getFullYear()
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i)
  const meses = [
    { value: '01', label: 'Enero'      },
    { value: '02', label: 'Febrero'    },
    { value: '03', label: 'Marzo'      },
    { value: '04', label: 'Abril'      },
    { value: '05', label: 'Mayo'       },
    { value: '06', label: 'Junio'      },
    { value: '07', label: 'Julio'      },
    { value: '08', label: 'Agosto'     },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre'    },
    { value: '11', label: 'Noviembre'  },
    { value: '12', label: 'Diciembre'  },
  ]

  return (
    <div className="flex gap-2">
      <select
        value={valor.mes}
        onChange={e => onChange({ ...valor, mes: e.target.value })}
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
      >
        <option value="">Todos los meses</option>
        {meses.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        value={valor.anio}
        onChange={e => onChange({ ...valor, anio: e.target.value })}
        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
      >
        <option value="">Todos</option>
        {anios.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  )
}