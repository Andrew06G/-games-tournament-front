import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export type ArenaNavActive = "torneos" | "resultados" | "notificaciones";

type ArenaHeaderProps = {
  active?: ArenaNavActive | null;
  bg?: "gray" | "white";
  sticky?: boolean;
  trailingSlot?: ReactNode;
};

function navClass(isActive: boolean): string {
  if (isActive) {
    return "border-b-2 border-black pb-1 text-base font-bold text-black";
  }
  return "text-base text-[#5c5f60] transition-colors hover:text-black";
}

export default function ArenaHeader({
  active = null,
  bg = "gray",
  sticky = true,
  trailingSlot,
}: ArenaHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const stickyCls = sticky ? "sticky top-0 z-50" : "";
  const bgCls =
    bg === "white"
      ? "border-b border-[#cfc4c5] bg-white"
      : "border-b border-[#cfc4c5] bg-[#f9f9f9]";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <header className={`${stickyCls} ${bgCls}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4 md:gap-4 md:px-10">
        <div className="flex min-w-0 shrink-0 items-center gap-4 md:gap-8">
          <Link to="/" className="shrink-0 text-2xl font-bold text-black">
            ArenaManager
          </Link>
          <nav className="hidden shrink-0 items-center gap-4 md:flex md:gap-6">
            <Link to="/torneos" className={navClass(active === "torneos")}>
              Torneos
            </Link>
            <Link
              to="/resultados"
              className={navClass(active === "resultados")}
            >
              Resultados
            </Link>
          </nav>
        </div>
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 overflow-x-auto md:gap-3">
          {trailingSlot}
          <Link
            to="/torneos/crear"
            className="shrink-0 whitespace-nowrap rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Crear Torneo
          </Link>
          <Link
            to="/notificaciones"
            className={`hidden shrink-0 whitespace-nowrap text-sm md:inline ${
              active === "notificaciones"
                ? "border-b-2 border-black pb-0.5 font-bold text-black"
                : "text-[#5c5f60] hover:text-black"
            }`}
          >
            Notificaciones
          </Link>
          {user ? (
            <>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cfc4c5] bg-[#e8e8e8] text-sm font-bold text-[#1b1b1b]"
                title={user.nombre}
              >
                {user.nombre.slice(0, 1).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 whitespace-nowrap rounded-lg border border-[#cfc4c5] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-white"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="shrink-0 rounded-full border border-[#cfc4c5] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f3f3f3]"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="hidden shrink-0 text-sm font-semibold text-[#5c5f60] hover:text-black md:inline"
              >
                Registro
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
