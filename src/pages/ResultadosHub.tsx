import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";
import { api } from "../lib/api";

type EquipoDestacadoRol = "campeon" | "subcampeon" | null;

type ResultadoReciente = {
  idResultado: number;
  puntosEquipo1: number | null;
  puntosEquipo2: number | null;
  fechaValidacion: string | null;
  rolEquipo1: EquipoDestacadoRol;
  rolEquipo2: EquipoDestacadoRol;
  torneo: { idTorneo: number; nombre: string; estado: string | null };
  enfrentamiento: {
    idEnfrentamiento: number;
    fase: string;
    esFinal: boolean;
  };
  equipo1: { nombreEquipo: string } | null;
  equipo2: { nombreEquipo: string } | null;
};

type RecientesResponse = {
  resultados: ResultadoReciente[];
  paginacion: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function nombreEquipo(n: string | undefined): string {
  return n?.trim() ? n : "—";
}

function estiloEquipo(rol: EquipoDestacadoRol): string {
  if (rol === "campeon") {
    return "rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950";
  }
  if (rol === "subcampeon") {
    return "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900";
  }
  return "text-[#1b1b1b]";
}

function etiquetaRol(rol: EquipoDestacadoRol): string | null {
  if (rol === "campeon") return "Campeón";
  if (rol === "subcampeon") return "Finalista";
  return null;
}

export default function ResultadosHub() {
  const [page, setPage] = useState(0);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["resultados-recientes", page],
    queryFn: async () => {
      const { data: body } = await api.get<RecientesResponse>(
        "/resultados/recientes",
        { params: { page, limit: 10 } },
      );
      return body;
    },
  });

  const totalPages = data?.paginacion.totalPages ?? 1;
  const total = data?.paginacion.total ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader active="resultados" bg="gray" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10 md:px-10">
        <h1 className="text-3xl font-bold text-black">Últimos resultados</h1>
        <p className="mt-2 text-sm text-[#5c5f60]">
          Enfrentamientos validados recientemente. Las finales destacan al
          campeón y al subcampeón.
        </p>

        {isPending ? (
          <p className="mt-8 text-[#5c5f60]">Cargando…</p>
        ) : null}
        {isError ? (
          <p className="mt-8 text-red-600" role="alert">
            {error instanceof Error ? error.message : "Error"}
          </p>
        ) : null}

        <ul className="mt-8 space-y-4">
          {(data?.resultados ?? []).map((r) => {
            const n1 = nombreEquipo(r.equipo1?.nombreEquipo);
            const n2 = nombreEquipo(r.equipo2?.nombreEquipo);
            const p1 = r.puntosEquipo1 ?? "—";
            const p2 = r.puntosEquipo2 ?? "—";
            const fecha = r.fechaValidacion
              ? new Date(r.fechaValidacion).toLocaleString("es")
              : null;

            return (
              <li
                key={r.idResultado}
                className="rounded-xl border border-[#cfc4c5] bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={`/torneos/${r.torneo.idTorneo}/bracket`}
                    className="text-sm font-semibold text-black underline-offset-2 hover:underline"
                  >
                    {r.torneo.nombre}
                  </Link>
                  <span className="text-xs text-[#5c5f60]">
                    {r.enfrentamiento.fase}
                    {r.enfrentamiento.esFinal ? " · Final" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-center text-lg font-bold">
                  <div className={`min-w-0 flex-1 ${estiloEquipo(r.rolEquipo1)}`}>
                    <span className="block truncate">{n1}</span>
                    {etiquetaRol(r.rolEquipo1) ? (
                      <span className="mt-1 block text-xs font-semibold uppercase tracking-wide">
                        {etiquetaRol(r.rolEquipo1)}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-2xl">{p1}</span>
                  </div>
                  <span className="shrink-0 text-[#5c5f60]">—</span>
                  <div className={`min-w-0 flex-1 ${estiloEquipo(r.rolEquipo2)}`}>
                    <span className="block truncate">{n2}</span>
                    {etiquetaRol(r.rolEquipo2) ? (
                      <span className="mt-1 block text-xs font-semibold uppercase tracking-wide">
                        {etiquetaRol(r.rolEquipo2)}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-2xl">{p2}</span>
                  </div>
                </div>
                {fecha ? (
                  <p className="mt-3 text-center text-xs text-[#5c5f60]">
                    Validado: {fecha}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        {!isPending && (data?.resultados.length ?? 0) === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
            Aún no hay resultados validados.
          </p>
        ) : null}

        {total > 10 ? (
          <nav
            className="mt-8 flex items-center justify-center gap-4"
            aria-label="Paginación de resultados"
          >
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-[#cfc4c5] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-[#5c5f60]">
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#cfc4c5] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </nav>
        ) : null}
      </main>
    </div>
  );
}
