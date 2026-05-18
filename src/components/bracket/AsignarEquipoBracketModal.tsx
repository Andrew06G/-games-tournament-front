import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { api } from "../../lib/api";

type EquipoOpt = { idEquipo: number; nombreEquipo: string };

type Props = {
  open: boolean;
  idEnfrentamiento: number | null;
  torneoId: number;
  lado: 1 | 2;
  equipos: EquipoOpt[];
  onClose: () => void;
};

export default function AsignarEquipoBracketModal({
  open,
  idEnfrentamiento,
  torneoId,
  lado,
  equipos,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [idEquipo, setIdEquipo] = useState<number | "">("");

  const asignar = useMutation({
    mutationFn: async () => {
      if (idEnfrentamiento == null || typeof idEquipo !== "number") {
        throw new Error("Datos incompletos");
      }
      await api.patch(`/enfrentamientos/${idEnfrentamiento}/slot`, {
        lado,
        idEquipo,
      });
    },
    onSuccess: async () => {
      toast.success("Equipo asignado al bracket");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["bracket", torneoId] });
      onClose();
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error";
      toast.error(msg);
    },
  });

  if (!open || idEnfrentamiento == null) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (typeof idEquipo !== "number") {
      toast.error("Seleccione un equipo");
      return;
    }
    asignar.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#cfc4c5] bg-white p-6 text-[#1b1b1b] shadow-xl"
        style={{ colorScheme: "light" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold text-black">
          Asignar equipo manualmente
        </h2>
        <p className="mb-4 text-sm text-[#5c5f60]">
          Cupo {lado === 1 ? "superior" : "inferior"} del enfrentamiento
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Equipo</span>
            <select
              required
              className="arena-field w-full rounded-lg border border-[#cfc4c5] px-3 py-2"
              value={idEquipo === "" ? "" : String(idEquipo)}
              onChange={(e) =>
                setIdEquipo(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">Seleccione…</option>
              {equipos.map((eq) => (
                <option key={eq.idEquipo} value={eq.idEquipo}>
                  {eq.nombreEquipo}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-[#cfc4c5] px-4 py-2 text-sm font-semibold"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={asignar.isPending}
              className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {asignar.isPending ? "Guardando…" : "Asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}