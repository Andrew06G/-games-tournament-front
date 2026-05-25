import { describe, expect, it } from 'vitest';
import type { AuthUser } from '../context/AuthContext';
import {
  userCanManageTorneo,
  userCanRegistrarResultadosAmpliado,
  userIsLiderEnTorneo,
} from './torneoPermissions';

const organizadorUser: AuthUser = {
  idUsuario: 10,
  nombre: 'Org',
  nickname: null,
  email: 'org@test.com',
  telefono: null,
  estado: 'activo',
  globalRoles: ['organizador'],
  rolesAsignados: [],
};

const liderUser: AuthUser = {
  idUsuario: 20,
  nombre: 'Leader',
  nickname: 'cap',
  email: 'lider@test.com',
  telefono: null,
  estado: 'activo',
  globalRoles: ['lider_equipo'],
  rolesAsignados: [],
};

const jugadorUser: AuthUser = {
  idUsuario: 30,
  nombre: 'Player',
  nickname: null,
  email: 'player@test.com',
  telefono: null,
  estado: 'activo',
  globalRoles: ['jugador'],
  rolesAsignados: [],
};

describe('userCanManageTorneo', () => {
  it('returns false when user or tournament is missing', () => {
    expect(userCanManageTorneo(null, { idOrganizador: 1 })).toBe(false);
    expect(userCanManageTorneo(organizadorUser, null)).toBe(false);
    expect(userCanManageTorneo(null, null)).toBe(false);
  });

  it('returns true for users with the global organizador role', () => {
    expect(
      userCanManageTorneo(organizadorUser, { idOrganizador: 999 }),
    ).toBe(true);
  });

  it('returns true when the user is the tournament organizer by id', () => {
    expect(
      userCanManageTorneo(jugadorUser, {
        idOrganizador: jugadorUser.idUsuario,
      }),
    ).toBe(true);
    expect(
      userCanManageTorneo(jugadorUser, {
        organizador: { idUsuario: jugadorUser.idUsuario },
      }),
    ).toBe(true);
  });

  it('returns false for unrelated users', () => {
    expect(
      userCanManageTorneo(jugadorUser, { idOrganizador: 99 }),
    ).toBe(false);
  });
});

describe('userIsLiderEnTorneo', () => {
  it('returns false without lider_equipo role or teams', () => {
    expect(userIsLiderEnTorneo(jugadorUser, [])).toBe(false);
    expect(userIsLiderEnTorneo(liderUser, undefined)).toBe(false);
  });

  it('returns true when the user appears in a team roster', () => {
    expect(
      userIsLiderEnTorneo(liderUser, [
        { jugadores: [{ idUsuario: 99 }, { idUsuario: liderUser.idUsuario }] },
      ]),
    ).toBe(true);
  });

  it('returns false when the user is not on any team', () => {
    expect(
      userIsLiderEnTorneo(liderUser, [
        { jugadores: [{ idUsuario: 1 }, { idUsuario: 2 }] },
      ]),
    ).toBe(false);
  });
});

describe('userCanRegistrarResultadosAmpliado', () => {
  const torneo = { idOrganizador: 99 };
  const equipos = [{ jugadores: [{ idUsuario: liderUser.idUsuario }] }];

  it('allows tournament managers', () => {
    expect(
      userCanRegistrarResultadosAmpliado(organizadorUser, torneo, equipos),
    ).toBe(true);
  });

  it('allows team leaders registered in the tournament', () => {
    expect(
      userCanRegistrarResultadosAmpliado(liderUser, torneo, equipos),
    ).toBe(true);
  });

  it('denies plain players who neither manage nor lead', () => {
    expect(
      userCanRegistrarResultadosAmpliado(jugadorUser, torneo, equipos),
    ).toBe(false);
  });
});
