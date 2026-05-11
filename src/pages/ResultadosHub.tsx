import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";
import type { TorneoResumen } from "../components/torneo/TorneoCard";
import { api } from "../lib/api";

export default function ResultadosHub() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["torneos"],
    queryFn: async () => {
      const { data: body } = await api.get<{ torneos: TorneoResumen[] }>(
        "/torneos",
      );
      return body.torneos;
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader active="resultados" bg="gray" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 md:px-10">
        <h1 className="text-3xl font-bold text-black">Resultados y brackets</h1>
        <p className="mt-2 text-sm text-[#5c5f60]">
          Abra el bracket de cada torneo para ver enfrentamientos y marcadores.
        </p>

        {isPending ? (
          <p className="mt-8 text-[#5c5f60]">Cargando…</p>
        ) : null}
        {isError ? (
          <p className="mt-8 text-red-600" role="alert">
            {error instanceof Error ? error.message : "Error"}
          </p>
        ) : null}

        <ul className="mt-8 space-y-3">
          {(data ?? []).map((t) => (
            <li key={t.idTorneo}>
              <Link
                to={`/torneos/${t.idTorneo}/bracket`}
                className="flex items-center justify-between rounded-xl border border-[#cfc4c5] bg-white px-5 py-4 transition-colors hover:border-black"
              >
                <span className="font-semibold">{t.nombre}</span>
                <span className="text-sm text-[#5c5f60]">Ver bracket →</span>
              </Link>
            </li>
          ))}
        </ul>

        {!isPending && (data?.length ?? 0) === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
            No hay torneos.{" "}
            <Link to="/torneos" className="font-semibold text-black underline">
              Volver al listado
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}
