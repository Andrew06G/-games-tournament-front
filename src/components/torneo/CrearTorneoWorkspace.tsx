import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import type { TorneoResumen } from "./TorneoCard";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type TorneoListaItem = TorneoResumen & {
  numMaxParticipantes?: number | null;
  organizador?: { idUsuario: number };
};

type TipoCatalogo = {
  idTipo: number;
  nombre: string;
  descripcion: string | null;
  numJugadoresMinimo: number;
  numJugadoresMaximo: number;
};

type FormatoCatalogo = {
  idFormato: number;
  nombre: string;
  descripcion: string | null;
  requiereFaseGrupos: boolean | null;
};

const CUPOS = [8, 16, 32, 64] as const;

function estadoBadge(estado: string | null | undefined): {
  cls: string;
  label: string;
} {
  const e = estado ?? "";
  if (e === "en_curso")
    return { cls: "bg-green-100 text-green-600", label: "En curso" };
  if (e === "finalizado")
    return { cls: "bg-slate-100 text-slate-400", label: "Finalizado" };
  if (e === "inscripciones_abiertas")
    return { cls: "bg-blue-100 text-blue-600", label: "Inscripciones" };
  if (e === "cancelado")
    return { cls: "bg-red-100 text-red-600", label: "Cancelado" };
  const label = e ? e.replace(/_/g, " ") : "—";
  return { cls: "bg-slate-100 text-slate-600", label };
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 transition-colors focus:border-black focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";
const selectClass =
  "w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 transition-colors focus:border-black focus:outline-none focus:ring-0 md:w-1/2 appearance-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

export type CrearTorneoWorkspaceProps = {
  /** Enlace “Ver listado de torneos” bajo el subtítulo (p. ej. ruta dedicada /crear). */
  showTorneosLinkInIntro?: boolean;
  onCancel: () => void;
};

/**
 * Contenido alineado con `create_new_tournament.html`: formulario + barra lateral.
 * Si el usuario no es organizador, el formulario queda deshabilitado y se muestra un aviso.
 */
export default function CrearTorneoWorkspace({
  showTorneosLinkInIntro = true,
  onCancel,
}: CrearTorneoWorkspaceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const esOrganizador = user?.globalRoles.includes("organizador") ?? false;

  const [nombre, setNombre] = useState("");
  const [idTipoVideojuego, setIdTipoVideojuego] = useState("");
  const [idFormato, setIdFormato] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [participants, setParticipants] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  const { data: catalogos, isPending: catalogosPending } = useQuery({
    queryKey: ["catalogos"],
    queryFn: async () => {
      const [tiposRes, formatosRes] = await Promise.all([
        api.get<{ tipos: TipoCatalogo[] }>("/catalogos/tipos-videojuego"),
        api.get<{ formatos: FormatoCatalogo[] }>("/catalogos/formatos-torneo"),
      ]);
      return {
        tipos: tiposRes.data.tipos,
        formatos: formatosRes.data.formatos,
      };
    },
  });

  const { data: todosTorneos, isPending: cargandoLista } = useQuery({
    queryKey: ["torneos"],
    queryFn: async () => {
      const { data: body } = await api.get<{ torneos: TorneoListaItem[] }>(
        "/torneos",
      );
      return body.torneos;
    },
  });

  const misTorneos = useMemo(() => {
    if (!user || !todosTorneos) return [];
    return todosTorneos
      .filter((t) => t.organizador?.idUsuario === user.idUsuario)
      .slice(0, 12);
  }, [todosTorneos, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!esOrganizador) {
      toast.error(
        "Necesita el rol organizador para crear torneos. Consulte con el administrador del sistema.",
      );
      return;
    }
    const idTipo = Number(idTipoVideojuego);
    const idFmt = Number(idFormato);
    if (!Number.isInteger(idTipo) || idTipo < 1) {
      toast.error("Seleccione el tipo de videojuego (catálogo)");
      return;
    }
    if (!Number.isInteger(idFmt) || idFmt < 1) {
      toast.error("Seleccione el formato del torneo");
      return;
    }
    if (participants === "") {
      toast.error("Seleccione el número de participantes");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post<{ torneo: { idTorneo: number } }>(
        "/torneos",
        {
          nombre: nombre.trim(),
          idTipoVideojuego: idTipo,
          idFormato: idFmt,
          fechaInicio,
          numMaxParticipantes: participants,
        },
      );
      toast.success("Torneo creado");
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
      navigate(`/torneos/${data.torneo.idTorneo}/bracket`);
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error al crear";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const formDisabled = !esOrganizador || catalogosPending;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-black">
          Crear Nuevo Torneo
        </h1>
        <p className="text-slate-500">
          Configure los detalles de su torneo. Todos los campos son obligatorios.
          {showTorneosLinkInIntro ? (
            <>
              {" "}
              <Link
                to="/torneos"
                className="font-semibold text-black underline decoration-black"
              >
                Ver listado de torneos
              </Link>
              .
            </>
          ) : null}
        </p>
        {user ? (
          <p className="mt-2 text-sm text-slate-600">
            Sesión: <strong className="text-black">{user.nombre}</strong>
            {" · "}
            Roles:{" "}
            <span className="font-mono text-xs">
              {user.globalRoles.join(", ") || "—"}
            </span>
          </p>
        ) : null}
      </header>

      {!esOrganizador ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">Vista del formulario (solo lectura)</p>
          <p className="mt-1 text-amber-900">
            Para activar la creación de torneos su usuario debe tener el rol{" "}
            <strong>organizador</strong> en la base de datos. Puede seguir
            explorando competiciones.
          </p>
          <Link
            to="/torneos"
            className="mt-3 inline-block font-semibold text-black underline"
          >
            Ir al listado de torneos
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <main className="rounded-3xl border border-slate-100 bg-white p-8 shadow-card md:p-10 lg:col-span-8">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="tournament-name"
              >
                Nombre del Torneo <span className="text-red-500">*</span>
              </label>
              <input
                id="tournament-name"
                required
                disabled={formDisabled}
                className={inputClass}
                placeholder="Ej: Copa Primavera 2024"
                type="text"
                value={nombre}
                onChange={(ev) => setNombre(ev.target.value)}
              />
              <p className="mt-2 text-xs text-slate-400">
                Elija un nombre único y descriptivo para su torneo
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="game-type"
              >
                Tipo de Videojuego <span className="text-red-500">*</span>
              </label>
              <select
                id="game-type"
                required
                disabled={formDisabled || !catalogos?.tipos.length}
                className={selectClass}
                value={idTipoVideojuego}
                onChange={(ev) => setIdTipoVideojuego(ev.target.value)}
              >
                <option value="">
                  {catalogosPending
                    ? "Cargando categorías…"
                    : "Seleccione un tipo de videojuego"}
                </option>
                {(catalogos?.tipos ?? []).map((t) => (
                  <option key={t.idTipo} value={String(t.idTipo)}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="format"
              >
                Formato del Torneo <span className="text-red-500">*</span>
              </label>
              <select
                id="format"
                required
                disabled={formDisabled || !catalogos?.formatos.length}
                className={selectClass}
                value={idFormato}
                onChange={(ev) => setIdFormato(ev.target.value)}
              >
                <option value="">
                  {catalogosPending
                    ? "Cargando formatos…"
                    : "Seleccione el formato"}
                </option>
                {(catalogos?.formatos ?? []).map((f) => (
                  <option key={f.idFormato} value={String(f.idFormato)}>
                    {f.nombre}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">
                El formato determina cómo se generará el bracket automáticamente
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  htmlFor="start-date"
                >
                  Fecha de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  id="start-date"
                  required
                  disabled={formDisabled}
                  type="date"
                  className={inputClass}
                  value={fechaInicio}
                  onChange={(ev) => setFechaInicio(ev.target.value)}
                />
              </div>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  htmlFor="participants"
                >
                  Número de Participantes{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="participants"
                  required
                  disabled={formDisabled}
                  className={inputClass}
                  value={participants === "" ? "" : String(participants)}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setParticipants(v === "" ? "" : Number(v));
                  }}
                >
                  <option value="" disabled>
                    Seleccione
                  </option>
                  {CUPOS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6">
              <button
                type="submit"
                disabled={busy || formDisabled}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-8 py-3 font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    clipRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    fillRule="evenodd"
                  />
                </svg>
                {busy ? "Creando…" : "Crear Torneo"}
              </button>
              <button
                type="button"
                className="font-semibold text-slate-500 transition-colors hover:text-black"
                onClick={onCancel}
              >
                Cancelar
              </button>
            </div>
          </form>
        </main>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="mb-6 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <h2 className="font-bold text-black">Mis Torneos Activos</h2>
            </div>
            {cargandoLista ? (
              <p className="text-sm text-slate-500">Cargando…</p>
            ) : misTorneos.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no tiene torneos publicados. Cree el primero con el
                formulario.
              </p>
            ) : (
              <ul className="space-y-4">
                {misTorneos.map((t) => {
                  const { cls, label } = estadoBadge(t.estado);
                  const max = t.numMaxParticipantes ?? "—";
                  return (
                    <li key={t.idTorneo}>
                      <Link
                        to={`/torneos/${t.idTorneo}/bracket`}
                        className="block rounded-2xl border border-transparent p-4 transition-colors hover:border-slate-100 hover:bg-slate-50"
                      >
                        <div className="mb-1 flex justify-between gap-2">
                          <span className="text-sm font-bold">{t.nombre}</span>
                          <span
                            className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${cls}`}
                          >
                            {label}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Cupo máx. {max} equipos
                          {t._count != null
                            ? ` · ${t._count.equipos} inscritos`
                            : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-bold text-black">
                Generación automática
              </h3>
              <p className="text-xs leading-relaxed text-slate-500">
                Al crear el torneo, el sistema generará el bracket según el
                formato seleccionado cuando haya suficientes equipos
                inscritos.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
