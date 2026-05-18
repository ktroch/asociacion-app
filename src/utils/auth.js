export const getUsuario = () => {
  const data = localStorage.getItem('usuario')
  return data ? JSON.parse(data) : null
}

export const cerrarSesion = () => {
  localStorage.removeItem('usuario')
  window.location.href = '/'
}

export const esFuncionario = () => {
  const u = getUsuario()
  return u?.rol === 'funcionario'
}

export const esDocente = () => {
  const u = getUsuario()
  return u?.rol === 'docente'
}