import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import NuevoEnfrentamientoModal, {
  type NuevoEnfrentamientoModalData,
} from "../components/modals/NuevoEnfrentamientoModal";
import type { TorneoResumen } from "../components/torneo/TorneoCard";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const PREFS_KEY = "arena-notif-prefs";
const NOTIFS_KEY = "arena-notif-inbox";

type Prefs = {
  enfrentamientos: boolean;
  resultados: boolean;
  fases: boolean;
  push: boolean;
  email: boolean;
};

const defaultPrefs: Prefs = {
  enfrentamientos: true,
  resultados: true,
  fases: true,
  push: true,
  email: false,
};

type InboxItem = {
  id: string;
  titulo: string;
  cuerpo: string;
  leido: boolean;
  en: string;
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

function loadInbox(): InboxItem[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InboxItem[];
  } catch {
    return [];
  }
}

type EquipoOpt = {
  idEquipo: number;
  nombreEquipo: string;
};

type TorneoDetalleEquipos = {
  idTorneo: number;
  nombre: string;
  equipos: EquipoOpt[];
};

export default function Notificaciones() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [inbox, setInbox] = useState<InboxItem[]>(loadInbox);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<NuevoEnfrentamientoModalData | null>(
    null,
  );

  const [torneoId, setTorneoId] = useState<number | "">("");
  const [fase, setFase] = useState("Cuartos de Final");
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [idEquipo1, setIdEquipo1] = useState<number | "">("");
  const [idEquipo2, setIdEquipo2] = useState<number | "">("");

  const esOrganizador = user?.globalRoles.includes("organizador") ?? false;

  const { data: torneos } = useQuery({
    queryKey: ["torneos"],
    queryFn: async () => {
      const { data } = await api.get<{ torneos: TorneoResumen[] }>("/torneos");
      return data.torneos;
    },
  });

  const misTorneos = useMemo(() => {
    if (!torneos || !user) return [];
    if (user.globalRoles.includes("organizador")) return torneos;
    return torneos.filter((t) => t.organizador?.idUsuario === user.idUsuario);
  }, [torneos, user]);

  const { data: torneoDetalle } = useQuery({
    queryKey: ["torneo", torneoId],
    enabled: typeof torneoId === "number" && torneoId > 0,
    queryFn: async () => {
      const { data } = await api.get<{ torneo: TorneoDetalleEquipos }>(
        `/torneos/${torneoId}`,
      );
      return data.torneo;
    },
  });

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(inbox));
  }, [inbox]);

  const crearEnfrentamiento = useMutation({
    mutationFn: async () => {
      if (typeof torneoId !== "number") throw new Error("Torneo");
      const body: Record<string, unknown> = {
        fase: fase.trim(),
        fechaProgramada:
          fechaProgramada.trim() === ""
            ? undefined
            : new Date(fechaProgramada).toISOString(),
      };
      if (typeof idEquipo1 === "number") body.idEquipo1 = idEquipo1;
      if (typeof idEquipo2 === "number") body.idEquipo2 = idEquipo2;
      const { data } = await api.post<{
        enfrentamiento: {
          idEnfrentamiento: number;
          fase: string;
          fechaProgramada: string | null;
          equipo1: { nombreEquipo: string } | null;
          equipo2: { nombreEquipo: string } | null;
        };
      }>(`/torneos/${torneoId}/enfrentamientos`, body);
      return data.enfrentamiento;
    },
    onSuccess: (enf) => {
      const tNombre =
        torneoDetalle?.nombre ??
        misTorneos.find((x) => x.idTorneo === torneoId)?.nombre ??
        "Torneo";
      const notif: InboxItem = {
        id: `enf-${enf.idEnfrentamiento}-${Date.now()}`,
        titulo: "Nuevo enfrentamiento",
        cuerpo: `Partida programada: ${enf.equipo1?.nombreEquipo ?? "—"} vs ${enf.equipo2?.nombreEquipo ?? "—"} (${enf.fase}).`,
        leido: false,
        en: new Date().toISOString(),
      };
      setInbox((prev) => [notif, ...prev]);
      setModalData({
        idTorneo: typeof torneoId === "number" ? torneoId : 0,
        idEnfrentamiento: enf.idEnfrentamiento,
        torneoNombre: tNombre,
        fase: enf.fase,
        nombreEquipo1: enf.equipo1?.nombreEquipo ?? null,
        nombreEquipo2: enf.equipo2?.nombreEquipo ?? null,
        fechaProgramada: enf.fechaProgramada,
      });
      setModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      queryClient.invalidateQueries({ queryKey: ["torneos"] });
      queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
      toast.success("Enfrentamiento creado");
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error al crear";
      toast.error(msg);
    },
  });

  const togglePref = useCallback(
    (k: keyof Prefs) => {
      setPrefs((p) => ({ ...p, [k]: !p[k] }));
    },
    [],
  );

  const marcarLeido = (id: string) => {
    setInbox((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n)),
    );
  };

  const equiposOpts = torneoDetalle?.equipos ?? [];

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <NuevoEnfrentamientoModal
        open={modalOpen}
        data={modalData}
        onClose={() => {
          setModalOpen(false);
          setModalData(null);
        }}
      />

      <ArenaHeader active="notificaciones" bg="gray" />

      <main className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <header className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-black">
            Centro de notificaciones
          </h1>
          <p className="text-base text-[#5c5f60]">
            Gestiona tus alertas y preferencias de competición.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            {esOrganizador ? (
              <section className="rounded-xl border border-[#cfc4c5] bg-white p-6 shadow-sm">
                <h2 className="mb-1 text-lg font-semibold text-black">
                  Programar enfrentamiento
                </h2>
                <p className="mb-6 text-sm text-[#5c5f60]">
                  Tras crearlo, verás el aviso tipo modal (prototipo) y quedará
                  registrado en tu bandeja local.
                </p>
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typeof torneoId !== "number") {
                      toast.error("Seleccione un torneo");
                      return;
                    }
                    if (!fase.trim()) {
                      toast.error("Indique la fase");
                      return;
                    }
                    crearEnfrentamiento.mutate();
                  }}
                >
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm font-semibold">Torneo</span>
                    <select
                      required
                      className="rounded-lg border border-[#cfc4c5] bg-white px-3 py-2"
                      value={torneoId === "" ? "" : String(torneoId)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTorneoId(v === "" ? "" : Number(v));
                        setIdEquipo1("");
                        setIdEquipo2("");
                      }}
                    >
                      <option value="">Seleccione…</option>
                      {misTorneos.map((t) => (
                        <option key={t.idTorneo} value={t.idTorneo}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Fase</span>
                    <input
                      className="rounded-lg border border-[#cfc4c5] px-3 py-2"
                      value={fase}
                      onChange={(e) => setFase(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">
                      Fecha y hora (opcional)
                    </span>
                    <input
                      type="datetime-local"
                      className="rounded-lg border border-[#cfc4c5] px-3 py-2"
                      value={fechaProgramada}
                      onChange={(e) => setFechaProgramada(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Equipo A</span>
                    <select
                      className="rounded-lg border border-[#cfc4c5] px-3 py-2"
                      value={idEquipo1 === "" ? "" : String(idEquipo1)}
                      onChange={(e) =>
                        setIdEquipo1(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    >
                      <option value="">Opcional</option>
                      {equiposOpts.map((eq) => (
                        <option key={eq.idEquipo} value={eq.idEquipo}>
                          {eq.nombreEquipo}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Equipo B</span>
                    <select
                      className="rounded-lg border border-[#cfc4c5] px-3 py-2"
                      value={idEquipo2 === "" ? "" : String(idEquipo2)}
                      onChange={(e) =>
                        setIdEquipo2(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    >
                      <option value="">Opcional</option>
                      {equiposOpts.map((eq) => (
                        <option key={eq.idEquipo} value={eq.idEquipo}>
                          {eq.nombreEquipo}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={crearEnfrentamiento.isPending}
                      className="rounded-lg bg-black px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {crearEnfrentamiento.isPending
                        ? "Creando…"
                        : "Crear enfrentamiento"}
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            {inbox.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
                No hay notificaciones guardadas en este dispositivo. Al
                programar un enfrentamiento como organizador, aparecerán aquí.
              </p>
            ) : (
              inbox.map((n) => (
                <article
                  key={n.id}
                  className={`flex gap-4 rounded-xl border border-[#cfc4c5] p-6 shadow-sm ${
                    n.leido ? "border-opacity-60 bg-[#f9f9f9] opacity-80" : "bg-white"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                    <span className="material-symbols-outlined text-2xl">
                      sports_esports
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-black">{n.titulo}</span>
                      <span className="text-xs text-[#5c5f60]">
                        {new Date(n.en).toLocaleString("es")}
                      </span>
                    </div>
                    <p className="text-sm text-[#1b1b1b]">{n.cuerpo}</p>
                    {!n.leido ? (
                      <button
                        type="button"
                        className="mt-3 rounded border border-[#cfc4c5] px-3 py-1 text-xs font-semibold hover:bg-[#f3f3f3]"
                        onClick={() => marcarLeido(n.id)}
                      >
                        Marcar como leído
                      </button>
                    ) : null}
                  </div>
                  {!n.leido ? (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-black" />
                  ) : null}
                </article>
              ))
            )}

            <div className="flex items-center gap-3 rounded-lg border border-[#cfc4c5] bg-[#dee0e2] p-4">
              <span className="material-symbols-outlined text-[#5c5f60]">
                info
              </span>
              <p className="text-sm text-[#606365]">
                Las notificaciones locales se guardan en el navegador; el
                backend puede ampliarse luego con notificaciones persistentes.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-8 flex flex-col gap-8 rounded-xl border border-[#cfc4c5] bg-[#eeeeee] p-8">
              <div>
                <h2 className="text-lg font-semibold text-black">Preferencias</h2>
                <p className="mt-1 text-sm text-[#5c5f60]">
                  Personaliza cómo recibes tus alertas (solo en este navegador).
                </p>
              </div>

              {(
                [
                  ["enfrentamientos", "Enfrentamientos", "Nuevos emparejamientos"],
                  ["resultados", "Resultados", "Validación y marcador"],
                  ["fases", "Nuevas fases", "Grupos, brackets y finales"],
                ] as const
              ).map(([key, label, sub]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-semibold text-black">{label}</span>
                    <p className="text-xs text-[#5c5f60]">{sub}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[key]}
                    onClick={() => togglePref(key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      prefs[key] ? "bg-black" : "bg-[#c5c6c8]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        prefs[key] ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}

              <hr className="border-[#cfc4c5]" />

              <div>
                <span className="font-semibold text-black">Canales de envío</span>
                <div className="mt-3 flex flex-col gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={prefs.push}
                      onChange={() => togglePref("push")}
                      className="rounded border-[#cfc4c5] text-black focus:ring-black"
                    />
                    <span className="text-sm">Notificaciones push (UI)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={prefs.email}
                      onChange={() => togglePref("email")}
                      className="rounded border-[#cfc4c5] text-black focus:ring-black"
                    />
                    <span className="text-sm">Correo electrónico</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-lg border border-black py-3 text-sm font-semibold text-black transition-colors hover:bg-[#e8e8e8]"
                onClick={() => {
                  setPrefs(defaultPrefs);
                  toast.success("Preferencias restablecidas");
                }}
              >
                Restablecer valores
              </button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-16 border-t border-[#cfc4c5] bg-[#eeeeee]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row md:px-10">
          <div>
            <p className="font-semibold text-black">ArenaManager</p>
            <p className="text-sm text-[#5c5f60]">
              © {new Date().getFullYear()} — Gestión profesional de torneos.
            </p>
          </div>
          <Link to="/torneos" className="text-sm text-[#5c5f60] hover:underline">
            Ver torneos
          </Link>
        </div>
      </footer>
    </div>
  );
}
