import { Navigate } from 'react-router-dom'
import { getUsuario } from '../utils/auth'

export default function RutaProtegida({ children, rolRequerido }) {
  const usuario = getUsuario()

  if (!usuario) return <Navigate to="/" />
  if (rolRequerido && usuario.rol !== rolRequerido) return <Navigate to="/" />

  return children
}