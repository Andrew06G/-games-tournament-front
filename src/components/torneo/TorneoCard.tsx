import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";

export type TorneoResumen = {
  idTorneo: number;
  nombre: string;
  estado: string | null;
  fechaInicio: string;
  numMaxParticipantes?: number | null;
  numInscritos?: number | null;
  tipoVideojuego?: { nombre: string };
  formato?: { nombre: string };
  organizador?: { idUsuario: number };
  _count?: { equipos: number };
};

function inicialesTipo(nombre: string | undefined): string {
  if (!nombre?.trim()) return "T";
  return nombre.trim().slice(0, 2).toUpperCase();
}

function subtituloLinea(t: TorneoResumen): string {
  const juego = t.tipoVideojuego?.nombre ?? "Videojuego";
  const fmt = t.formato?.nombre ?? "Formato";
  return `${juego} · ${fmt}`;
}

function diasRelativo(fechaIso: string): string {
  const d = startOfDay(parseISO(fechaIso.slice(0, 10)));
  if (!isValid(d)) return "";
  const hoy = startOfDay(new Date());
  const days = differenceInCalendarDays(d, hoy);
  if (days === 0) return "Inicia hoy";
  if (days === 1) return "Empieza mañana";
  if (days > 1) return `Empieza en ${days} días`;
  if (days === -1) return "Inició ayer";
  if (days < -1) return `Iniciado hace ${Math.abs(days)} días`;
  return format(d, "d MMM yyyy", { locale: es });
}

type BadgeVariant = "green" | "yellow" | "gray" | "red";

function badgeInfo(t: TorneoResumen): {
  variant: BadgeVariant;
  label: string;
  sub: string;
  pulse: boolean;
} {
  const e = t.estado ?? "";
  const sub = diasRelativo(t.fechaInicio);

  if (e === "en_curso") {
    return {
      variant: "green",
      label: "En curso",
      sub,
      pulse: true,
    };
  }
  if (e === "finalizado") {
    const fd = parseISO(t.fechaInicio.slice(0, 10));
    return {
      variant: "gray",
      label: "Finalizado",
      sub: isValid(fd)
        ? format(fd, "d MMM yyyy", { locale: es })
        : "",
      pulse: false,
    };
  }
  if (e === "cancelado") {
    return {
      variant: "red",
      label: "Cancelado",
      sub: "",
      pulse: false,
    };
  }
  return {
    variant: "yellow",
    label: "Próximamente",
    sub,
    pulse: false,
  };
}

const badgeStyles: Record<
  BadgeVariant,
  { wrap: string; dot: string }
> = {
  green: {
    wrap: "bg-green-100 text-green-800",
    dot: "bg-green-600",
  },
  yellow: {
    wrap: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-600",
  },
  gray: {
    wrap: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  red: {
    wrap: "bg-red-50 text-red-800",
    dot: "bg-red-500",
  },
};

export default function TorneoCard({ torneo }: { torneo: TorneoResumen }) {
  const max = torneo.numMaxParticipantes ?? 0;
  const ins =
    torneo.numInscritos ??
    torneo._count?.equipos ??
    0;
  const pct = max > 0 ? Math.min(100, Math.round((ins / max) * 100)) : 0;

  const b = badgeInfo(torneo);
  const bs = badgeStyles[b.variant];
  const inscripcionesAbiertas = torneo.estado === "inscripciones_abiertas";
  const cupoLleno = max > 0 && ins >= max;
  const mostrarInscribirse = inscripcionesAbiertas && !cupoLleno;

  return (
    <article className="rounded-2xl border border-[#cfc4c5] bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#cfc4c5] bg-[#eeeeee] text-xl font-bold text-[#1b1b1b]">
            {inicialesTipo(torneo.tipoVideojuego?.nombre)}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bs.wrap}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${bs.dot} ${b.pulse ? "animate-pulse" : ""}`}
                  />
                  {b.label}
                </span>
                {b.sub ? (
                  <span className="text-sm text-[#5c5f60]">• {b.sub}</span>
                ) : null}
              </div>
              <h3 className="text-2xl font-bold leading-tight text-[#1b1b1b]">
                {torneo.nombre}
              </h3>
              <p className="mt-1 text-base text-[#5c5f60]">
                {subtituloLinea(torneo)}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5c5f60]">
                  Formato
                </span>
                <p className="mt-2 text-base font-semibold text-[#1b1b1b]">
                  {torneo.formato?.nombre ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5c5f60]">
                  Participantes
                </span>
                <div className="mt-2 flex max-w-xs items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-[#e8e8e8]">
                    <div
                      className="h-2 rounded-full bg-black transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-base font-bold text-[#1b1b1b]">
                    {ins}/{max || "—"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#5c5f60]">
                  equipos inscritos / cupo del bracket
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-md lg:flex-col xl:flex-row">
          <Link
            to={`/torneos/${torneo.idTorneo}/bracket`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-black px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Consultar
          </Link>
          {mostrarInscribirse ? (
            <Link
              to={`/torneos/${torneo.idTorneo}/equipos`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-black px-6 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#f3f3f3]"
            >
              Inscribirse
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
