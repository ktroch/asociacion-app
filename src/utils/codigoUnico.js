const cifrarCesar7 = (texto) => {
  return String(texto).toUpperCase().split('').map(char => {
    if (char >= '0' && char <= '9') {
      return String((parseInt(char) + 7) % 10)
    }
    if (char >= 'A' && char <= 'Z') {
      return String.fromCharCode(((char.charCodeAt(0) - 65 + 7) % 26) + 65)
    }
    return char
  }).join('')
}

export const generarCodigoUnico = async (numDocumento, supabase) => {
  const anio = new Date().getFullYear()
  const documentoCifrado = cifrarCesar7(numDocumento)

  const { count } = await supabase
    .from('persona')
    .select('id', { count: 'exact', head: true })

  const numero = String((count || 0) + 1).padStart(5, '0')

  return `APA-${anio}-${documentoCifrado}-${numero}`
}

export const generarUsername = async (nombre, apellido, supabase) => {
  const base = (nombre[0] + apellido).toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

  const { data } = await supabase
    .from('persona')
    .select('username')
    .ilike('username', `${base}%`)

  if (!data || data.length === 0) return base

  const numeros = data
    .map(d => d.username.replace(base, ''))
    .map(s => parseInt(s) || 0)

  const siguiente = Math.max(...numeros) + 1
  return siguiente === 1 ? base : `${base}${siguiente}`
}