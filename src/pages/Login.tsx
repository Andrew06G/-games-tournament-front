import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), contrasena);
      toast.success("Sesión iniciada");
      navigate(from, { replace: true });
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "No se pudo iniciar sesión";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader bg="white" />
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-4">
              <span className="material-symbols-outlined text-5xl text-black">
                sports_esports
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              ArenaManager
            </h1>
            <p className="mt-1 text-base text-[#5c5f60]">
              Gestión profesional de torneos
            </p>
          </div>

          <div className="rounded-xl border border-[#cfc4c5] bg-white p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-[#1b1b1b]">
                Iniciar Sesión
              </h2>
              <p className="mt-1 text-sm text-[#5c5f60]">
                Ingresa tus credenciales para acceder al panel de control.
              </p>
            </div>

            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-[#1b1b1b]"
                  htmlFor="login-email"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#5c5f60]">
                    mail
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="nombre@ejemplo.com"
                    className="w-full rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] py-3 pl-12 pr-4 text-base text-[#1b1b1b] outline-none transition-all placeholder:text-[#7e7576] focus:border-black focus:ring-1 focus:ring-black"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    className="text-sm font-semibold text-[#1b1b1b]"
                    htmlFor="login-password"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="text-sm text-black hover:underline"
                    onClick={() =>
                      toast("Recuperación de contraseña no disponible en la demo.")
                    }
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#5c5f60]">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] py-3 pl-12 pr-4 text-base text-[#1b1b1b] outline-none transition-all placeholder:text-[#7e7576] focus:border-black focus:ring-1 focus:ring-black"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? "Entrando…" : "Iniciar Sesión"}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#cfc4c5]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 font-medium text-[#5c5f60]">
                      O continúa con
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] px-4 py-3 text-sm font-semibold text-[#1b1b1b] transition-colors hover:bg-[#f3f3f3]"
                    onClick={() => toast("Inicio con Google no configurado.")}
                  >
                    <span className="text-lg font-bold text-[#4285F4]">G</span>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] px-4 py-3 text-sm font-semibold text-[#1b1b1b] transition-colors hover:bg-[#f3f3f3]"
                    onClick={() => toast("Inicio con Discord no configurado.")}
                  >
                    <span className="material-symbols-outlined text-xl">
                      brand_awareness
                    </span>
                    Discord
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#5c5f60]">
                ¿No tienes una cuenta?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-black hover:underline"
                >
                  Regístrate ahora
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 rounded-xl border border-[#cfc4c5] bg-[#eeeeee] p-4">
            <span className="material-symbols-outlined shrink-0 text-[#5c5f60]">
              info
            </span>
            <p className="text-xs leading-relaxed text-[#5c5f60]">
              ArenaManager utiliza conexión segura (HTTPS en producción) y
              tokens para proteger tus datos de torneo y personales.
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#cfc4c5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 md:flex-row md:px-10">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm md:justify-start">
            <span className="font-semibold text-black">ArenaManager</span>
            <span className="text-[#5c5f60]">|</span>
            <p className="text-[#5c5f60]">© {new Date().getFullYear()} Gestión profesional.</p>
          </div>
          <div className="flex gap-6 text-sm text-[#5c5f60]">
            <span className="cursor-default">Soporte</span>
            <span className="cursor-default">Términos</span>
            <span className="cursor-default">Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
