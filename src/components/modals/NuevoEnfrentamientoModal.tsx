import { Link } from "react-router-dom";

export type NuevoEnfrentamientoModalData = {
  idTorneo: number;
  idEnfrentamiento: number;
  torneoNombre: string;
  fase: string;
  nombreEquipo1: string | null;
  nombreEquipo2: string | null;
  fechaProgramada: string | null;
};

function iniciales(nombre: string | null | undefined): string {
  if (!nombre?.trim()) return "?";
  const p = nombre.trim().split(/\s+/);
  if (p.length >= 2) return (p[0]![0]! + p[1]![0]!).toUpperCase();
  return nombre.trim().slice(0, 2).toUpperCase();
}

type Props = {
  open: boolean;
  data: NuevoEnfrentamientoModalData | null;
  onClose: () => void;
};

export default function NuevoEnfrentamientoModal({
  open,
  data,
  onClose,
}: Props) {
  if (!open || !data) return null;

  const fechaTxt = data.fechaProgramada
    ? new Intl.DateTimeFormat("es", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(data.fechaProgramada))
    : "Por definir";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 p-5 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[#cfc4c5] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-enf-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-black p-6 text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white">
              notification_important
            </span>
            <h3 id="modal-enf-titulo" className="text-lg font-semibold">
              Nuevo Enfrentamiento Programado
            </h3>
          </div>
          <button
            type="button"
            className="text-white/60 transition-colors hover:text-white"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-8">
          <div className="mb-6 flex justify-center">
            <span className="rounded-full bg-[#eeeeee] px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#606365]">
              {data.fase}
            </span>
          </div>
          <div className="mb-8 flex items-center justify-between gap-6">
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#cfc4c5] bg-[#e2e2e2] shadow-sm">
                <span className="text-3xl font-bold text-black">
                  {iniciales(data.nombreEquipo1)}
                </span>
              </div>
              <span className="text-center text-lg font-semibold text-black">
                {data.nombreEquipo1 ?? "Por definir"}
              </span>
            </div>
            <span className="text-3xl font-extrabold italic text-[#cfc4c5]">
              VS
            </span>
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[#cfc4c5] bg-black shadow-sm">
                <span className="text-3xl font-bold text-white">
                  {iniciales(data.nombreEquipo2)}
                </span>
              </div>
              <span className="text-center text-lg font-semibold text-black">
                {data.nombreEquipo2 ?? "Por definir"}
              </span>
            </div>
          </div>
          <div className="mb-8 space-y-2 rounded-lg border border-[#cfc4c5] bg-[#f3f3f3] p-4 text-[#5c5f60]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                calendar_today
              </span>
              <span className="text-base capitalize">{fechaTxt}</span>
            </div>
          </div>
          <Link
            to={`/torneos/${data.idTorneo}/bracket`}
            className="block w-full rounded-lg bg-black py-4 text-center text-base font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
            onClick={onClose}
          >
            Ver Enfrentamiento
          </Link>
        </div>
      </div>
    </div>
  );
}
