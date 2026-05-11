import { useNavigate } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";
import CrearTorneoWorkspace from "../components/torneo/CrearTorneoWorkspace";

/**
 * Panel principal: mismo layout que `create_new_tournament.html` (formulario + barra lateral).
 * Los usuarios sin rol organizador ven el formulario en solo lectura y un aviso.
 */
export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfcfc] font-sans text-slate-800">
      <ArenaHeader bg="gray" />
      <div className="flex-1 p-4 md:p-8 lg:p-12">
        <CrearTorneoWorkspace
          showTorneosLinkInIntro
          onCancel={() => navigate("/torneos")}
        />
      </div>
    </div>
  );
}
