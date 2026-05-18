import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import AsignarEquipoBracketModal from "../components/bracket/AsignarEquipoBracketModal";
import CrearEnfrentamientoButton from "../components/torneo/CrearEnfrentamientoButton";
import EditarTorneoModal from "../components/modals/EditarTorneoModal";
import { api } from "../lib/api";
import {
  equiposDisponiblesParaBracket,
  enfrentamientoTieneResultadoValidado,
  torneoBloqueaPartidas,
  torneoTieneEnfrentamientosParaRegistrar,
  torneoTieneResultadosPendientesValidacion,
} from "../lib/bracketHelpers";
import {
  BRACKET_ROW_UNIT,
  bracketCanvasHeight,
  computeBracketTops,
} from "../lib/bracketLayout";
import { useAuth } from "../context/AuthContext";

type ResultadoMini = {
  validado: boolean | null;
  puntosEquipo1: number | null;
  puntosEquipo2: number | null;
};

type Enf = {
  idEnfrentamiento: number;
  fase: string;
  estado: string | null;
  idEquipo1: number | null;
  idEquipo2: number | null;
  equipo1: { nombreEquipo: string; logoUrl: string | null } | null;
  equipo2: { nombreEquipo: string; logoUrl: string | null } | null;
  resultados: ResultadoMini[];
};

type TorneoVista = {
  idTorneo: number;
  nombre: string;
  descripcion?: string | null;
  estado: string | null;
  fechaInicio: string;
  fechaFin?: string | null;
  premioDescripcion?: string | null;
  reglas?: string | null;
  numMaxParticipantes: number;
  numInscritos: number | null;
  tipoVideojuego?: { nombre: string };
  organizador?: { idUsuario: number; nombre?: string };
  faseInicial?: { nombre: string; codigo: string };
  equipos?: { idEquipo: number; nombreEquipo: string }[];
  enfrentamientos: Enf[];
};

type BracketEstructura = {
  cupo: number;
  faseInicialCodigo: string;
  columnas: {
    idFase: number;
    codigo: string;
    nombre: string;
    partidas: { idEnfrentamiento: number; indice: number; posicionBracket: string }[];
  }[];
};

type BracketApi = {
  torneo: { idTorneo: number; nombre: string; estado: string | null };
  bracket: {
    idBracket: number;
    estructuraJson: BracketEstructura | null;
    fechaGeneracion: string | null;
  } | null;
};

function iniciales(n: string | null | undefined) {
  if (!n?.trim()) return "?";
  return n.trim().slice(0, 1).toUpperCase();
}

function badgeFor(e: Enf): { label: string; cls: string } {
  const r = e.resultados[0];
  const t1 = e.idEquipo1 && e.equipo1;
  const t2 = e.idEquipo2 && e.equipo2;
  if (!t1 || !t2) {
    return {
      label: "Por definir",
      cls: "bg-gray-100 text-gray-500",
    };
  }
  if (r?.validado) {
    return {
      label: "Validado",
      cls: "bg-emerald-50 text-emerald-700",
    };
  }
  if (r && !r.validado) {
    return {
      label: "Pendiente",
      cls: "bg-amber-50 text-amber-700",
    };
  }
  return {
    label: "Próximo",
    cls: "bg-sky-50 text-sky-700",
  };
}

function groupByFase(enfs: Enf[]): { fase: string; items: Enf[] }[] {
  const order: string[] = [];
  const map = new Map<string, Enf[]>();
  for (const e of enfs) {
    if (!map.has(e.fase)) {
      order.push(e.fase);
      map.set(e.fase, []);
    }
    map.get(e.fase)!.push(e);
  }
  return order.map((fase) => ({ fase, items: map.get(fase)! }));
}

