import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/** Layout legado; las rutas principales usan `ArenaHeader`. */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esOrganizador = user?.globalRoles.includes("organizador") ?? false;

  function handleSalir() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="font-medium text-[var(--text-h)] hover:text-[var(--accent)]"
          >
            ArenaManager
          </Link>
          <Link
            to="/torneos"
            className="text-sm text-[var(--text)] hover:text-[var(--accent)]"
          >
            Torneos
          </Link>
          <Link
            to="/notificaciones"
            className="text-sm text-[var(--text)] hover:text-[var(--accent)]"
          >
            Notificaciones
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-[var(--text)]">{user.nombre}</span>
                {esOrganizador ? (
                  <Link
                    to="/torneos/crear"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Crear torneo
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--code-bg)]"
                  onClick={handleSalir}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[var(--accent)] hover:underline"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="text-[var(--accent)] hover:underline"
                >
                  Registro
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--border)] px-4 py-4 text-center text-sm text-[var(--text)]">
        Sistema de torneos — proyecto académico
      </footer>
    </div>
  );
}
