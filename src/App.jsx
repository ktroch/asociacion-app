import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import RutaProtegida from './components/RutaProtegida'
import DashboardFuncionario from './pages/funcionario/Dashboard'
import DashboardDocente from './pages/docente/Dashboard'
import Miembros from './pages/funcionario/Miembros'
import NuevoMiembro from './pages/funcionario/NuevoMiembro'
import DetalleMiembro from './pages/funcionario/DetalleMiembro'
import EditarMiembro from './pages/funcionario/EditarMiembro'
import Personal       from './pages/funcionario/Personal'
import DetallePersonal from './pages/funcionario/DetallePersonal'
import Patrocinadores    from './pages/funcionario/Patrocinadores'
import NuevoPatrocinador from './pages/funcionario/NuevoPatrocinador'
import DetallePatrocinador from './pages/funcionario/DetallePatrocinador'
import EditarPatrocinador from './pages/funcionario/EditarPatrocinador'
import Donaciones    from './pages/funcionario/Donaciones'
import NuevaDonacion from './pages/funcionario/NuevaDonacion'
import DetalleDonacion from './pages/funcionario/DetalleDonacion'
import Inventario      from './pages/funcionario/Inventario'
import Gastos     from './pages/funcionario/Gastos'
import NuevoGasto from './pages/funcionario/NuevoGasto'

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
      <Route path="/funcionario/personal" element={
        <RutaProtegida rolRequerido="funcionario">
          <Personal />
        </RutaProtegida>
      } />
      <Route path="/funcionario/personal/:id" element={
        <RutaProtegida rolRequerido="funcionario">
          <DetallePersonal />
        </RutaProtegida>
      } />
      <Route path="/funcionario/personal/:id/editar" element={
        <RutaProtegida rolRequerido="funcionario">
          <EditarMiembro />
        </RutaProtegida>
      } />
      <Route path="/funcionario/patrocinadores" element={
        <RutaProtegida rolRequerido="funcionario">
          <Patrocinadores />
        </RutaProtegida>
      } />
      <Route path="/funcionario/patrocinadores/nuevo" element={
        <RutaProtegida rolRequerido="funcionario">
          <NuevoPatrocinador />
        </RutaProtegida>
      } />
      <Route path="/funcionario/patrocinadores/:id" element={
        <RutaProtegida rolRequerido="funcionario">
          <DetallePatrocinador />
        </RutaProtegida>
      } />
      <Route path="/funcionario/patrocinadores/:id/editar" element={
        <RutaProtegida rolRequerido="funcionario">
          <EditarPatrocinador />
        </RutaProtegida>
      } />
      <Route path="/funcionario/donaciones" element={
        <RutaProtegida rolRequerido="funcionario">
          <Donaciones />
        </RutaProtegida>
      } />
      <Route path="/funcionario/donaciones/nueva" element={
        <RutaProtegida rolRequerido="funcionario">
          <NuevaDonacion />
        </RutaProtegida>
      } />
      <Route path="/funcionario/donaciones/:id" element={
        <RutaProtegida rolRequerido="funcionario">
          <DetalleDonacion />
        </RutaProtegida>
      } />
      <Route path="/funcionario/inventario" element={
        <RutaProtegida rolRequerido="funcionario">
          <Inventario />
        </RutaProtegida>
      } />
      <Route path="/funcionario/gastos" element={
        <RutaProtegida rolRequerido="funcionario">
          <Gastos />
        </RutaProtegida>
      } />
      <Route path="/funcionario/gastos/nuevo" element={
        <RutaProtegida rolRequerido="funcionario">
          <NuevoGasto />
        </RutaProtegida>
      } />
    </Routes>
  )
}