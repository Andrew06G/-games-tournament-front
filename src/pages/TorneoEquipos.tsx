import { Fragment, type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import ArenaHeader from "../components/layout/ArenaHeader";
import RegistrarParticipanteModal from "../components/modals/RegistrarParticipanteModal";
import CrearEnfrentamientoButton from "../components/torneo/CrearEnfrentamientoButton";
import EditarEquipoModal from "../components/modals/EditarEquipoModal";
import { api } from "../lib/api";
import { userCanManageTorneo } from "../lib/torneoPermissions";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";

type JugadorRow = {
  idJugador: number;
  idUsuario: number | null;
  nickname: string;
  esCapitan: boolean | null;
  contactoPreferido: string | null;
  usuario: { email: string } | null;
};

type EquipoRow = {
  idEquipo: number;
  nombreEquipo: string;
  logoUrl: string | null;
  estadoEquipo: string | null;
  jugadores: JugadorRow[];
  _count?: { jugadores: number };
};

type EnfMini = {
  idEquipo1: number | null;
  idEquipo2: number | null;
};

type TorneoEquiposData = {
  idTorneo: number;
  nombre: string;
  estado: string | null;
  numMaxParticipantes?: number;
  numInscritos?: number | null;
  organizador?: { idUsuario: number };
  equipos: EquipoRow[];
  enfrentamientos?: EnfMini[];
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

function esOrganizadorTorneo(
  user: AuthUser,
  torneo: TorneoEquiposData,
): boolean {
  if (user.globalRoles.includes("organizador")) return true;
  if (torneo.organizador?.idUsuario === user.idUsuario) return true;
  return false;
}

/** Alineado con backend: organizador del torneo; o capitán; o líder global miembro del equipo. */
function puedeRegistrarParticipantes(
  user: AuthUser | null,
  torneo: TorneoEquiposData | undefined,
  eq: EquipoRow,
): boolean {
  if (!user || !torneo) return false;
  if (esOrganizadorTorneo(user, torneo)) return true;
  if (torneo.estado !== "inscripciones_abiertas") return false;
  const cap = eq.jugadores.some(
    (j) => j.esCapitan && j.idUsuario === user.idUsuario,
  );
  if (cap) return true;
  if (user.globalRoles.includes("lider_equipo")) {
    return eq.jugadores.some((j) => j.idUsuario === user.idUsuario);
  }
  return false;
}

function puedeMarcarCapitanInvitado(
  user: AuthUser | null,
  torneo: TorneoEquiposData | undefined,
): boolean {
  if (!user || !torneo) return false;
  return esOrganizadorTorneo(user, torneo);
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
  const [expandedEquipoId, setExpandedEquipoId] = useState<number | null>(null);
  const [modalEquipo, setModalEquipo] = useState<{
    idEquipo: number;
    nombreEquipo: string;
  } | null>(null);
  const [editEquipo, setEditEquipo] = useState<{
    idEquipo: number;
    nombreEquipo: string;
    logoUrl: string | null;
  } | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["torneo", torneoId],
    enabled: Number.isInteger(torneoId) && torneoId > 0,
    queryFn: async () => {
      const { data: body } = await api.get<{ torneo: TorneoEquiposData }>(
        `/torneos/${torneoId}`,
      );
      return body.torneo;
    },
  });

  const inscripcionesAbiertas = data?.estado === "inscripciones_abiertas";
  const esOrgTorneo =
    !!user && !!data && userCanManageTorneo(user, data);
  const numInscritos =
    data?.numInscritos ?? data?.equipos.length ?? 0;
  const numMax = data?.numMaxParticipantes ?? 0;
  const cupoLleno = numMax > 0 && numInscritos >= numMax;
  const puedeInscribirEquipo =
    !!user &&
    !!data &&
    (esOrgTorneo || inscripcionesAbiertas) &&
    !cupoLleno;

  const nicknamePerfil = user?.nickname?.trim() ?? "";
  const muestraCampoNickname = esOrgTorneo || nicknamePerfil.length === 0;

  const eliminarEquipo = useMutation({
    mutationFn: async (idEquipo: number) => {
      await api.delete(`/equipos/${idEquipo}`);
    },
    onSuccess: async () => {
      toast.success("Equipo eliminado del torneo");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
      await queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error al eliminar";
      toast.error(msg);
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

  const filtrados = useMemo(() => {
    return (
      data?.equipos.filter((eq) => {
        if (!q.trim()) return true;
        const s = q.toLowerCase();
        const cap = eq.jugadores.find((j) => j.esCapitan) ?? eq.jugadores[0];
        const nickMatch = eq.jugadores.some((j) =>
          j.nickname.toLowerCase().includes(s),
        );
        return (
          eq.nombreEquipo.toLowerCase().includes(s) ||
          cap?.nickname.toLowerCase().includes(s) ||
          nickMatch
        );
      }) ?? []
    );
  }, [data?.equipos, q]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtrados.slice(start, start + PAGE_SIZE);
  }, [filtrados, page]);

  useEffect(() => {
    setPage(0);
  }, [q]);

  if (!Number.isInteger(torneoId) || torneoId < 1) {
    return <p role="alert">Identificador de torneo inválido.</p>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Debe iniciar sesión para inscribir un equipo");
      return;
    }
    if (muestraCampoNickname && esOrgTorneo && !nickname.trim()) {
      toast.error("Indique el nickname del capitán del equipo");
      return;
    }
    inscribir.mutate();
  }

  function puedeEliminarEquipo(eq: EquipoRow): boolean {
    if (!user || !data) return false;
    if (esOrganizadorTorneo(user, data)) return true;
    return eq.jugadores.some(
      (j) => j.esCapitan && j.idUsuario === user.idUsuario,
    );
  }

  const hayAlgunaGestion =
    !!user &&
    !!data &&
    (esOrgTorneo ||
      filtrados.some(
        (eq) =>
          puedeRegistrarParticipantes(user, data, eq) ||
          puedeEliminarEquipo(eq),
      ));

  function confirmarEliminarEquipo(eq: EquipoRow) {
    const ok = window.confirm(
      `¿Eliminar la inscripción del equipo "${eq.nombreEquipo}"? Esta acción no se puede deshacer.`,
    );
    if (ok) eliminarEquipo.mutate(eq.idEquipo);
  }

  function exportarCsv() {
    const filas = [
      ["Equipo", "Capitán", "Contacto", "Jugadores", "Estado"],
      ...(data?.equipos ?? []).map((eq) => {
        const cap =
          eq.jugadores.find((j) => j.esCapitan) ?? eq.jugadores[0];
        const contacto =
          cap?.contactoPreferido?.trim() ||
          cap?.usuario?.email ||
          "";
        return [
          eq.nombreEquipo,
          cap?.nickname ?? "",
          contacto,
          String(eq.jugadores.length),
          eq.estadoEquipo ?? "",
        ];
      }),
    ];
    const csv = filas
      .map((row) =>
        row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `equipos-${data?.nombre ?? torneoId}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV descargado");
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1b1b1b]">
      <EditarEquipoModal
        open={editEquipo != null}
        idEquipo={editEquipo?.idEquipo ?? null}
        torneoId={torneoId}
        nombreInicial={editEquipo?.nombreEquipo ?? ""}
        onClose={() => setEditEquipo(null)}
      />
      <RegistrarParticipanteModal
        open={modalEquipo != null}
        idEquipo={modalEquipo?.idEquipo ?? null}
        torneoId={torneoId}
        equipoNombre={modalEquipo?.nombreEquipo ?? ""}
        torneoNombre={data?.nombre ?? "Torneo"}
        puedeMarcarCapitan={puedeMarcarCapitanInvitado(user, data)}
        onClose={() => setModalEquipo(null)}
      />

      <ArenaHeader
        active="torneos"
        bg="white"
      />

      <main className="mx-auto flex min-w-0 max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:px-10">
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-black">
                Equipos Inscritos
              </h1>
              <p className="mt-1 text-sm text-[#5c5f60]">
                {data?.nombre ?? "Torneo"} — gestión de participantes.
              </p>
              {numMax > 0 ? (
                <p className="mt-2 text-sm font-semibold text-black">
                  Cupo:{" "}
                  <span className={cupoLleno ? "text-amber-800" : ""}>
                    {numInscritos} / {numMax} equipos
                  </span>
                  {cupoLleno ? (
                    <span className="ml-2 text-xs font-medium text-amber-700">
                      (cupo completo)
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#7e7576] px-4 py-2 text-sm font-semibold hover:bg-[#f3f3f3]"
                onClick={exportarCsv}
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Exportar CSV
              </button>
              <CrearEnfrentamientoButton
                torneoId={torneoId}
                torneoNombre={data?.nombre}
                organizadorId={data?.organizador?.idUsuario}
                estadoTorneo={data?.estado}
                enfrentamientos={data?.enfrentamientos}
                className="inline-flex items-center gap-2 rounded-lg border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              />
            </div>
          </div>

          <div className="relative w-full max-w-md min-w-0">
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

          <div className="overflow-x-auto rounded-xl border border-[#cfc4c5] bg-white shadow-sm">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[36%] min-w-[220px]" />
                <col className="hidden w-[22%] sm:table-column" />
                <col className="w-[18%]" />
                {hayAlgunaGestion ? <col className="w-[24%]" /> : null}
              </colgroup>
              <thead>
                <tr className="border-b border-[#cfc4c5] bg-[#f3f3f3]">
                  <th className="px-4 py-4 text-sm font-semibold text-[#5c5f60] md:px-6">
                    Equipo
                  </th>
                  <th className="hidden px-4 py-4 text-sm font-semibold text-[#5c5f60] sm:table-cell md:px-6">
                    Capitán
                  </th>
                  <th className="px-4 py-4 text-sm font-semibold text-[#5c5f60] md:px-6">
                    Estado
                  </th>
                  {hayAlgunaGestion ? (
                    <th className="px-4 py-4 text-right text-sm font-semibold text-[#5c5f60] md:px-6">
                      Gestión
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfc4c5]">
                {paginados.map((eq) => {
                  const cap =
                    eq.jugadores.find((j) => j.esCapitan) ?? eq.jugadores[0];
                  const badge = estadoEquipoLabel(eq.estadoEquipo);
                  const contacto =
                    cap?.contactoPreferido?.trim() ||
                    cap?.usuario?.email ||
                    "—";
                  const puede = puedeRegistrarParticipantes(user, data, eq);
                  const exp = expandedEquipoId === eq.idEquipo;

                  return (
                    <Fragment key={eq.idEquipo}>
                      <tr className="hover:bg-[#f9f9f9]">
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#cfc4c5] bg-white text-[#5c5f60] transition-colors hover:border-black hover:text-black"
                              aria-expanded={exp}
                              title="Ver plantilla"
                              onClick={() =>
                                setExpandedEquipoId(exp ? null : eq.idEquipo)
                              }
                            >
                              <span className="material-symbols-outlined text-xl">
                                {exp ? "expand_less" : "expand_more"}
                              </span>
                            </button>
                            <div className="flex min-w-0 flex-1 items-center gap-3">
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
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-black">
                                  {eq.nombreEquipo}
                                </div>
                                <div className="text-xs text-[#5c5f60] sm:hidden">
                                  @{cap?.nickname ?? "—"} · {eq.jugadores.length}{" "}
                                  en plantilla
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-4 text-sm text-[#5c5f60] sm:table-cell md:px-6">
                          <span className="font-medium text-black">
                            @{cap?.nickname ?? "—"}
                          </span>
                          <div className="mt-0.5 text-xs">{contacto}</div>
                        </td>
                        <td className="px-4 py-4 md:px-6">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        {hayAlgunaGestion ? (
                          <td className="px-4 py-4 text-right md:px-6">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {(user && esOrganizadorTorneo(user, data)) ||
                              puede ? (
                                <>
                                  <button
                                    type="button"
                                    title="Editar equipo"
                                    className="inline-flex items-center rounded-lg border border-[#cfc4c5] bg-white p-1.5 text-[#5c5f60] hover:border-black hover:text-black"
                                    onClick={() =>
                                      setEditEquipo({
                                        idEquipo: eq.idEquipo,
                                        nombreEquipo: eq.nombreEquipo,
                                        logoUrl: eq.logoUrl,
                                      })
                                    }
                                  >
                                    <span className="material-symbols-outlined text-lg">
                                      edit
                                    </span>
                                  </button>
                                  {puedeEliminarEquipo(eq) ? (
                                    <button
                                      type="button"
                                      title="Eliminar inscripción del equipo"
                                      disabled={eliminarEquipo.isPending}
                                      className="inline-flex items-center rounded-lg border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                      onClick={() => confirmarEliminarEquipo(eq)}
                                    >
                                      <span className="material-symbols-outlined text-lg">
                                        delete
                                      </span>
                                    </button>
                                  ) : null}
                                </>
                              ) : null}
                              {puede ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                  onClick={() =>
                                    setModalEquipo({
                                      idEquipo: eq.idEquipo,
                                      nombreEquipo: eq.nombreEquipo,
                                    })
                                  }
                                >
                                  <span className="material-symbols-outlined text-base">
                                    person_add
                                  </span>
                                  <span className="hidden sm:inline">
                                    Registrar participante
                                  </span>
                                  <span className="sm:hidden">Añadir</span>
                                </button>
                              ) : null}
                              {!puede &&
                              !(user && esOrganizadorTorneo(user, data)) ? (
                                <span className="text-xs text-[#cfc4c5]">—</span>
                              ) : null}
                            </div>
                          </td>
                        ) : null}
                      </tr>
                      {exp ? (
                        <tr className="bg-[#fcfcfc]">
                          <td
                            colSpan={hayAlgunaGestion ? 4 : 3}
                            className="px-4 pb-5 pt-0 md:px-6"
                          >
                            <div className="ml-12 rounded-xl border border-[#e8e8e8] bg-white p-4">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5c5f60]">
                                Plantilla ({eq.jugadores.length})
                              </p>
                              <ul className="flex flex-wrap gap-2">
                                {eq.jugadores.map((j) => (
                                  <li
                                    key={j.idJugador}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-1 text-xs"
                                  >
                                    <span className="font-semibold text-black">
                                      @{j.nickname}
                                    </span>
                                    {j.esCapitan ? (
                                      <span className="text-[10px] font-bold uppercase text-amber-700">
                                        Cap.
                                      </span>
                                    ) : null}
                                    {j.idUsuario == null ? (
                                      <span className="text-[10px] uppercase text-[#5c5f60]">
                                        Invitado
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                              {!inscripcionesAbiertas &&
                              user &&
                              data &&
                              !esOrganizadorTorneo(user, data) ? (
                                <p className="mt-3 text-xs text-amber-800">
                                  Inscripciones cerradas: solo el organizador
                                  puede añadir invitados.
                                </p>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {filtrados.length === 0 && !isPending ? (
              <p className="p-8 text-center text-sm text-[#5c5f60]">
                No hay equipos que coincidan.
              </p>
            ) : null}
            {filtrados.length > PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#cfc4c5] bg-[#f9f9f9] px-4 py-3">
                <p className="text-sm text-[#5c5f60]">
                  Página {page + 1} de {totalPages} ({filtrados.length} equipos)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 0}
                    className="rounded-lg border border-[#cfc4c5] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    className="rounded-lg border border-[#cfc4c5] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
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
            <h2 className="mb-2 text-lg font-semibold text-black">
              {esOrgTorneo ? "Añadir equipos al torneo" : "Inscribir nuevo equipo"}
            </h2>
            {esOrgTorneo ? (
              <p className="mb-6 text-xs text-[#5c5f60]">
                Como organizador puede registrar varios equipos. El capitán queda
                como invitado (nickname obligatorio).
              </p>
            ) : null}
            {!user ? (
              <p className="text-sm text-[#5c5f60]">
                <Link to="/login" className="font-semibold text-black underline">
                  Inicie sesión
                </Link>{" "}
                para registrar su equipo como capitán.
              </p>
            ) : !puedeInscribirEquipo && cupoLleno ? (
              <p className="text-sm text-amber-800">
                Cupo de equipos completo ({numInscritos}/{numMax}). No se pueden
                registrar más equipos.
              </p>
            ) : !puedeInscribirEquipo ? (
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
                    disabled={cupoLleno || inscribir.isPending}
                    className="arena-field w-full rounded-lg border border-[#cfc4c5] px-3 py-2 outline-none ring-black focus:ring-1 disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:opacity-60"
                    placeholder="Ej. Cyber Knights"
                    value={nombreEquipo}
                    onChange={(e) => setNombreEquipo(e.target.value)}
                  />
                </label>
                {!muestraCampoNickname ? (
                  <p className="rounded-lg border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2 text-sm text-[#5c5f60]">
                    Capitán:{" "}
                    <span className="font-semibold text-black">
                      @{nicknamePerfil}
                    </span>{" "}
                    (desde tu perfil)
                  </p>
                ) : (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">
                      Nickname del capitán (@){esOrgTorneo ? " *" : ""}
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7576]">
                        @
                      </span>
                      <input
                        required={esOrgTorneo}
                        disabled={cupoLleno || inscribir.isPending}
                        className="arena-field w-full rounded-lg border border-[#cfc4c5] py-2 pl-8 pr-3 outline-none ring-black focus:ring-1 disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:opacity-60"
                        placeholder={
                          esOrgTorneo
                            ? "nickname del representante"
                            : "opcional"
                        }
                        value={nickname}
                        onChange={(e) =>
                          setNickname(
                            e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                          )
                        }
                      />
                    </div>
                    {!esOrgTorneo ? (
                      <p className="text-xs text-[#5c5f60]">
                        Si lo dejas vacío, se usará el nombre del equipo.
                      </p>
                    ) : null}
                  </label>
                )}
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Email de Contacto</span>
                  <input
                    type="email"
                    disabled={cupoLleno || inscribir.isPending}
                    className="arena-field w-full rounded-lg border border-[#cfc4c5] px-3 py-2 outline-none ring-black focus:ring-1 disabled:cursor-not-allowed disabled:bg-[#f3f3f3] disabled:opacity-60"
                    placeholder="email@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={inscribir.isPending || cupoLleno}
                  className="mt-4 w-full rounded-lg bg-black py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                  Participantes invitados
                </h4>
                <p className="mt-1 text-xs text-[#5c5f60]">
                  El organizador, el capitán o un líder de equipo pueden añadir
                  nicknames sin cuenta desde{" "}
                  <strong className="text-black">Registrar participante</strong>{" "}
                  en cada fila.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-auto border-t border-[#cfc4c5] bg-[#eeeeee]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row md:px-10">
          <p className="text-sm font-semibold text-black">ArenaManager</p>
          <p className="text-sm text-[#5c5f60]">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
