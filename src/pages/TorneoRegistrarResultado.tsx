import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type JugadorMini = { idUsuario: number; nickname: string; esCapitan: boolean | null };
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
  equipos: EquipoMini[];
  enfrentamientos: Enf[];
};

export default function TorneoRegistrarResultado() {
  const { id } = useParams<{ id: string }>();
  const torneoId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);

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
      if (eq.jugadores.some((j) => j.idUsuario === user.idUsuario)) {
        s.add(eq.idEquipo);
      }
    }
    return s;
  }, [torneo, user]);

  const candidatos = useMemo(() => {
    if (!torneo) return [];
    return torneo.enfrentamientos.filter((e) => {
      if (!e.idEquipo1 || !e.idEquipo2) return false;
      const participa =
        misIdsEquipo.has(e.idEquipo1) || misIdsEquipo.has(e.idEquipo2);
      if (!participa) return false;
      const r = e.resultados[0];
      if (r?.validado) return false;
      if (e.estado === "finalizado" || e.estado === "cancelado") return false;
      return true;
    });
  }, [torneo, misIdsEquipo]);

  const selected = candidatos.find((e) => e.idEnfrentamiento === selectedId);

  const soyEquipo1 =
    selected &&
    selected.idEquipo1 &&
    misIdsEquipo.has(selected.idEquipo1);

  const miNombre = selected
    ? soyEquipo1
      ? selected.equipo1?.nombreEquipo
      : selected.equipo2?.nombreEquipo
    : "";
  const rivalNombre = selected
    ? soyEquipo1
      ? selected.equipo2?.nombreEquipo
      : selected.equipo1?.nombreEquipo
    : "";

  const registrar = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await api.post(`/enfrentamientos/${selected.idEnfrentamiento}/resultado`, {
        puntosEquipo1: p1,
        puntosEquipo2: p2,
      });
    },
    onSuccess: async () => {
      toast.success("Resultado enviado");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
      setP1(0);
      setP2(0);
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Seleccione un enfrentamiento");
      return;
    }
    registrar.mutate();
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader
        active="resultados"
        torneoContextId={torneoId}
        bg="white"
      />

      <main className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-12 md:px-10">
        <aside className="space-y-4 md:col-span-4">
          <h2 className="text-xl font-semibold text-black">Mis Enfrentamientos</h2>
          {isPending ? <p className="text-sm text-[#5c5f60]">Cargando…</p> : null}
          {candidatos.length === 0 && !isPending ? (
            <p className="text-sm text-[#5c5f60]">
              No hay partidas pendientes donde usted participe con ambos equipos
              asignados.
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
                    setP1(r?.puntosEquipo1 ?? 0);
                    setP2(r?.puntosEquipo2 ?? 0);
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
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-black">
                Registrar Resultado
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                  1
                </div>
                <div className="h-0.5 w-6 bg-[#cfc4c5]" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8e8e8] text-sm font-bold text-[#5c5f60]">
                  2
                </div>
                <div className="h-0.5 w-6 bg-[#cfc4c5]" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8e8e8] text-sm font-bold text-[#5c5f60]">
                  3
                </div>
              </div>
            </div>

            {selected ? (
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
                      Mi score ({miNombre})
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      className="w-full rounded-lg border border-[#cfc4c5] bg-white p-4 text-center text-3xl font-bold outline-none ring-black focus:ring-1"
                      value={soyEquipo1 ? p1 : p2}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (soyEquipo1) setP1(v);
                        else setP2(v);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Score rival ({rivalNombre})
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      className="w-full rounded-lg border border-[#cfc4c5] bg-white p-4 text-center text-3xl font-bold outline-none ring-black focus:ring-1"
                      value={soyEquipo1 ? p2 : p1}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (soyEquipo1) setP2(v);
                        else setP1(v);
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registrar.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5c5f60] py-4 text-base font-bold text-white transition-all hover:bg-black disabled:opacity-50"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    send
                  </span>
                  Enviar Resultado
                </button>
              </form>
            ) : (
              <p className="text-[#5c5f60]">
                Elija un enfrentamiento de la lista izquierda.
              </p>
            )}
          </div>

          <div className="flex gap-4 rounded-xl border border-red-200 bg-red-50/50 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <span
                className="material-symbols-outlined text-red-700"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
            </div>
            <div>
              <h5 className="font-semibold text-red-900">Acceso restringido</h5>
              <p className="mt-1 text-sm text-red-800/80">
                Solo puede enviar resultados de partidas en las que participa; el
                rival u organizador deberá validar el marcador en la vista de
                validación.
              </p>
            </div>
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
