import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import NuevoEnfrentamientoModal, {
  type NuevoEnfrentamientoModalData,
} from "../modals/NuevoEnfrentamientoModal";
import { api } from "../../lib/api";
import {
  equiposDisponiblesParaBracket,
  puedeCrearEnfrentamientoEnBracket,
  torneoBloqueaPartidas,
} from "../../lib/bracketHelpers";
import { userCanManageTorneo } from "../../lib/torneoPermissions";
import { useAuth } from "../../context/AuthContext";

type EquipoOpt = { idEquipo: number; nombreEquipo: string };

type EnfMini = {
  idEquipo1: number | null;
  idEquipo2: number | null;
};

type TorneoMini = {
  idTorneo: number;
  nombre: string;
  estado: string | null;
  organizador?: { idUsuario: number };
  equipos: EquipoOpt[];
  enfrentamientos?: EnfMini[];
};

type Props = {
  torneoId: number;
  torneoNombre?: string;
  organizadorId?: number;
  estadoTorneo?: string | null;
  enfrentamientos?: EnfMini[];
  className?: string;
};

export default function CrearEnfrentamientoButton({
  torneoId,
  torneoNombre,
  organizadorId,
  estadoTorneo,
  enfrentamientos: enfrentamientosProp,
  className = "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50",
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] =
    useState<NuevoEnfrentamientoModalData | null>(null);
  const [fechaProgramada, setFechaProgramada] = useState("");
  const [idEquipo1, setIdEquipo1] = useState<number | "">("");
  const [idEquipo2, setIdEquipo2] = useState<number | "">("");

  const { data: torneo } = useQuery({
    queryKey: ["torneo", torneoId],
    enabled: Boolean(user) && torneoId > 0,
    queryFn: async () => {
      const { data } = await api.get<{ torneo: TorneoMini }>(
        `/torneos/${torneoId}`,
      );
      return data.torneo;
    },
  });

  const puedeCrear =
    user != null &&
    userCanManageTorneo(user, {
      organizador:
        torneo?.organizador ??
        (organizadorId != null ? { idUsuario: organizadorId } : undefined),
    });

  const estado = estadoTorneo ?? torneo?.estado ?? null;
  const enfs = enfrentamientosProp ?? torneo?.enfrentamientos ?? [];
  const equiposTodos = torneo?.equipos ?? [];

  const bloqueado = torneoBloqueaPartidas(estado);
  const hayCupo = puedeCrearEnfrentamientoEnBracket(enfs);
  const deshabilitado = bloqueado || !hayCupo;

  const equiposLibresA = useMemo(
    () =>
      equiposDisponiblesParaBracket(
        equiposTodos,
        enfs,
        typeof idEquipo2 === "number" ? [idEquipo2] : [],
      ),
    [equiposTodos, enfs, idEquipo2],
  );

  const equiposLibresB = useMemo(
    () =>
      equiposDisponiblesParaBracket(
        equiposTodos,
        enfs,
        typeof idEquipo1 === "number" ? [idEquipo1] : [],
      ),
    [equiposTodos, enfs, idEquipo1],
  );

  const nombreTorneo = torneoNombre ?? torneo?.nombre ?? "Torneo";

  const crear = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
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
      setOpen(false);
      setSuccessData({
        idTorneo: torneoId,
        idEnfrentamiento: enf.idEnfrentamiento,
        torneoNombre: nombreTorneo,
        fase: enf.fase,
        nombreEquipo1: enf.equipo1?.nombreEquipo ?? null,
        nombreEquipo2: enf.equipo2?.nombreEquipo ?? null,
        fechaProgramada: enf.fechaProgramada,
      });
      setSuccessOpen(true);
      void queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      void queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
      void queryClient.invalidateQueries({ queryKey: ["torneos"] });
      toast.success("Enfrentamiento creado");
    },
    onError: (err) => {
      if (isAxiosError(err)) {
        const data = err.response?.data as {
          error?: string;
          details?: { fieldErrors?: Record<string, string[]> };
        };
        const fieldMsg = data?.details?.fieldErrors
          ? Object.values(data.details.fieldErrors).flat()[0]
          : undefined;
        toast.error(fieldMsg ?? data?.error ?? err.message);
        return;
      }
      toast.error("Error al crear");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (typeof idEquipo1 !== "number" || typeof idEquipo2 !== "number") {
      toast.error("Seleccione los dos equipos del enfrentamiento");
      return;
    }
    if (idEquipo1 === idEquipo2) {
      toast.error("Debe elegir dos equipos distintos");
      return;
    }
    crear.mutate();
  }

  if (!puedeCrear) return null;

  const tituloDeshabilitado = bloqueado
    ? "Torneo finalizado"
    : !hayCupo
      ? "Todos los cupos del bracket están asignados"
      : undefined;

  return (
    <>
      <NuevoEnfrentamientoModal
        open={successOpen}
        data={successData}
        onClose={() => {
          setSuccessOpen(false);
          setSuccessData(null);
        }}
      />
      <button
        type="button"
        className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
        disabled={deshabilitado}
        title={tituloDeshabilitado}
        onClick={() => setOpen(true)}
      >
        Crear enfrentamiento
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crear-enf-titulo"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#cfc4c5] bg-white p-6 text-[#1b1b1b] shadow-xl"
            style={{ colorScheme: "light" }}
          >
            <h2 id="crear-enf-titulo" className="mb-1 text-lg font-semibold text-black">
              Crear enfrentamiento
            </h2>
            <p className="mb-4 text-sm text-[#5c5f60]">
              {nombreTorneo} — siguiente cupo libre. Solo equipos sin asignar.
            </p>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Fecha y hora (opcional)</span>
                <input
                  type="datetime-local"
                  className="arena-field w-full rounded-lg border border-[#cfc4c5] px-3 py-2"
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Equipo A *</span>
                <select
                  required
                  className="arena-field w-full rounded-lg border border-[#cfc4c5] px-3 py-2"
                  value={idEquipo1 === "" ? "" : String(idEquipo1)}
                  onChange={(e) =>
                    setIdEquipo1(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">Seleccione…</option>
                  {equiposLibresA.map((eq) => (
                    <option key={eq.idEquipo} value={eq.idEquipo}>
                      {eq.nombreEquipo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Equipo B *</span>
                <select
                  required
                  className="arena-field w-full rounded-lg border border-[#cfc4c5] px-3 py-2"
                  value={idEquipo2 === "" ? "" : String(idEquipo2)}
                  onChange={(e) =>
                    setIdEquipo2(e.target.value === "" ? "" : Number(e.target.value))
                  }
                >
                  <option value="">Seleccione…</option>
                  {equiposLibresB.map((eq) => (
                    <option key={eq.idEquipo} value={eq.idEquipo}>
                      {eq.nombreEquipo}
                    </option>
                  ))}
                </select>
              </label>
              {equiposLibresA.length === 0 ? (
                <p className="text-sm text-amber-700">
                  No hay equipos libres para asignar.
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg border border-[#cfc4c5] px-4 py-2 text-sm font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crear.isPending || equiposLibresA.length < 2}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {crear.isPending ? "Creando…" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
