import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotificacionesNoLeidas } from "../../hooks/useNotificacionesNoLeidas";

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

function navClassMobile(isActive: boolean): string {
  if (isActive) {
    return "rounded-lg bg-black px-4 py-3 text-base font-bold text-white";
  }
  return "rounded-lg px-4 py-3 text-base text-[#1b1b1b] transition-colors hover:bg-[#f3f3f3]";
}

export default function ArenaHeader({
  active = null,
  bg = "gray",
  sticky = true,
  trailingSlot,
}: ArenaHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const noLeidasQ = useNotificacionesNoLeidas(Boolean(user));
  const noLeidas = noLeidasQ.data ?? 0;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const stickyCls = sticky ? "sticky top-0 z-50" : "";
  const bgCls =
    bg === "white"
      ? "border-b border-[#cfc4c5] bg-white"
      : "border-b border-[#cfc4c5] bg-[#f9f9f9]";
  const bellDotRing = bg === "white" ? "ring-white" : "ring-[#f9f9f9]";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const desktopActions = (
    <>
      {trailingSlot ? (
        <div className="min-w-0 shrink">{trailingSlot}</div>
      ) : null}
      <Link
        to="/torneos/crear"
        className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Crear Torneo
      </Link>
      {user ? (
        <Link
          to="/notificaciones"
          title="Notificaciones"
          aria-label={
            noLeidas > 0
              ? `Notificaciones (${noLeidas} sin leer)`
              : "Notificaciones"
          }
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
            active === "notificaciones"
              ? "bg-black text-white"
              : "text-[#5c5f60] hover:bg-[#eeeeee] hover:text-black"
          }`}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={
              active === "notificaciones"
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            notifications
          </span>
          {noLeidas > 0 ? (
            <span
              className={`absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ${bellDotRing}`}
              aria-hidden
            />
          ) : null}
        </Link>
      ) : null}
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
            className="shrink-0 rounded-lg border border-[#cfc4c5] px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-white"
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
            className="shrink-0 text-sm font-semibold text-[#5c5f60] hover:text-black"
          >
            Registro
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className={`${stickyCls} ${bgCls}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:px-10 md:py-4">
        <div className="flex w-full min-w-0 items-center justify-between gap-3 md:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8">
            <Link
              to="/"
              className="min-w-0 truncate text-lg font-bold text-black sm:text-2xl"
            >
              ArenaManager
            </Link>
            <nav
              className="hidden shrink-0 items-center gap-4 md:flex md:gap-6"
              aria-label="Principal"
            >
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

          <div className="hidden min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 md:flex md:flex-nowrap md:gap-3">
            {desktopActions}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#cfc4c5] text-[#1b1b1b] transition-colors hover:bg-[#eeeeee] md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="arena-mobile-nav"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="material-symbols-outlined text-[26px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>

        {mobileOpen ? (
          <nav
            id="arena-mobile-nav"
            className="mt-3 flex flex-col gap-1 border-t border-[#e8e8e8] pt-3 md:hidden"
            aria-label="Móvil"
          >
            <Link
              to="/torneos"
              className={navClassMobile(active === "torneos")}
              onClick={() => setMobileOpen(false)}
            >
              Torneos
            </Link>
            <Link
              to="/resultados"
              className={navClassMobile(active === "resultados")}
              onClick={() => setMobileOpen(false)}
            >
              Resultados
            </Link>

            <div className="my-2 border-t border-[#e8e8e8]" aria-hidden />

            <Link
              to="/torneos/crear"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-center text-base font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              <span className="material-symbols-outlined text-[22px]">
                add_circle
              </span>
              Crear torneo
            </Link>

            {user ? (
              <>
                <Link
                  to="/notificaciones"
                  className={`flex items-center gap-2 ${navClassMobile(active === "notificaciones")}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    notifications
                  </span>
                  Notificaciones
                  {noLeidas > 0 ? (
                    <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      {noLeidas}
                    </span>
                  ) : null}
                </Link>

                <div className="flex items-center gap-3 rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cfc4c5] bg-[#e8e8e8] text-sm font-bold text-[#1b1b1b]">
                    {user.nombre.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold text-black">
                    {user.nombre}
                  </span>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-[#cfc4c5] px-4 py-3 text-left text-base font-semibold text-black transition-colors hover:bg-[#f3f3f3]"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={navClassMobile(false)}
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className={navClassMobile(false)}
                  onClick={() => setMobileOpen(false)}
                >
                  Registro
                </Link>
              </>
            )}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
