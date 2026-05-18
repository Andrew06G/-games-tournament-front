import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { api } from "../../lib/api";

type Props = {
  open: boolean;
  torneo: {
    idTorneo: number;
    nombre: string;
    descripcion?: string | null;
    fechaInicio: string;
    fechaFin?: string | null;
    premioDescripcion?: string | null;
    reglas?: string | null;
  } | null;
  onClose: () => void;
};

export default function EditarTorneoModal({ open, torneo, onClose }: Props) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [premio, setPremio] = useState("");
  const [reglas, setReglas] = useState("");

  useEffect(() => {
    if (open && torneo) {
      setNombre(torneo.nombre);
      setDescripcion(torneo.descripcion ?? "");
      setFechaInicio(torneo.fechaInicio.slice(0, 10));
      setFechaFin(torneo.fechaFin?.slice(0, 10) ?? "");
      setPremio(torneo.premioDescripcion ?? "");
      setReglas(torneo.reglas ?? "");
    }
  }, [open, torneo]);

  const guardar = useMutation({
    mutationFn: async () => {
      if (!torneo) return;
      await api.put(`/torneos/${torneo.idTorneo}`, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        fechaInicio,
        fechaFin: fechaFin.trim() === "" ? null : fechaFin,
        premioDescripcion: premio.trim() || null,
        reglas: reglas.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Torneo actualizado");
      if (torneo) {
        await queryClient.invalidateQueries({
          queryKey: ["torneo", torneo.idTorneo],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
      onClose();
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error al guardar";
      toast.error(msg);
    },
  });

  if (!open || !torneo) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    guardar.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#cfc4c5] bg-white p-6 shadow-xl"
        style={{ colorScheme: "light" }}
      >
        <h2 className="mb-4 text-lg font-semibold text-black">Editar torneo</h2>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Nombre</span>
            <input
              required
              className="arena-field rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Descripción</span>
            <textarea
              rows={3}
              className="arena-field rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Fecha inicio</span>
            <input
              type="date"
              required
              className="arena-field rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Fecha fin (opcional)</span>
            <input
              type="date"
              className="arena-field rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Premio</span>
            <input
              className="arena-field rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={premio}
              onChange={(e) => setPremio(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Reglas</span>
            <textarea
              rows={2}
              className="arena-field rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={reglas}
              onChange={(e) => setReglas(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-lg border border-[#cfc4c5] px-4 py-2 text-sm font-semibold"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardar.isPending}
              className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {guardar.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
