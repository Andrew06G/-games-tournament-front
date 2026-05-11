import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export type ArenaNavActive =
  | "torneos"
  | "equipos"
  | "resultados"
  | "notificaciones";

type ArenaHeaderProps = {
  /** Pestaña principal resaltada (subrayado). */
  active?: ArenaNavActive | null;
  /** Si estamos dentro de un torneo, Equipos y Resultados apuntan a sus rutas concretas. */
  torneoContextId?: number;
  /** Fondo del header: gris claro (listados) o blanco. */
  bg?: "gray" | "white";
  sticky?: boolean;
  /** Contenido extra a la derecha antes de “Crear torneo” (p. ej. buscador). */
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
  torneoContextId,
  bg = "gray",
  sticky = true,
  trailingSlot,
}: ArenaHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const equiposHref =
    torneoContextId != null && torneoContextId > 0
      ? `/torneos/${torneoContextId}/equipos`
      : "/equipos";
  const resultadosHref =
    torneoContextId != null && torneoContextId > 0
      ? `/torneos/${torneoContextId}/bracket`
      : "/resultados";

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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
        <div className="flex flex-wrap items-center gap-8">
          <Link to="/" className="text-2xl font-bold text-black">
            ArenaManager
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/torneos"
              className={navClass(active === "torneos")}
            >
              Torneos
            </Link>
            <Link to={equiposHref} className={navClass(active === "equipos")}>
              Equipos
            </Link>
            <Link
              to={resultadosHref}
              className={navClass(active === "resultados")}
            >
              Resultados
            </Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {trailingSlot}
          <Link
            to="/torneos/crear"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Crear Torneo
          </Link>
          <Link
            to="/notificaciones"
            className={`hidden text-sm md:inline ${
              active === "notificaciones"
                ? "border-b-2 border-black pb-0.5 font-bold text-black"
                : "text-[#5c5f60] hover:text-black"
            }`}
          >
            Notificaciones
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden text-sm text-[#5c5f60] hover:text-black sm:inline"
                title="Panel"
              >
                Panel
              </Link>
              <Link
                to="/dashboard"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfc4c5] bg-[#e8e8e8] text-sm font-bold text-[#1b1b1b]"
                title={user.nombre}
              >
                {user.nombre.slice(0, 1).toUpperCase()}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-[#cfc4c5] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-white"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-[#cfc4c5] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f3f3f3]"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="hidden text-sm font-semibold text-[#5c5f60] hover:text-black md:inline"
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
