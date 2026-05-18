import { type FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { api } from "../../lib/api";

type Props = {
  open: boolean;
  idEquipo: number | null;
  torneoId: number;
  equipoNombre: string;
  torneoNombre: string;
  /** Solo organizadores pueden marcar capitán al dar de alta un invitado. */
  puedeMarcarCapitan: boolean;
  onClose: () => void;
};

export default function RegistrarParticipanteModal({
  open,
  idEquipo,
  torneoId,
  equipoNombre,
  torneoNombre,
  puedeMarcarCapitan,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState("");
  const [contacto, setContacto] = useState("");
  const [esCapitan, setEsCapitan] = useState(false);

  useEffect(() => {
    if (open) {
      setNickname("");
      setContacto("");
      setEsCapitan(false);
    }
  }, [open, idEquipo]);

  const agregar = useMutation({
    mutationFn: async () => {
      if (idEquipo == null) throw new Error("Equipo");
      await api.post(`/equipos/${idEquipo}/jugadores`, {
        nickname: nickname.trim(),
        esInvitado: true,
        contactoPreferido: contacto.trim() || undefined,
        esCapitan: puedeMarcarCapitan && esCapitan ? true : undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Participante agregado a la plantilla");
      await queryClient.invalidateQueries({ queryKey: ["torneo", torneoId] });
      await queryClient.invalidateQueries({ queryKey: ["torneos"] });
      onClose();
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? (err.response?.data as { error?: string })?.error ?? err.message
        : "Error al registrar";
      toast.error(msg);
    },
  });

  if (!open || idEquipo == null) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = nickname.trim();
    if (n.length < 1) {
      toast.error("Indique un nickname");
      return;
    }
    agregar.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#cfc4c5] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-part-titulo"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9] px-6 py-4">
          <div>
            <h2
              id="modal-part-titulo"
              className="text-lg font-bold tracking-tight text-black"
            >
              Registrar participante
            </h2>
            <p className="mt-0.5 text-xs text-[#5c5f60]">
              {torneoNombre} · {equipoNombre}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-[#5c5f60] transition-colors hover:bg-white hover:text-black"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={onSubmit}>
          <p className="rounded-xl border border-[#e8e8e8] bg-[#fcfcfc] px-4 py-3 text-xs leading-relaxed text-[#5c5f60]">
            No hace falta que el participante tenga cuenta en ArenaManager. Se
            guarda el <strong className="text-black">nickname</strong> en la
            plantilla del equipo (invitado).
          </p>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-black">
              Nickname <span className="text-red-500">*</span>
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7576]">
                @
              </span>
              <input
                required
                maxLength={50}
                autoComplete="off"
                className="arena-field w-full rounded-xl border border-[#cfc4c5] py-2.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-black"
                placeholder="ej. ShadowFox"
                value={nickname}
                onChange={(ev) => setNickname(ev.target.value)}
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-black">
              Contacto (opcional)
            </span>
            <input
              type="text"
              maxLength={100}
              className="arena-field w-full rounded-xl border border-[#cfc4c5] px-3 py-2.5 text-sm outline-none transition-colors focus:border-black"
              placeholder="Discord, teléfono, etc."
              value={contacto}
              onChange={(ev) => setContacto(ev.target.value)}
            />
          </label>

          {puedeMarcarCapitan ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cfc4c5] bg-[#f9f9f9] p-4">
              <input
                type="checkbox"
                checked={esCapitan}
                onChange={(ev) => setEsCapitan(ev.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#cfc4c5] text-black focus:ring-black"
              />
              <span className="text-sm text-[#1b1b1b]">
                <span className="font-semibold">Capitán del equipo</span>
                <span className="mt-0.5 block text-xs text-[#5c5f60]">
                  Solo organizadores pueden asignar capitán al registrar un
                  invitado.
                </span>
              </span>
            </label>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-xl border border-[#cfc4c5] px-5 py-2.5 text-sm font-semibold text-[#5c5f60] transition-colors hover:bg-[#f3f3f3]"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={agregar.isPending}
              className="rounded-xl bg-black px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {agregar.isPending ? "Guardando…" : "Guardar en plantilla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
