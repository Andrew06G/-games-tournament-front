import { Navigate } from "react-router-dom";

/** Redirige al flujo de crear torneo (antes duplicaba el panel). */
export default function Dashboard() {
  return <Navigate to="/torneos/crear" replace />;
}
