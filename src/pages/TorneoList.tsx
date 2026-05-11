import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";
import TorneoCard, {
  type TorneoResumen,
} from "../components/torneo/TorneoCard";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type FiltroTorneo = "todos" | "curso" | "proximos";

function pasaFiltro(t: TorneoResumen, f: FiltroTorneo): boolean {
  const e = t.estado ?? "";
  if (f === "todos") return true;
  if (f === "curso") return e === "en_curso";
  if (f === "proximos") {
    return (
      e === "inscripciones_abiertas" ||
      e === "preparacion" ||
      (e !== "en_curso" && e !== "finalizado" && e !== "cancelado")
    );
  }
  return true;
}

export default function TorneoList() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<FiltroTorneo>("todos");
  const [filtroMenu, setFiltroMenu] = useState(false);
  const filtroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtroMenu) return;
    function cerrar(ev: MouseEvent) {
      if (
        filtroRef.current &&
        ev.target instanceof Node &&
        !filtroRef.current.contains(ev.target)
      ) {
        setFiltroMenu(false);
      }
    }
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [filtroMenu]);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["torneos"],
    queryFn: async () => {
      const { data: body } = await api.get<{ torneos: TorneoResumen[] }>(
        "/torneos",
      );
      return body.torneos;
    },
  });

  const filtrados = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.filter((t) => {
      if (!pasaFiltro(t, filtro)) return false;
      if (!needle) return true;
      const blob = [
        t.nombre,
        t.tipoVideojuego?.nombre,
        t.formato?.nombre,
        t.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [data, q, filtro]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader
        active="torneos"
        trailingSlot={
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5f60]">
              search
            </span>
            <input
              type="search"
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-lg border border-[#cfc4c5] bg-[#f3f3f3] py-2 pl-10 pr-3 text-sm outline-none ring-black focus:ring-1"
            />
          </div>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 md:px-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold text-[#1b1b1b]">Torneos</h1>
              <p className="mt-1 text-sm text-[#5c5f60]">
                Gestiona y explora las competiciones activas.
              </p>
            </div>
            <div className="relative" ref={filtroRef}>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#cfc4c5] px-4 py-2 text-sm font-semibold text-[#5c5f60] transition-colors hover:bg-white"
                onClick={() => setFiltroMenu((v) => !v)}
              >
                <span className="material-symbols-outlined text-xl">
                  filter_list
                </span>
                Filtrar
              </button>
              {filtroMenu ? (
                <div className="absolute right-0 z-20 mt-2 min-w-[200px] rounded-lg border border-[#cfc4c5] bg-white py-1 shadow-lg">
                  {(
                    [
                      ["todos", "Todos"],
                      ["curso", "En curso"],
                      ["proximos", "Próximos / inscripciones"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#f3f3f3] ${
                        filtro === key ? "font-semibold text-black" : "text-[#5c5f60]"
                      }`}
                      onClick={() => {
                        setFiltro(key);
                        setFiltroMenu(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {isPending ? (
            <p className="text-[#5c5f60]">Cargando torneos…</p>
          ) : null}
          {isError ? (
            <p className="text-red-600" role="alert">
              {error instanceof Error ? error.message : "Error al cargar"}
            </p>
          ) : null}

          <div className="flex flex-col gap-4">
            {filtrados.map((t) => (
              <TorneoCard key={t.idTorneo} torneo={t} />
            ))}
          </div>

          {!isPending && filtrados.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
              {data?.length === 0
                ? "No hay torneos todavía."
                : "Ningún torneo coincide con la búsqueda o el filtro."}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cfc4c5] bg-white p-10 text-center">
            <span className="material-symbols-outlined mb-2 text-5xl text-[#5c5f60]">
              add_circle
            </span>
            <h4 className="text-lg font-semibold text-[#1b1b1b]">
              ¿No encuentras el torneo ideal?
            </h4>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#5c5f60]">
              Organiza tu propia competición en pocos minutos.
            </p>
            <Link
              to={user ? "/torneos/crear" : "/login"}
              state={user ? undefined : { from: "/torneos/crear" }}
              className="mt-6 rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Empezar ahora
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-[#cfc4c5] bg-[#eeeeee]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row md:px-10">
          <div>
            <p className="font-semibold text-black">ArenaManager</p>
            <p className="mt-1 text-sm text-[#5c5f60]">
              © {new Date().getFullYear()} ArenaManager. Gestión profesional de torneos.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#5c5f60]">
            <span className="cursor-default">Privacidad</span>
            <span className="cursor-default">Términos</span>
            <span className="cursor-default">Soporte</span>
            <span className="cursor-default">Contacto</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
