import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  torneoBloqueaPartidas,
} from "../lib/bracketHelpers";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type ResultadoMini = {
  idResultado: number;
  validado: boolean | null;
  puntosEquipo1: number | null;
  puntosEquipo2: number | null;
};

type Enf = {
  idEnfrentamiento: number;
  fase: string;
  estado: string | null;
  equipo1: { nombreEquipo: string } | null;
  equipo2: { nombreEquipo: string } | null;
  resultados: ResultadoMini[];
};

type TorneoDetalle = {
  idTorneo: number;
  nombre: string;
  estado: string | null;
  organizador: { idUsuario: number };
  enfrentamientos: Enf[];
};

export default function TorneoValidarResultados() {
  const { id } = useParams<{ id: string }>();
  const torneoId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: torneo, isPending } = useQuery({
    queryKey: ["torneo", torneoId],
    enabled: Number.isInteger(torneoId) && torneoId > 0,
    queryFn: async () => {
      const { data } = await api.get<{ torneo: TorneoDetalle }>(
        `/torneos/${torneoId}`,
      );
      return data.torneo;
    },
  });

  const puedeGestionar =
    user &&
    (user.globalRoles.includes("organizador") ||
      torneo?.organizador.idUsuario === user.idUsuario);

  const pendientes =
    torneo?.enfrentamientos.filter(
      (e) =>
        e.resultados[0] &&
        e.resultados[0].validado === false &&
        e.estado === "esperando_validacion",
    ) ?? [];

  const validar = useMutation({
    mutationFn: async (idResultado: number) => {
      await api.put(`/resultados/${idResultado}/validar`, {});
    },
    onSuccess: async () => {
      toast.success("Resultado validado");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error";
      toast.error(msg);
    },
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!Number.isInteger(torneoId) || torneoId < 1) {
    return <p role="alert">Identificador inválido.</p>;
  }

  if (!isPending && torneo && !puedeGestionar) {
    return <Navigate to={`/torneos/${torneoId}/bracket`} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader active="torneos" bg="white" />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="mb-6 text-sm">
          <Link
            to={`/torneos/${torneoId}/bracket`}
            className="font-semibold text-black underline"
          >
            ← Volver al bracket
          </Link>
        </p>
        <h1 className="mb-2 text-2xl font-bold">Validar resultados</h1>
        <p className="mb-8 text-sm text-[#5c5f60]">
          {torneo?.nombre} — resultados enviados por jugadores pendientes de
          confirmación.
        </p>

        {isPending ? <p>Cargando…</p> : null}

        {pendientes.length === 0 && !isPending ? (
          <p className="rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
            No hay resultados pendientes de validación.
          </p>
        ) : null}

        <ul className="space-y-4">
          {pendientes.map((e) => {
            const r = e.resultados[0]!;
            return (
              <li
                key={e.idEnfrentamiento}
                className="rounded-xl border border-[#cfc4c5] bg-white p-6 shadow-sm"
              >
                <p className="text-xs uppercase text-[#5c5f60]">{e.fase}</p>
                <p className="mt-1 text-lg font-semibold">
                  {e.equipo1?.nombreEquipo}{" "}
                  <span className="text-[#5c5f60]">
                    ({r.puntosEquipo1 ?? "—"})
                  </span>{" "}
                  —{" "}
                  <span className="text-[#5c5f60]">
                    ({r.puntosEquipo2 ?? "—"})
                  </span>{" "}
                  {e.equipo2?.nombreEquipo}
                </p>
                <button
                  type="button"
                  disabled={
                    validar.isPending || torneoBloqueaPartidas(torneo?.estado)
                  }
                  title={
                    torneoBloqueaPartidas(torneo?.estado)
                      ? "Torneo finalizado"
                      : undefined
                  }
                  className="mt-4 rounded-lg bg-black px-6 py-2 text-sm font-bold text-white disabled:opacity-50"
                  onClick={() => validar.mutate(r.idResultado)}
                >
                  Validar resultado
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
