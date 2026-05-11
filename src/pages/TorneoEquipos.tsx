import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type JugadorRow = {
  idUsuario: number;
  nickname: string;
  esCapitan: boolean | null;
  contactoPreferido: string | null;
  usuario: { email: string };
};

type EquipoRow = {
  idEquipo: number;
  nombreEquipo: string;
  logoUrl: string | null;
  estadoEquipo: string | null;
  jugadores: JugadorRow[];
  _count?: { jugadores: number };
};

type TorneoEquiposResponse = {
  torneo: {
    idTorneo: number;
    nombre: string;
    estado: string | null;
    equipos: EquipoRow[];
  };
};

function estadoEquipoLabel(estado: string | null | undefined) {
  if (estado === "activo")
    return {
      cls: "border border-green-200 bg-green-50 text-green-700",
      label: "Activo",
    };
  if (estado === "pendiente")
    return {
      cls: "border border-yellow-200 bg-yellow-50 text-yellow-700",
      label: "Pendiente",
    };
  return {
    cls: "border border-slate-200 bg-slate-100 text-slate-600",
    label: estado ?? "—",
  };
}

export default function TorneoEquipos() {
  const { id } = useParams<{ id: string }>();
  const torneoId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["torneo", torneoId],
    enabled: Number.isInteger(torneoId) && torneoId > 0,
    queryFn: async () => {
      const { data: body } = await api.get<TorneoEquiposResponse>(
        `/torneos/${torneoId}`,
      );
      return body.torneo;
    },
  });

  const inscribir = useMutation({
    mutationFn: async () => {
      await api.post(`/torneos/${torneoId}/equipos`, {
        nombreEquipo: nombreEquipo.trim(),
        nickname: nickname.trim() || undefined,
        contactoPreferido: email.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Equipo inscrito");
      setNombreEquipo("");
      setNickname("");
      setEmail("");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error";
      toast.error(msg);
    },
  });

  if (!Number.isInteger(torneoId) || torneoId < 1) {
    return <p role="alert">Identificador de torneo inválido.</p>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Debe iniciar sesión para inscribir un equipo");
      return;
    }
    inscribir.mutate();
  }

  const filtrados =
    data?.equipos.filter((eq) => {
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      const cap = eq.jugadores.find((j) => j.esCapitan) ?? eq.jugadores[0];
      return (
        eq.nombreEquipo.toLowerCase().includes(s) ||
        cap?.nickname.toLowerCase().includes(s)
      );
    }) ?? [];

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <ArenaHeader
        active="equipos"
        torneoContextId={torneoId}
        bg="white"
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 lg:flex-row lg:px-10">
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-black">
                Equipos Inscritos
              </h1>
              <p className="mt-1 text-sm text-[#5c5f60]">
                {data?.nombre ?? "Torneo"} — gestión de participantes.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#7e7576] px-4 py-2 text-sm font-semibold hover:bg-[#f3f3f3]"
              onClick={() => {
                const blob = new Blob(
                  [JSON.stringify(data?.equipos ?? [], null, 2)],
                  { type: "application/json" },
                );
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `equipos-torneo-${torneoId}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
                toast.success("Exportación descargada");
              }}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Exportar
            </button>
          </div>

          <div className="relative max-w-md">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7576]">
              search
            </span>
            <input
              className="w-full rounded-lg border border-[#cfc4c5] bg-white py-2 pl-10 pr-3 text-base outline-none ring-black focus:ring-1"
              placeholder="Buscar por nombre o nickname…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {isPending ? <p className="text-[#5c5f60]">Cargando…</p> : null}
          {isError ? (
            <p className="text-red-600" role="alert">
              {error instanceof Error ? error.message : "Error"}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-[#cfc4c5] bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#cfc4c5] bg-[#f3f3f3]">
                  <th className="px-6 py-4 text-sm font-semibold text-[#5c5f60]">
                    Equipo
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#5c5f60]">
                    Nickname
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-[#5c5f60]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfc4c5]">
                {filtrados.map((eq) => {
                  const cap =
                    eq.jugadores.find((j) => j.esCapitan) ?? eq.jugadores[0];
                  const badge = estadoEquipoLabel(eq.estadoEquipo);
                  const contacto =
                    cap?.contactoPreferido?.trim() ||
                    cap?.usuario.email ||
                    "—";
                  return (
                    <tr key={eq.idEquipo} className="hover:bg-[#f9f9f9]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#cfc4c5] bg-[#e8e8e8] text-xs font-bold">
                            {eq.logoUrl ? (
                              <img
                                src={eq.logoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              eq.nombreEquipo.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-black">
                              {eq.nombreEquipo}
                            </div>
                            <div className="text-xs text-[#5c5f60]">{contacto}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5c5f60]">
                        @{cap?.nickname ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtrados.length === 0 && !isPending ? (
              <p className="p-8 text-center text-sm text-[#5c5f60]">
                No hay equipos que coincidan.
              </p>
            ) : null}
          </div>

          <p className="text-sm text-[#5c5f60]">
            <Link className="text-black underline" to={`/torneos/${torneoId}/bracket`}>
              Ver bracket
            </Link>
            {" · "}
            <Link className="text-black underline" to="/torneos">
              Volver a torneos
            </Link>
          </p>
        </div>

        <aside className="w-full shrink-0 lg:w-[400px]">
          <div className="sticky top-24 rounded-xl border border-[#cfc4c5] bg-white p-8 shadow-sm">
            <h2 className="mb-8 text-lg font-semibold text-black">
              Inscribir Nuevo Equipo
            </h2>
            {!user ? (
              <p className="text-sm text-[#5c5f60]">
                <Link to="/login" className="font-semibold text-black underline">
                  Inicie sesión
                </Link>{" "}
                para registrar su equipo como capitán.
              </p>
            ) : data?.estado !== "inscripciones_abiertas" ? (
              <p className="text-sm text-amber-800">
                Este torneo no tiene inscripciones abiertas (
                <span className="font-mono">{data?.estado ?? "—"}</span>).
              </p>
            ) : (
              <form className="space-y-6" onSubmit={onSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Nombre del Equipo</span>
                  <input
                    required
                    className="w-full rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-2 outline-none ring-black focus:ring-1"
                    placeholder="Ej. Cyber Knights"
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Nickname Único (@)</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7576]">
                      @
                    </span>
                    <input
                      className="w-full rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] py-2 pl-8 pr-3 outline-none ring-black focus:ring-1"
                      placeholder="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Email de Contacto</span>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-2 outline-none ring-black focus:ring-1"
                    placeholder="email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={inscribir.isPending}
                  className="mt-4 w-full rounded-lg bg-black py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {inscribir.isPending ? "Registrando…" : "Registrar Equipo"}
                </button>
              </form>
            )}
            <div className="mt-10 flex gap-4 rounded-lg border border-[#cfc4c5] bg-[#eeeeee] p-4">
              <span
                className="material-symbols-outlined text-black"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                info
              </span>
              <div>
                <h4 className="text-sm font-semibold text-black">
                  Validación de Nickname
                </h4>
                <p className="mt-1 text-xs text-[#5c5f60]">
                  El backend comprueba que el nickname no esté repetido en el
                  mismo torneo.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-auto border-t border-[#cfc4c5] bg-[#eeeeee]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 md:flex-row md:px-10">
          <p className="text-sm font-semibold text-black">ArenaManager</p>
          <p className="text-sm text-[#5c5f60]">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
