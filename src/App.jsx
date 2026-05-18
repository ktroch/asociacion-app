import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import RutaProtegida from './components/RutaProtegida'
import DashboardFuncionario from './pages/funcionario/Dashboard'
import DashboardDocente from './pages/docente/Dashboard'
import Miembros from './pages/funcionario/Miembros'
import NuevoMiembro from './pages/funcionario/NuevoMiembro'
import DetalleMiembro from './pages/funcionario/DetalleMiembro'
import EditarMiembro from './pages/funcionario/EditarMiembro'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/funcionario" element={
        <RutaProtegida rolRequerido="funcionario">
          <DashboardFuncionario />
        </RutaProtegida>
      } />
      <Route path="/funcionario/miembros" element={
        <RutaProtegida rolRequerido="funcionario">
          <Miembros />
        </RutaProtegida>
      } />
      <Route path="/docente" element={
        <RutaProtegida rolRequerido="docente">
          <DashboardDocente />
        </RutaProtegida>
      } />
      <Route path="/funcionario/miembros/nuevo" element={
        <RutaProtegida rolRequerido="funcionario">
          <NuevoMiembro />
        </RutaProtegida>
      } />
      <Route path="/funcionario/miembros/:id" element={
        <RutaProtegida rolRequerido="funcionario">
          <DetalleMiembro />
        </RutaProtegida>
      } />
      <Route path="/funcionario/miembros/:id/editar" element={
        <RutaProtegida rolRequerido="funcionario">
          <EditarMiembro />
        </RutaProtegida>
      } />
    </Routes>
  )
}