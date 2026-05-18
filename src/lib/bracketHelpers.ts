/** Equipos ya ubicados en algún cupo del bracket. */
export function idsEquiposEnBracket(
  enfrentamientos: {
    idEquipo1: number | null;
    idEquipo2: number | null;
  }[],
): Set<number> {
  const ids = new Set<number>();
  for (const e of enfrentamientos) {
    if (e.idEquipo1 != null) ids.add(e.idEquipo1);
    if (e.idEquipo2 != null) ids.add(e.idEquipo2);
  }
  return ids;
}

export function equiposDisponiblesParaBracket<
  T extends { idEquipo: number; nombreEquipo: string },
>(
  equipos: T[],
  enfrentamientos: { idEquipo1: number | null; idEquipo2: number | null }[],
  excluirIds: number[] = [],
): T[] {
  const ocupados = idsEquiposEnBracket(enfrentamientos);
  const excluir = new Set(excluirIds);
  return equipos.filter(
    (eq) => !ocupados.has(eq.idEquipo) && !excluir.has(eq.idEquipo),
  );
}

/** Hay al menos un enfrentamiento con ambos cupos libres (fase inicial). */
export function puedeCrearEnfrentamientoEnBracket(
  enfrentamientos: { idEquipo1: number | null; idEquipo2: number | null }[],
): boolean {
  return enfrentamientos.some(
    (e) => e.idEquipo1 === null && e.idEquipo2 === null,
  );
}

export function torneoBloqueaPartidas(estado: string | null | undefined): boolean {
  return estado === "finalizado" || estado === "cancelado";
}

export function enfrentamientoTieneResultadoValidado(
  resultados: { validado: boolean | null }[],
): boolean {
  return resultados.some((r) => r.validado === true);
}

type EnfPartida = {
  idEquipo1: number | null;
  idEquipo2: number | null;
  estado: string | null;
  resultados: { validado: boolean | null }[];
};

export function enfrentamientoAceptaRegistro(e: EnfPartida): boolean {
  if (!e.idEquipo1 || !e.idEquipo2) return false;
  if (e.estado === "finalizado" || e.estado === "cancelado") return false;
  if (enfrentamientoTieneResultadoValidado(e.resultados)) return false;
  return true;
}

export function torneoTieneEnfrentamientosParaRegistrar(
  enfrentamientos: EnfPartida[],
): boolean {
  return enfrentamientos.some(enfrentamientoAceptaRegistro);
}

export function torneoTieneResultadosPendientesValidacion(
  enfrentamientos: {
    estado: string | null;
    resultados: { validado: boolean | null }[];
  }[],
): boolean {
  return enfrentamientos.some(
    (e) =>
      e.resultados[0]?.validado === false &&
      e.estado === "esperando_validacion",
  );
}
