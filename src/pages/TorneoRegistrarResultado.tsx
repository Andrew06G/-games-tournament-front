import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import CrearEnfrentamientoButton from "../components/torneo/CrearEnfrentamientoButton";
import { api } from "../lib/api";
import {
  userCanManageTorneo,
  userCanRegistrarResultadosAmpliado,
} from "../lib/torneoPermissions";
import { useAuth } from "../context/AuthContext";
import { torneoBloqueaPartidas } from "../lib/bracketHelpers";

type JugadorMini = {
  idUsuario: number | null;
  nickname: string;
  esCapitan: boolean | null;
};
type EquipoMini = {
  idEquipo: number;
  nombreEquipo: string;
  jugadores: JugadorMini[];
};

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
  fechaProgramada: string | null;
  idEquipo1: number | null;
  idEquipo2: number | null;
  equipo1: { nombreEquipo: string } | null;
  equipo2: { nombreEquipo: string } | null;
  resultados: ResultadoMini[];
};

type TorneoDetalle = {
  idTorneo: number;
  nombre: string;
  estado: string | null;
  organizador?: { idUsuario: number };
  equipos: EquipoMini[];
  enfrentamientos: Enf[];
};

export default function TorneoRegistrarResultado() {
  const { id } = useParams<{ id: string }>();
  const torneoId = Number(id);
  const location = useLocation();
  const volverA =
    (location.state as { from?: string } | null)?.from ??
    `/torneos/${torneoId}/bracket`;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  function parseMarcador(raw: string): number | null {
    const t = raw.trim();
    if (t === "") return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
    return n;
  }

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

  const misIdsEquipo = useMemo(() => {
    if (!user || !torneo) return new Set<number>();
    const s = new Set<number>();
    for (const eq of torneo.equipos) {
      if (eq.jugadores.some((j) => j.idUsuario != null && j.idUsuario === user.idUsuario)) {
        s.add(eq.idEquipo);
      }
    }
    return s;
  }, [torneo, user]);

  const esOrganizadorTorneo = useMemo(
    () => userCanManageTorneo(user, torneo),
    [user, torneo],
  );

  const accesoAmpliado = useMemo(
    () => userCanRegistrarResultadosAmpliado(user, torneo, torneo?.equipos),
    [user, torneo],
  );

  const candidatos = useMemo(() => {
    if (!torneo) return [];
    return torneo.enfrentamientos.filter((e) => {
      if (!e.idEquipo1 || !e.idEquipo2) return false;
      if (!accesoAmpliado) {
        const participa =
          misIdsEquipo.has(e.idEquipo1) || misIdsEquipo.has(e.idEquipo2);
        if (!participa) return false;
      }
      const r = e.resultados[0];
      if (r?.validado) return false;
      if (e.estado === "finalizado" || e.estado === "cancelado") return false;
      return true;
    });
  }, [torneo, misIdsEquipo, accesoAmpliado]);

  const selected = candidatos.find((e) => e.idEnfrentamiento === selectedId);

  const soyEquipo1 =
    selected?.idEquipo1 != null && misIdsEquipo.has(selected.idEquipo1);

  const labelEquipo1 = selected?.equipo1?.nombreEquipo ?? "Equipo 1";
  const labelEquipo2 = selected?.equipo2?.nombreEquipo ?? "Equipo 2";
  const usaMarcadorDirecto = accesoAmpliado;
  const torneoCerrado = torneoBloqueaPartidas(torneo?.estado);
  const resultadoPendiente = selected?.resultados[0];
  const puedeEditarPendiente =
    resultadoPendiente &&
    resultadoPendiente.validado !== true &&
    selected.estado === "esperando_validacion";

  const registrar = useMutation({
    mutationFn: async (scores: { puntosEquipo1: number; puntosEquipo2: number }) => {
      if (!selected) return;
      await api.post(`/enfrentamientos/${selected.idEnfrentamiento}/resultado`, scores);
    },
    onSuccess: async () => {
      toast.success("Resultado enviado");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
      setP1("");
      setP2("");
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error";
      toast.error(msg);
    },
  });

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `/torneos/${torneoId}/registrar-resultado` }} />;
  }

  if (!Number.isInteger(torneoId) || torneoId < 1) {
    return <p role="alert">Identificador inválido.</p>;
  }

  function onMarcadorChange(
    raw: string,
    setter: (v: string) => void,
  ) {
    if (raw === "" || /^\d+$/.test(raw)) {
      setter(raw);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Seleccione un enfrentamiento");
      return;
    }
    const v1 = parseMarcador(p1);
    const v2 = parseMarcador(p2);
    if (v1 === null || v2 === null) {
      toast.error("Ingrese el marcador de ambos equipos (puede ser 0)");
      return;
    }
    registrar.mutate({ puntosEquipo1: v1, puntosEquipo2: v2 });
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader active="torneos" bg="white" />

      <main className="mx-auto grid min-w-0 max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-12 md:px-10">
        <p className="md:col-span-12">
          <Link
            to={volverA}
            className="inline-flex items-center gap-1 text-sm font-semibold text-black underline"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </Link>
        </p>
        {torneoCerrado ? (
          <p
            className="md:col-span-12 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Este torneo ya finalizó. No se pueden registrar nuevos resultados.
          </p>
        ) : null}
        <aside className="space-y-4 md:col-span-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-black">
              {esOrganizadorTorneo || accesoAmpliado
                ? "Enfrentamientos"
                : "Mis enfrentamientos"}
            </h2>
              <CrearEnfrentamientoButton
                torneoId={torneoId}
                torneoNombre={torneo?.nombre}
                organizadorId={torneo?.organizador?.idUsuario}
                estadoTorneo={torneo?.estado}
                enfrentamientos={torneo?.enfrentamientos}
                className="rounded-lg border border-[#cfc4c5] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f3f3]"
              />
          </div>
          {isPending ? <p className="text-sm text-[#5c5f60]">Cargando…</p> : null}
          {candidatos.length === 0 && !isPending ? (
            <p className="text-sm text-[#5c5f60]">
              {accesoAmpliado
                ? "No hay partidas pendientes con ambos equipos asignados."
                : "No hay partidas pendientes donde usted participe."}
            </p>
          ) : null}
          <div className="flex flex-col gap-3">
            {candidatos.map((e) => {
              const activo = selectedId === e.idEnfrentamiento;
              return (
                <button
                  key={e.idEnfrentamiento}
                  type="button"
                  onClick={() => {
                    setSelectedId(e.idEnfrentamiento);
                    const r = e.resultados[0];
                    setP1(
                      r?.puntosEquipo1 != null ? String(r.puntosEquipo1) : "",
                    );
                    setP2(
                      r?.puntosEquipo2 != null ? String(r.puntosEquipo2) : "",
                    );
                  }}
                  className={`rounded-xl border p-4 text-left shadow-sm transition-all ${
                    activo
                      ? "border-black ring-1 ring-black/10"
                      : "border-[#cfc4c5] opacity-90 hover:bg-white"
                  }`}
                >
                  <div className="mb-1 flex justify-between gap-2">
                    <h3 className="text-base font-semibold">
                      {e.equipo1?.nombreEquipo ?? "—"} vs{" "}
                      {e.equipo2?.nombreEquipo ?? "—"}
                    </h3>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <span className="material-symbols-outlined text-sm">
                        schedule
                      </span>
                      Pendiente
                    </span>
                  </div>
                  <p className="text-xs text-[#5c5f60]">{e.fase}</p>
                  {e.fechaProgramada ? (
                    <p className="text-xs text-[#5c5f60]">
                      {new Date(e.fechaProgramada).toLocaleString("es")}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-6 md:col-span-8">
          <div className="rounded-xl border border-[#cfc4c5] bg-white p-8 shadow-sm">
            <h1 className="mb-8 text-2xl font-semibold text-black">
              Registrar Resultado
            </h1>

            {selected && torneoCerrado ? (
              <p className="text-[#5c5f60]">
                El torneo está cerrado. Consulte el bracket para ver resultados
                finales.
              </p>
            ) : selected ? (
              <form onSubmit={onSubmit}>
                <div className="mb-8 rounded-lg border border-[#cfc4c5] bg-[#f3f3f3] p-6">
                  <p className="mb-1 text-xs text-[#5c5f60]">Enfrentamiento</p>
                  <h4 className="text-lg font-semibold">
                    {selected.equipo1?.nombreEquipo} vs{" "}
                    {selected.equipo2?.nombreEquipo}
                  </h4>
                  <p className="text-sm text-[#5c5f60]">
                    {selected.fase}
                    {selected.fechaProgramada
                      ? ` — ${new Date(selected.fechaProgramada).toLocaleDateString("es")}`
                      : null}
                  </p>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      {usaMarcadorDirecto
                        ? labelEquipo1
                        : `Mi score (${soyEquipo1 ? labelEquipo1 : labelEquipo2})`}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      className="w-full rounded-lg border border-[#cfc4c5] bg-white p-4 text-center text-3xl font-bold outline-none ring-black focus:ring-1"
                      value={usaMarcadorDirecto || soyEquipo1 ? p1 : p2}
                      onChange={(e) => {
                        if (usaMarcadorDirecto || soyEquipo1) {
                          onMarcadorChange(e.target.value, setP1);
                        } else {
                          onMarcadorChange(e.target.value, setP2);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      {usaMarcadorDirecto
                        ? labelEquipo2
                        : `Score rival (${soyEquipo1 ? labelEquipo2 : labelEquipo1})`}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      className="w-full rounded-lg border border-[#cfc4c5] bg-white p-4 text-center text-3xl font-bold outline-none ring-black focus:ring-1"
                      value={usaMarcadorDirecto || soyEquipo1 ? p2 : p1}
                      onChange={(e) => {
                        if (usaMarcadorDirecto || soyEquipo1) {
                          onMarcadorChange(e.target.value, setP2);
                        } else {
                          onMarcadorChange(e.target.value, setP1);
                        }
                      }}
                    />
                  </div>
                </div>

                {puedeEditarPendiente ? (
                  <p className="mb-3 text-sm text-amber-800">
                    Hay un resultado pendiente: puede corregir el marcador y
                    volver a enviar.
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={registrar.isPending || torneoCerrado}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5c5f60] py-4 text-base font-bold text-white transition-all hover:bg-black disabled:opacity-50"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    send
                  </span>
                  {puedeEditarPendiente
                    ? "Actualizar resultado"
                    : "Enviar Resultado"}
                </button>
              </form>
            ) : (
              <p className="text-[#5c5f60]">
                Elija un enfrentamiento de la lista izquierda.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-[#cfc4c5] bg-[#f3f3f3] p-6 text-sm text-[#5c5f60]">
            {accesoAmpliado ? (
              <p>
                Como organizador o líder de equipo puede registrar resultados de
                cualquier partida del torneo. El marcador quedará pendiente de
                validación.
              </p>
            ) : (
              <p>
                Solo verá partidas en las que participa. Tras enviar el marcador,
                un rival u organizador deberá validarlo.
              </p>
            )}
          </div>

          <p className="text-center text-sm">
            <Link to={`/torneos/${torneoId}/bracket`} className="underline">
              Ver bracket
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
