import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  const { user } = useAuth();
  const puedeValidar =
    user &&
    (user.globalRoles.includes("organizador") ||
      torneo.organizador?.idUsuario === user.idUsuario);

  const max = torneo.numMaxParticipantes ?? 0;
  const ins =
    torneo.numInscritos ??
    torneo._count?.equipos ??
    0;
  const pct = max > 0 ? Math.min(100, Math.round((ins / max) * 100)) : 0;

  const b = badgeInfo(torneo);
  const bs = badgeStyles[b.variant];
  const inscripcionesAbiertas = torneo.estado === "inscripciones_abiertas";

  return (
    <article className="flex flex-col items-center gap-6 rounded-xl border border-[#cfc4c5] bg-white p-6 transition-shadow hover:shadow-sm md:flex-row md:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#cfc4c5] bg-[#eeeeee] text-lg font-bold text-[#1b1b1b]">
        {inicialesTipo(torneo.tipoVideojuego?.nombre)}
      </div>

      <div className="grid w-full flex-grow grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${bs.wrap}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${bs.dot} ${b.pulse ? "animate-pulse" : ""}`}
              />
              {b.label}
            </span>
            {b.sub ? (
              <span className="text-xs text-[#5c5f60]">• {b.sub}</span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold text-[#1b1b1b]">{torneo.nombre}</h3>
          <p className="mt-0.5 text-sm text-[#5c5f60]">{subtituloLinea(torneo)}</p>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#5c5f60]">
            Formato
          </span>
          <span className="mt-1 text-sm font-semibold text-[#1b1b1b]">
            {torneo.formato?.nombre ?? "—"}
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs font-medium uppercase tracking-wider text-[#5c5f60]">
            Participantes
          </span>
          <div className="mt-2 flex max-w-[140px] items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[#e8e8e8]">
              <div
                className="h-1.5 rounded-full bg-black transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-semibold text-[#1b1b1b]">
              {ins}/{max || "—"}
            </span>
          </div>
          <span className="mt-1 text-xs text-[#5c5f60]">equipos inscritos / cupo</span>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
        <Link
          to={`/torneos/${torneo.idTorneo}/bracket`}
          className="inline-flex justify-center rounded-lg bg-black px-6 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ver Brackets
        </Link>
        {inscripcionesAbiertas ? (
          <Link
            to={`/torneos/${torneo.idTorneo}/equipos`}
            className="inline-flex justify-center rounded-lg border border-black px-6 py-2.5 text-center text-sm font-semibold text-black transition-colors hover:bg-[#f3f3f3]"
          >
            Inscribirse
          </Link>
        ) : null}
        {user ? (
          <Link
            to={`/torneos/${torneo.idTorneo}/registrar-resultado`}
            className="inline-flex justify-center rounded-lg border border-[#cfc4c5] px-4 py-2 text-center text-xs font-semibold text-[#5c5f60] hover:bg-[#f9f9f9]"
          >
            Resultado
          </Link>
        ) : null}
        {puedeValidar ? (
          <Link
            to={`/torneos/${torneo.idTorneo}/validar-resultados`}
            className="inline-flex justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Validar
          </Link>
        ) : null}
      </div>
    </article>
  );
}
