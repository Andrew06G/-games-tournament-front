import type { AuthUser } from "../context/AuthContext";

type TorneoConOrganizador = {
  organizador?: { idUsuario: number } | null;
  idOrganizador?: number;
};

type EquipoConJugadores = {
  jugadores: { idUsuario: number | null }[];
};

export function userCanManageTorneo(
  user: AuthUser | null,
  torneo: TorneoConOrganizador | null | undefined,
): boolean {
  if (!user || !torneo) return false;
  if (user.globalRoles.includes("organizador")) return true;
  if (torneo.organizador?.idUsuario === user.idUsuario) return true;
  if (torneo.idOrganizador === user.idUsuario) return true;
  return false;
}

export function userIsLiderEnTorneo(
  user: AuthUser | null,
  equipos: EquipoConJugadores[] | undefined,
): boolean {
  if (!user?.globalRoles.includes("lider_equipo") || !equipos?.length) {
    return false;
  }
  return equipos.some((eq) =>
    eq.jugadores.some(
      (j) => j.idUsuario != null && j.idUsuario === user.idUsuario,
    ),
  );
}

export function userCanRegistrarResultadosAmpliado(
  user: AuthUser | null,
  torneo: TorneoConOrganizador | null | undefined,
  equipos: EquipoConJugadores[] | undefined,
): boolean {
  return (
    userCanManageTorneo(user, torneo) || userIsLiderEnTorneo(user, equipos)
  );
}
