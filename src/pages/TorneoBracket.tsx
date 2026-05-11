import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import ArenaHeader from "../components/layout/ArenaHeader";
import { api } from "../lib/api";
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
  estado: string | null;
  numMaxParticipantes: number;
  numInscritos: number | null;
  tipoVideojuego?: { nombre: string };
  organizador?: { idUsuario: number; nombre?: string };
  enfrentamientos: Enf[];
};

type BracketApi = {
  torneo: { idTorneo: number; nombre: string; estado: string | null };
  bracket: {
    idBracket: number;
    estructuraJson: unknown;
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

function MatchCard({ e }: { e: Enf }) {
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
      <div className="mb-3 flex justify-end">
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
            <span className="truncate text-sm font-semibold">
              {e.equipo1?.nombreEquipo ?? (
                <span className="italic text-gray-400">Por definir</span>
              )}
            </span>
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
            <span className="truncate text-sm font-semibold">
              {e.equipo2?.nombreEquipo ?? (
                <span className="italic text-gray-400">Por definir</span>
              )}
            </span>
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

  const columnas = useMemo(() => {
    const enfs = torneoQ.data?.enfrentamientos ?? [];
    return groupByFase(enfs);
  }, [torneoQ.data?.enfrentamientos]);

  const esOrg =
    user &&
    torneoQ.data &&
    (user.globalRoles.includes("organizador") ||
      torneoQ.data.organizador?.idUsuario === user.idUsuario);

  if (!Number.isInteger(torneoId) || torneoId < 1) {
    return <p role="alert">Identificador de torneo inválido.</p>;
  }

  const t = torneoQ.data;
  const jsonRaw = bracketQ.data?.bracket?.estructuraJson;
  const isPending = torneoQ.isPending || bracketQ.isPending;
  const isError = torneoQ.isError || bracketQ.isError;
  const error = torneoQ.error ?? bracketQ.error;

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-black antialiased">
      <ArenaHeader
        active="resultados"
        torneoContextId={torneoId}
        bg="white"
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              {t?.nombre ?? "Torneo"}
            </h1>
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
              <Link
                to={`/torneos/${torneoId}/registrar-resultado`}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Registrar resultado
              </Link>
            ) : null}
            {esOrg ? (
              <>
                <Link
                  to={`/torneos/${torneoId}/validar-resultados`}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900"
                >
                  Validar resultados
                </Link>
                <Link
                  to="/notificaciones"
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Notificaciones
                </Link>
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

        {bracketQ.data?.bracket == null && columnas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Aún no hay bracket ni enfrentamientos para este torneo.
          </p>
        ) : null}

        {jsonRaw != null && jsonRaw !== null && typeof jsonRaw === "object" ? (
          <details className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600">
              JSON del bracket (referencia técnica)
            </summary>
            <pre className="mt-3 max-h-48 overflow-auto text-xs">
              {JSON.stringify(jsonRaw, null, 2)}
            </pre>
          </details>
        ) : null}

        <div className="grid min-h-[400px] grid-cols-1 gap-x-12 gap-y-10 overflow-x-auto pb-8 md:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col">
          {columnas.map((col) => (
            <div key={col.fase} className="min-w-[260px] space-y-8">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                {col.fase}
              </h3>
              {col.items.map((e) => (
                <MatchCard key={e.idEnfrentamiento} e={e} />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <h4 className="mb-1 text-lg font-bold text-yellow-800">Campeón</h4>
          <p className="text-sm font-medium text-yellow-600">
            Se definirá al cerrar la final con resultado validado.
          </p>
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
