import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import ArenaHeader from "../components/layout/ArenaHeader";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type PrefsApi = {
  notifNuevoEnfrentamiento: boolean | null;
  notifResultadoValidado: boolean | null;
  notifCambioFase: boolean | null;
  notifRecordatorio: boolean | null;
  canalPreferido: string | null;
};

type PrefsUi = {
  enfrentamientos: boolean;
  resultados: boolean;
  fases: boolean;
  recordatorio: boolean;
  app: boolean;
  email: boolean;
};

function apiToUi(p: PrefsApi): PrefsUi {
  const canal = p.canalPreferido ?? "app";
  return {
    enfrentamientos: p.notifNuevoEnfrentamiento !== false,
    resultados: p.notifResultadoValidado !== false,
    fases: p.notifCambioFase !== false,
    recordatorio: p.notifRecordatorio !== false,
    app: canal === "app" || canal === "ambos",
    email: canal === "email" || canal === "ambos",
  };
}

function uiToApi(p: PrefsUi): Partial<PrefsApi> {
  let canalPreferido: "app" | "email" | "ambos" = "app";
  if (p.app && p.email) canalPreferido = "ambos";
  else if (p.email) canalPreferido = "email";
  else canalPreferido = "app";
  return {
    notifNuevoEnfrentamiento: p.enfrentamientos,
    notifResultadoValidado: p.resultados,
    notifCambioFase: p.fases,
    notifRecordatorio: p.recordatorio,
    canalPreferido,
  };
}

const defaultPrefs: PrefsUi = {
  enfrentamientos: true,
  resultados: true,
  fases: true,
  recordatorio: true,
  app: true,
  email: false,
};

type NotifApi = {
  idNotificacion: number;
  tipoNotificacion: string;
  titulo: string;
  mensaje: string;
  idTorneo: number | null;
  idEnfrentamiento: number | null;
  fechaEnvio: string;
  leida: boolean;
};

function iconForTipo(tipo: string) {
  switch (tipo) {
    case "enfrentamiento_asignado":
      return "sports_esports";
    case "campeon_torneo":
      return "emoji_events";
    default:
      return "notifications";
  }
}

function esNotifCampeon(tipo: string) {
  return tipo === "campeon_torneo";
}

