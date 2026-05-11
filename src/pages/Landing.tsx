import { Link } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";

const icon = "material-symbols-outlined align-middle text-[1.25em]";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1b1b1b]">
      <ArenaHeader bg="white" />

      <main>
        <section className="overflow-hidden bg-white pb-16 pt-12 md:pb-24 md:pt-16">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:px-10 lg:grid-cols-2">
            <div className="z-10 space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-black md:text-6xl lg:text-7xl">
                  Organiza, Compite y Gana en un Solo Lugar
                </h1>
                <p className="max-w-lg text-lg text-[#5c5f60] md:text-xl">
                  La infraestructura definitiva para comunidades de eSports.
                  Brackets automáticos, gestión de resultados y rankings con un
                  diseño minimalista.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/torneos"
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                >
                  Explorar Torneos
                  <span className={icon}>arrow_forward</span>
                </Link>
                <Link
                  to="/torneos/crear"
                  className="rounded-lg border border-[#cfc4c5] bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#f3f3f3]"
                >
                  Crear mi primer torneo
                </Link>
              </div>
              <p className="text-sm text-[#5c5f60]">
                <span className="font-bold text-black">+2,000</span>{" "}
                organizadores ya confían en nosotros
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-xl border border-[#cfc4c5] bg-[#f3f3f3] p-4 shadow-lg transition-transform duration-500 lg:rotate-2 lg:hover:rotate-0">
                <div className="aspect-[4/3] rounded-lg border border-[#e8e8e8] bg-white p-6">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5c5f60]">
                    Vista previa del bracket
                  </p>
                  <div className="flex gap-6 overflow-x-auto pb-2">
                    <div className="min-w-[140px] space-y-3">
                      <p className="border-b border-[#cfc4c5] pb-2 text-[10px] font-bold text-[#5c5f60]">
                        Cuartos
                      </p>
                      <div className="rounded-lg border border-[#e2e2e2] bg-white p-2 text-xs shadow-sm">
                        <div className="flex justify-between border-b border-[#eeeeee] py-1">
                          <span className="font-semibold">Equipo A</span>
                          <span>2</span>
                        </div>
                        <div className="flex justify-between py-1 text-[#5c5f60]">
                          <span>Equipo B</span>
                          <span>1</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex min-w-[120px] flex-col justify-center">
                      <p className="border-b border-[#cfc4c5] pb-2 text-[10px] font-bold text-[#5c5f60]">
                        Final
                      </p>
                      <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#cfc4c5] p-6">
                        <span className={icon}>emoji_events</span>
                        <span className="text-center text-xs text-[#5c5f60]">
                          Esperando ganador
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-[#cfc4c5] bg-white p-4 shadow-xl md:block">
                <div className="flex items-center gap-3">
                  <span className={icon}>verified</span>
                  <div>
                    <p className="text-sm font-semibold text-black">
                      Brackets en vivo
                    </p>
                    <p className="text-xs text-[#5c5f60]">
                      Actualización en tiempo real
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f9f9f9] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 md:px-10">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold text-black md:text-4xl">
                Herramientas para cada perfil
              </h2>
              <p className="mx-auto max-w-2xl text-[#5c5f60]">
                Diseñado para ser intuitivo tanto para el organizador más
                veterano como para el espectador ocasional.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  t: "dashboard_customize",
                  h: "Organizadores",
                  p: "Crea brackets automáticos, gestiona inscripciones y publica resultados.",
                },
                {
                  t: "sports_esports",
                  h: "Jugadores",
                  p: "Regístrate, recibe avisos de enfrentamientos y sigue tu progreso.",
                },
                {
                  t: "visibility",
                  h: "Espectadores",
                  p: "Consulta brackets y resultados en vivo sin necesidad de cuenta.",
                },
              ].map((c) => (
                <div
                  key={c.h}
                  className="group rounded-xl border border-[#cfc4c5] bg-white p-8 transition-shadow hover:shadow-xl"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white transition-transform group-hover:scale-110">
                    <span className={icon}>{c.t}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-black">{c.h}</h3>
                  <p className="text-[#5c5f60]">{c.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-black py-16 text-white md:py-20">
          <div className="mx-auto max-w-7xl space-y-8 px-6 text-center md:px-10">
            <h2 className="text-3xl font-extrabold md:text-5xl">
              ¿Listo para elevar tu comunidad?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/70">
              Únete a organizadores que ya están automatizando sus torneos.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#e8e8e8]"
              >
                Comienza ahora
              </Link>
              <Link
                to="/torneos"
                className="rounded-lg border border-white/40 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ver torneos
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#cfc4c5] bg-[#eeeeee]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row md:px-10">
          <div className="text-center md:text-left">
            <p className="font-semibold text-black">ArenaManager</p>
            <p className="mt-1 text-sm text-[#5c5f60]">
              © {new Date().getFullYear()} — Gestión profesional de torneos.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#5c5f60]">
            <span className="cursor-not-allowed">Privacidad</span>
            <span className="cursor-not-allowed">Términos</span>
            <span className="cursor-not-allowed">Soporte</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
