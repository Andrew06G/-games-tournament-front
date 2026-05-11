import { useNavigate } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";
import CrearTorneoWorkspace from "../components/torneo/CrearTorneoWorkspace";

/** Misma experiencia que `/dashboard`; aquí el botón Cancelar vuelve atrás en el historial. */
export default function CrearTorneo() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfc] font-sans text-slate-800">
      <ArenaHeader bg="gray" />
      <div className="flex-1 p-4 md:p-8 lg:p-10">
        <CrearTorneoWorkspace
          showTorneosLinkInIntro
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
