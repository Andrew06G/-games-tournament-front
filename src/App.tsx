import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import CrearTorneo from "./pages/CrearTorneo";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Notificaciones from "./pages/Notificaciones";
import Register from "./pages/Register";
import ResultadosHub from "./pages/ResultadosHub";
import TorneoBracket from "./pages/TorneoBracket";
import TorneoEquipos from "./pages/TorneoEquipos";
import TorneoList from "./pages/TorneoList";
import TorneoRegistrarResultado from "./pages/TorneoRegistrarResultado";
import TorneoValidarResultados from "./pages/TorneoValidarResultados";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="notificaciones"
        element={
          <ProtectedRoute>
            <Notificaciones />
          </ProtectedRoute>
        }
      />
      <Route path="torneos/:id/bracket" element={<TorneoBracket />} />
      <Route path="torneos/:id/equipos" element={<TorneoEquipos />} />
      <Route
        path="torneos/:id/registrar-resultado"
        element={
          <ProtectedRoute>
            <TorneoRegistrarResultado />
          </ProtectedRoute>
        }
      />
      <Route
        path="torneos/:id/validar-resultados"
        element={
          <ProtectedRoute>
            <TorneoValidarResultados />
          </ProtectedRoute>
        }
      />
      <Route path="torneos" element={<TorneoList />} />
      <Route path="resultados" element={<ResultadosHub />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route
        path="torneos/crear"
        element={
          <ProtectedRoute>
            <CrearTorneo />
          </ProtectedRoute>
        }
      />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