function MatchCard({
  e,
  esOrg,
  permiteAsignar,
  esFinal,
  puedeLimpiar,
  onAsignar,
  onLimpiar,
}: {
  e: Enf;
  esOrg: boolean;
  permiteAsignar: boolean;
  esFinal: boolean;
  puedeLimpiar: boolean;
  onAsignar: (idEnfrentamiento: number, lado: 1 | 2) => void;
  onLimpiar: (idEnfrentamiento: number) => void;
}) {
  const b = badgeFor(e);
  const r = e.resultados[0];
  const s1 = r?.puntosEquipo1;
  const s2 = r?.puntosEquipo2;
  const hasScores = s1 != null && s2 != null;
  const w1 = hasScores && s1! > s2!;
  const w2 = hasScores && s2! > s1!;

  return (
    <div
      className={`relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        b.label === "Próximo" ? "border-sky-200 ring-4 ring-sky-500/5" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        {puedeLimpiar ? (
          <button
            type="button"
            title="Quitar equipos de este enfrentamiento"
            className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-700"
            onClick={() => onLimpiar(e.idEnfrentamiento)}
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        ) : (
          <span className="w-6" />
        )}
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${b.cls}`}
        >
          {b.label === "Validado" ? (
            <span className="h-1 w-1 rounded-full bg-emerald-600" />
          ) : null}
          {b.label}
        </span>
      </div>
      <div className="space-y-3">
        <div
          className={`flex items-center justify-between ${!w1 && hasScores ? "opacity-60" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs font-bold">
              {iniciales(e.equipo1?.nombreEquipo)}
            </div>
            {e.equipo1 ? (
              <span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold">
                {w1 && esFinal && r?.validado ? (
                  <span
                    className="material-symbols-outlined shrink-0 text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    title="Campeón"
                  >
                    emoji_events
                  </span>
                ) : null}
                {e.equipo1.nombreEquipo}
              </span>
            ) : esOrg && permiteAsignar ? (
              <button
                type="button"
                className="rounded-lg bg-black px-2 py-1 text-xs font-semibold text-white"
                onClick={() => onAsignar(e.idEnfrentamiento, 1)}
              >
                Asignar equipo
              </button>
            ) : (
              <span className="text-sm italic text-gray-400">
                {permiteAsignar ? "Por definir" : "Pendiente de fase anterior"}
              </span>
            )}
          </div>
          <span
            className={`shrink-0 text-sm font-bold ${w1 ? "text-emerald-600" : "text-gray-500"}`}
          >
            {hasScores ? s1 : "—"}
          </span>
        </div>
        <div
          className={`flex items-center justify-between ${!w2 && hasScores ? "opacity-60" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs font-bold">
              {iniciales(e.equipo2?.nombreEquipo)}
            </div>
            {e.equipo2 ? (
              <span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold">
                {w2 && esFinal && r?.validado ? (
                  <span
                    className="material-symbols-outlined shrink-0 text-amber-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    title="Campeón"
                  >
                    emoji_events
                  </span>
                ) : null}
                {e.equipo2.nombreEquipo}
              </span>
            ) : esOrg && permiteAsignar ? (
              <button
                type="button"
                className="rounded-lg bg-black px-2 py-1 text-xs font-semibold text-white"
                onClick={() => onAsignar(e.idEnfrentamiento, 2)}
              >
                Asignar equipo
              </button>
            ) : (
              <span className="text-sm italic text-gray-400">
                {permiteAsignar ? "Por definir" : "Pendiente de fase anterior"}
              </span>
            )}
          </div>
          <span
            className={`shrink-0 text-sm font-bold ${w2 ? "text-emerald-600" : "text-gray-500"}`}
          >
            {hasScores ? s2 : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TorneoBracket() {
  const { id } = useParams<{ id: string }>();
  const torneoId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editTorneoOpen, setEditTorneoOpen] = useState(false);

  const torneoQ = useQuery({
    queryKey: ["torneo", torneoId],
    enabled: Number.isInteger(torneoId) && torneoId > 0,
    queryFn: async () => {
      const { data } = await api.get<{ torneo: TorneoVista }>(
        `/torneos/${torneoId}`,
      );
      return data.torneo;
    },
  });

  const bracketQ = useQuery({
    queryKey: ["bracket", torneoId],
    enabled: Number.isInteger(torneoId) && torneoId > 0,
    queryFn: async () => {
      const { data } = await api.get<BracketApi>(`/torneos/${torneoId}/bracket`);
      return data;
    },
  });

  const [assignModal, setAssignModal] = useState<{
    idEnfrentamiento: number;
    lado: 1 | 2;
  } | null>(null);

  const enfPorId = useMemo(() => {
    const m = new Map<number, Enf>();
    for (const e of torneoQ.data?.enfrentamientos ?? []) {
      m.set(e.idEnfrentamiento, e);
    }
    return m;
  }, [torneoQ.data?.enfrentamientos]);

  const columnas = useMemo(() => {
    const estructura = bracketQ.data?.bracket?.estructuraJson;
    if (estructura?.columnas?.length) {
      return estructura.columnas.map((col) => ({
        fase: col.nombre,
        items: col.partidas
          .map((p) => enfPorId.get(p.idEnfrentamiento))
          .filter((x): x is Enf => x != null),
      }));
    }
    const enfs = torneoQ.data?.enfrentamientos ?? [];
    return groupByFase(enfs);
  }, [bracketQ.data?.bracket?.estructuraJson, torneoQ.data?.enfrentamientos, enfPorId]);

  const equiposOpts = useMemo(
    () => torneoQ.data?.equipos ?? [],
    [torneoQ.data?.equipos],
  );

  const enfs = torneoQ.data?.enfrentamientos ?? [];

  const equiposParaAsignar = useMemo(
    () => equiposDisponiblesParaBracket(equiposOpts, enfs),
    [equiposOpts, enfs],
  );

  const limpiarEnf = useMutation({
    mutationFn: async (idEnfrentamiento: number) => {
      await api.delete(`/enfrentamientos/${idEnfrentamiento}/asignacion`);
    },
    onSuccess: async () => {
      toast.success("Asignación eliminada");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "No se pudo eliminar";
      toast.error(msg);
    },
  });

  const bracketLayout = useMemo(() => {
    const counts = columnas.map((c) => Math.max(c.items.length, 1));
    const tops = computeBracketTops(counts);
    const height = bracketCanvasHeight(counts);
    return { tops, height };
  }, [columnas]);

  const campeon = useMemo(() => {
    const finalCol = columnas[columnas.length - 1];
    const finalMatch = finalCol?.items[0];
    if (!finalMatch?.equipo1 || !finalMatch.equipo2) return null;
    const r = finalMatch.resultados[0];
    if (!r?.validado || r.puntosEquipo1 == null || r.puntosEquipo2 == null) {
      return null;
    }
    if (r.puntosEquipo1 > r.puntosEquipo2) {
      return finalMatch.equipo1.nombreEquipo;
    }
    if (r.puntosEquipo2 > r.puntosEquipo1) {
      return finalMatch.equipo2.nombreEquipo;
    }
    return null;
  }, [columnas]);

  if (!Number.isInteger(torneoId) || torneoId < 1) {
    return <p role="alert">Identificador de torneo inválido.</p>;
  }

  const t = torneoQ.data;

  const esOrg =
    user &&
    t &&
    (user.globalRoles.includes("organizador") ||
      t.organizador?.idUsuario === user.idUsuario);

  const torneoCerrado = torneoBloqueaPartidas(t?.estado);
  const puedeRegistrarResultado =
    !!user && !torneoCerrado && torneoTieneEnfrentamientosParaRegistrar(enfs);
  const puedeValidarResultados =
    !!esOrg &&
    !torneoCerrado &&
    torneoTieneResultadosPendientesValidacion(enfs);

  const linkInactivo =
    "cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400";
  const linkActivo =
    "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50";
  const isPending = torneoQ.isPending || bracketQ.isPending;
  const isError = torneoQ.isError || bracketQ.isError;
  const error = torneoQ.error ?? bracketQ.error;

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-black antialiased">
      <ArenaHeader active="torneos" bg="white" />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-4xl font-bold text-gray-900">
                {t?.nombre ?? "Torneo"}
              </h1>
              {esOrg ? (
                <button
                  type="button"
                  title="Editar torneo"
                  className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                  onClick={() => setEditTorneoOpen(true)}
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {t?.tipoVideojuego?.nombre ?? "Videojuego"}
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {t?.numInscritos ?? 0} / {t?.numMaxParticipantes ?? "—"} equipos
              </span>
              {t?.faseInicial ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  Inicia en {t.faseInicial.nombre}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <span className="flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium">
                Bracket
              </span>
            </div>
            <Link
              to={`/torneos/${torneoId}/equipos`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Equipos
            </Link>
            {user ? (
              puedeRegistrarResultado ? (
                <Link
                  to={`/torneos/${torneoId}/registrar-resultado`}
                  state={{ from: `/torneos/${torneoId}/bracket` }}
                  className={linkActivo}
                >
                  Registrar resultado
                </Link>
              ) : (
                <span
                  className={linkInactivo}
                  title={
                    torneoCerrado
                      ? "El torneo ya finalizó"
                      : "No hay enfrentamientos pendientes de resultado"
                  }
                >
                  Registrar resultado
                </span>
              )
            ) : null}
            {esOrg ? (
              <>
                <CrearEnfrentamientoButton
                  torneoId={torneoId}
                  torneoNombre={t?.nombre}
                  organizadorId={t?.organizador?.idUsuario}
                  estadoTorneo={t?.estado}
                  enfrentamientos={enfs}
                />
                {puedeValidarResultados ? (
                  <Link
                    to={`/torneos/${torneoId}/validar-resultados`}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
                  >
                    Validar resultados
                  </Link>
                ) : (
                  <span
                    className={linkInactivo}
                    title="No hay resultados pendientes de validación"
                  >
                    Validar resultados
                  </span>
                )}
              </>
            ) : null}
          </div>
        </header>

        {isPending ? <p className="text-gray-500">Cargando…</p> : null}
        {isError ? (
          <p className="text-red-600" role="alert">
            {error instanceof Error ? error.message : "Error"}
          </p>
        ) : null}

        {columnas.length === 0 && !isPending ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Cargando estructura del bracket… si persiste, recargue la página.
          </p>
        ) : null}

        {columnas.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 shadow-sm">
            <div
              className="flex min-w-max gap-6 px-6 py-10"
              style={{ minHeight: bracketLayout.height }}
            >
              {columnas.map((col, colIdx) => {
                const colTops = bracketLayout.tops[colIdx] ?? [];
                const isLast = colIdx === columnas.length - 1;
                return (
                  <div
                    key={col.fase}
                    className="relative shrink-0 border-r border-gray-100 pr-6 last:border-r-0"
                    style={{ width: 292 }}
                  >
                    <h3 className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                      {col.fase}
                    </h3>
                    <div
                      className="relative"
                      style={{ minHeight: bracketLayout.height - 56 }}
                    >
                      {col.items.map((e, matchIdx) => {
                        const top =
                          colTops[matchIdx] ?? matchIdx * BRACKET_ROW_UNIT;
                        return (
                          <div
                            key={e.idEnfrentamiento}
                            className="absolute left-0 right-0 transition-[top] duration-300"
                            style={{ top }}
                          >
                            <MatchCard
                              e={e}
                              esOrg={!!esOrg}
                              permiteAsignar={colIdx === 0}
                              esFinal={isLast}
                              puedeLimpiar={
                                colIdx === 0 &&
                                !!esOrg &&
                                Boolean(e.idEquipo1 || e.idEquipo2) &&
                                !enfrentamientoTieneResultadoValidado(
                                  e.resultados,
                                )
                              }
                              onAsignar={(idEnf, lado) =>
                                setAssignModal({
                                  idEnfrentamiento: idEnf,
                                  lado,
                                })
                              }
                              onLimpiar={(idEnf) => {
                                if (
                                  window.confirm(
                                    "¿Quitar los equipos de este enfrentamiento?",
                                  )
                                ) {
                                  limpiarEnf.mutate(idEnf);
                                }
                              }}
                            />
                            {!isLast ? (
                              <span
                                className="pointer-events-none absolute -right-6 top-1/2 h-px w-6 bg-gray-300"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        {columnas.length > 0 ? (
          <p className="mt-3 text-center text-xs text-gray-400">
            Desliza horizontalmente para recorrer las fases del torneo →
          </p>
        ) : null}

        <AsignarEquipoBracketModal
          open={assignModal != null}
          idEnfrentamiento={assignModal?.idEnfrentamiento ?? null}
          torneoId={torneoId}
          lado={assignModal?.lado ?? 1}
          equipos={equiposParaAsignar}
          onClose={() => setAssignModal(null)}
        />

        <EditarTorneoModal
          open={editTorneoOpen}
          torneo={
            t
              ? {
                  idTorneo: t.idTorneo,
                  nombre: t.nombre,
                  descripcion: t.descripcion,
                  fechaInicio: t.fechaInicio,
                  fechaFin: t.fechaFin,
                  premioDescripcion: t.premioDescripcion,
                  reglas: t.reglas,
                }
              : null
          }
          onClose={() => setEditTorneoOpen(false)}
        />

        <div
          className={`mt-12 rounded-lg border-2 p-8 text-center shadow-lg ${
            campeon
              ? "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-50"
              : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              campeon ? "bg-amber-200" : "bg-yellow-100"
            }`}
          >
            <span
              className={`material-symbols-outlined text-4xl ${
                campeon ? "text-amber-600" : "text-yellow-600"
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>
          <h4 className="mb-2 text-xl font-bold text-yellow-900">Campeón</h4>
          {campeon ? (
            <>
              <p className="text-2xl font-bold text-amber-900">{campeon}</p>
              <p className="mt-2 text-sm font-medium text-amber-700">
                Torneo finalizado — ¡felicitaciones al equipo campeón!
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-yellow-700">
              Se definirá al validar el resultado de la final.
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          <Link to="/torneos" className="underline">
            ← Todos los torneos
          </Link>
        </p>
      </main>

      <footer className="mt-20 w-full border-t border-gray-200 bg-gray-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
          <div>
            <p className="text-xl font-bold">ArenaManager</p>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} — Gestión profesional de torneos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
