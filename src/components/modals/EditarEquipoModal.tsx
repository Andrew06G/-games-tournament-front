import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { api } from "../../lib/api";

type Props = {
  open: boolean;
  idEquipo: number | null;
  torneoId: number;
  nombreInicial: string;
  onClose: () => void;
};

export default function EditarEquipoModal({
  open,
  idEquipo,
  torneoId,
  nombreInicial,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(nombreInicial);

  useEffect(() => {
    if (open) {
      setNombre(nombreInicial);
    }
  }, [open, nombreInicial]);

  const guardar = useMutation({
    mutationFn: async () => {
      if (!idEquipo) return;
      await api.patch(`/equipos/${idEquipo}`, {
        nombreEquipo: nombre.trim(),
      });
    },
    onSuccess: async () => {
      toast.success("Equipo actualizado");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
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

  if (!open || !idEquipo) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre del equipo es obligatorio");
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
        className="w-full max-w-md rounded-xl border border-[#cfc4c5] bg-white p-6 shadow-xl"
        style={{ colorScheme: "light" }}
      >
        <h2 className="mb-4 text-lg font-semibold text-black">Editar equipo</h2>
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
