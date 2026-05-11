import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (contrasena !== confirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (contrasena.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!aceptaTerminos) {
      toast.error("Debe aceptar los términos para continuar");
      return;
    }
    setBusy(true);
    try {
      await register({
        nombre: nombre.trim(),
        email: email.trim(),
        contrasena,
      });
      toast.success("Cuenta creada");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "No se pudo registrar";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f9f9f9] font-sans text-[#1b1b1b] antialiased">
      <ArenaHeader bg="white" />
      <div className="pointer-events-none fixed -left-24 -top-24 h-96 w-96 rounded-full bg-[#f3f3f3] opacity-30 mix-blend-multiply blur-3xl" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#f3f3f3] opacity-30 mix-blend-multiply blur-3xl" />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1 text-3xl font-bold text-black">ArenaManager</h1>
          <p className="text-sm text-[#5c5f60]">
            Crea tu cuenta y participa en torneos. Los nuevos usuarios reciben
            el rol <strong className="text-[#1b1b1b]">jugador</strong> de forma
            global.
          </p>
        </div>

        <div className="w-full rounded-xl border border-[#cfc4c5] bg-white p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label
                className="text-sm font-semibold text-[#1b1b1b]"
                htmlFor="reg-name"
              >
                Nombre completo
              </label>
              <input
                id="reg-name"
                required
                autoComplete="name"
                placeholder="Ej. Alex Thompson"
                className="w-full rounded-lg border border-[#cfc4c5] bg-white px-4 py-2.5 text-base outline-none transition-colors placeholder:text-[#7e7576] focus:border-black"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                className="text-sm font-semibold text-[#1b1b1b]"
                htmlFor="reg-email"
              >
                Correo electrónico
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                className="w-full rounded-lg border border-[#cfc4c5] bg-white px-4 py-2.5 text-base outline-none transition-colors placeholder:text-[#7e7576] focus:border-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                className="text-sm font-semibold text-[#1b1b1b]"
                htmlFor="reg-pass"
              >
                Contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  id="reg-pass"
                  type={show1 ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#cfc4c5] bg-white py-2.5 pl-4 pr-12 text-base outline-none transition-colors placeholder:text-[#7e7576] focus:border-black"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 text-[#5c5f60] hover:text-black"
                  aria-label={show1 ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShow1((v) => !v)}
                >
                  <span className="material-symbols-outlined text-xl">
                    {show1 ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label
                className="text-sm font-semibold text-[#1b1b1b]"
                htmlFor="reg-pass2"
              >
                Confirmar contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  id="reg-pass2"
                  type={show2 ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#cfc4c5] bg-white py-2.5 pl-4 pr-12 text-base outline-none transition-colors placeholder:text-[#7e7576] focus:border-black"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 text-[#5c5f60] hover:text-black"
                  aria-label={show2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShow2((v) => !v)}
                >
                  <span className="material-symbols-outlined text-xl">
                    {show2 ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#cfc4c5] text-black focus:ring-black"
              />
              <label className="text-xs text-[#5c5f60]" htmlFor="terms">
                Acepto los{" "}
                <span className="cursor-pointer font-semibold text-black hover:underline">
                  Términos de Servicio
                </span>{" "}
                y la{" "}
                <span className="cursor-pointer font-semibold text-black hover:underline">
                  Política de Privacidad
                </span>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "Creando…" : "Crear Cuenta"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#cfc4c5]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-[#5c5f60]">
                o regístrate con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-[#cfc4c5] py-2.5 transition-colors hover:bg-[#f3f3f3] active:scale-[0.98]"
              onClick={() => toast("Registro con Google no configurado.")}
            >
              <span className="material-symbols-outlined text-xl">public</span>
              <span className="text-sm font-semibold">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-[#cfc4c5] py-2.5 transition-colors hover:bg-[#f3f3f3] active:scale-[0.98]"
              onClick={() => toast("Registro con GitHub no configurado.")}
            >
              <span className="material-symbols-outlined text-xl">terminal</span>
              <span className="text-sm font-semibold">GitHub</span>
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-[#5c5f60]">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="ml-1 font-bold text-black hover:underline">
            Inicia sesión
          </Link>
        </p>
      </main>

      <footer className="relative z-10 mt-auto w-full border-t border-[#cfc4c5] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row md:px-10">
          <div className="text-lg font-bold text-black">ArenaManager</div>
          <p className="text-center text-sm text-[#5c5f60] md:text-left">
            © {new Date().getFullYear()} ArenaManager. Gestión profesional de torneos.
          </p>
          <div className="flex gap-6 text-sm text-[#5c5f60]">
            <span className="cursor-default hover:text-black">Soporte</span>
            <span className="cursor-default hover:text-black">Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