export default function Notificaciones() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<PrefsUi>(defaultPrefs);

  const prefsQ = useQuery({
    queryKey: ["notif-preferencias"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await api.get<{ preferencias: PrefsApi }>(
        "/notificaciones/preferencias",
      );
      return apiToUi(data.preferencias);
    },
  });

  useEffect(() => {
    if (prefsQ.data) setPrefs(prefsQ.data);
  }, [prefsQ.data]);

  const guardarPrefs = useMutation({
    mutationFn: async (next: PrefsUi) => {
      await api.put("/notificaciones/preferencias", uiToApi(next));
    },
    onError: () => toast.error("No se pudieron guardar las preferencias"),
  });

  const inboxQ = useQuery({
    queryKey: ["notificaciones"],
    queryFn: async () => {
      const { data } = await api.get<{ notificaciones: NotifApi[] }>(
        "/notificaciones",
      );
      return data.notificaciones;
    },
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (inboxQ.isSuccess) {
      void queryClient.invalidateQueries({
        queryKey: ["notificaciones-no-leidas"],
      });
    }
  }, [inboxQ.isSuccess, queryClient]);

  const marcarLeidaM = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/notificaciones/${id}/leer`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      void queryClient.invalidateQueries({
        queryKey: ["notificaciones-no-leidas"],
      });
    },
    onError: () => {
      toast.error("No se pudo marcar como leída");
    },
  });

  const togglePref = useCallback((k: keyof PrefsUi) => {
    setPrefs((p) => {
      const next = { ...p, [k]: !p[k] };
      guardarPrefs.mutate(next);
      return next;
    });
  }, [guardarPrefs]);

  const inbox = inboxQ.data ?? [];

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader active="notificaciones" bg="gray" />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-10">
        <header className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-black">
            Centro de notificaciones
          </h1>
          <p className="text-base text-[#5c5f60]">
            Avisos cuando tu equipo tiene un nuevo enfrentamiento o cuando ganas
            un torneo.
          </p>
          <p className="mt-2 text-sm text-[#5c5f60]">
            Para crear enfrentamientos, abra un torneo en{" "}
            <Link to="/torneos" className="font-semibold text-black underline">
              Torneos
            </Link>{" "}
            y use la opción «Crear enfrentamiento» (organizadores).
          </p>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            {!user ? (
              <p className="rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
                <Link to="/login" className="font-semibold text-black underline">
                  Inicia sesión
                </Link>{" "}
                para ver tus notificaciones.
              </p>
            ) : inboxQ.isPending ? (
              <p className="text-[#5c5f60]">Cargando notificaciones…</p>
            ) : inboxQ.isError ? (
              <p className="text-red-600" role="alert">
                No se pudieron cargar las notificaciones.
              </p>
            ) : inbox.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#cfc4c5] bg-white p-8 text-center text-[#5c5f60]">
                No tienes notificaciones por ahora.
              </p>
            ) : (
              inbox.map((n) => {
                const campeon = esNotifCampeon(n.tipoNotificacion);
                return (
                <article
                  key={n.idNotificacion}
                  className={`flex gap-4 rounded-xl border p-6 shadow-sm ${
                    campeon
                      ? n.leida
                        ? "border-amber-200 bg-gradient-to-br from-amber-50/80 to-yellow-50/50 opacity-90"
                        : "border-amber-400 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80 ring-1 ring-amber-300/60"
                      : n.leida
                        ? "border-[#cfc4c5] border-opacity-60 bg-[#f9f9f9] opacity-80"
                        : "border-[#cfc4c5] bg-white"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                      campeon
                        ? "bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-md"
                        : "bg-black text-white"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={
                        campeon
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      {iconForTipo(n.tipoNotificacion)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className={`font-semibold ${campeon ? "text-amber-900" : "text-black"}`}>{n.titulo}</span>
                      <span className="text-xs text-[#5c5f60]">
                        {new Date(n.fechaEnvio).toLocaleString("es")}
                      </span>
                    </div>
                    <p className="text-sm text-[#1b1b1b]">{n.mensaje}</p>
                    {n.idTorneo ? (
                      <p className="mt-2 text-xs text-[#5c5f60]">
                        <Link
                          className="font-semibold text-black underline"
                          to={`/torneos/${n.idTorneo}/bracket`}
                        >
                          Ver torneo
                        </Link>
                        {n.idEnfrentamiento ? (
                          <>
                            {" · "}
                            <Link
                              className="font-semibold text-black underline"
                              to={`/torneos/${n.idTorneo}/registrar-resultado`}
                            >
                              Resultados
                            </Link>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    {!n.leida ? (
                      <button
                        type="button"
                        disabled={marcarLeidaM.isPending}
                        className="mt-3 rounded border border-[#cfc4c5] px-3 py-1 text-xs font-semibold hover:bg-[#f3f3f3] disabled:opacity-50"
                        onClick={() => marcarLeidaM.mutate(n.idNotificacion)}
                      >
                        Marcar como leído
                      </button>
                    ) : null}
                  </div>
                  {!n.leida ? (
                    <div
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${campeon ? "bg-amber-500" : "bg-black"}`}
                    />
                  ) : null}
                </article>
                );
              })
            )}

            <div className="flex items-center gap-3 rounded-lg border border-[#cfc4c5] bg-[#dee0e2] p-4">
              <span className="material-symbols-outlined text-[#5c5f60]">
                info
              </span>
              <p className="text-sm text-[#606365]">
                Recibirás avisos cuando se asigne un enfrentamiento a tu equipo y,
                si ganas la final, un mensaje especial de campeón.
              </p>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-8 flex flex-col gap-8 rounded-xl border border-[#cfc4c5] bg-[#eeeeee] p-8">
              <div>
                <h2 className="text-lg font-semibold text-black">Preferencias</h2>
                <p className="mt-1 text-sm text-[#5c5f60]">
                  Preferencias guardadas en tu cuenta. El correo se simula en
                  consola del servidor si no hay SMTP configurado.
                </p>
              </div>

              {(
                [
                  ["enfrentamientos", "Enfrentamientos", "Cuando tu equipo tenga partida"],
                  ["fases", "Campeón del torneo", "Felicitación al ganar la final"],
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
                      checked={prefs.app}
                      onChange={() => togglePref("app")}
                      className="rounded border-[#cfc4c5] text-black focus:ring-black"
                    />
                    <span className="text-sm">Notificaciones en la app</span>
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
                  guardarPrefs.mutate(defaultPrefs);
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row md:px-10">
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
