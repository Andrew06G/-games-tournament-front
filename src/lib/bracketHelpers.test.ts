import { describe, expect, it } from 'vitest';
import {
  enfrentamientoAceptaRegistro,
  enfrentamientoTieneResultadoValidado,
  equiposDisponiblesParaBracket,
  idsEquiposEnBracket,
  puedeCrearEnfrentamientoEnBracket,
  torneoBloqueaPartidas,
  torneoTieneEnfrentamientosParaRegistrar,
  torneoTieneResultadosPendientesValidacion,
} from './bracketHelpers';

describe('idsEquiposEnBracket', () => {
  it('returns an empty set when there are no matches', () => {
    expect(idsEquiposEnBracket([])).toEqual(new Set());
  });

  it('collects both team ids from all matches', () => {
    const ids = idsEquiposEnBracket([
      { idEquipo1: 1, idEquipo2: 2 },
      { idEquipo1: 3, idEquipo2: null },
    ]);
    expect(ids).toEqual(new Set([1, 2, 3]));
  });

  it('ignores null slots', () => {
    const ids = idsEquiposEnBracket([{ idEquipo1: null, idEquipo2: null }]);
    expect(ids.size).toBe(0);
  });
});

describe('equiposDisponiblesParaBracket', () => {
  const equipos = [
    { idEquipo: 1, nombreEquipo: 'Alpha' },
    { idEquipo: 2, nombreEquipo: 'Beta' },
    { idEquipo: 3, nombreEquipo: 'Gamma' },
  ];

  it('filters out teams already assigned in the bracket', () => {
    const enfrentamientos = [{ idEquipo1: 1, idEquipo2: 2 }];
    expect(equiposDisponiblesParaBracket(equipos, enfrentamientos)).toEqual([
      { idEquipo: 3, nombreEquipo: 'Gamma' },
    ]);
  });

  it('also excludes ids passed in excluirIds', () => {
    const result = equiposDisponiblesParaBracket(equipos, [], [3]);
    expect(result.map((e) => e.idEquipo)).toEqual([1, 2]);
  });
});

describe('puedeCrearEnfrentamientoEnBracket', () => {
  it('returns true when at least one match has both slots empty', () => {
    expect(
      puedeCrearEnfrentamientoEnBracket([
        { idEquipo1: 1, idEquipo2: 2 },
        { idEquipo1: null, idEquipo2: null },
      ]),
    ).toBe(true);
  });

  it('returns false when every match has at least one team', () => {
    expect(
      puedeCrearEnfrentamientoEnBracket([
        { idEquipo1: 1, idEquipo2: null },
        { idEquipo1: null, idEquipo2: 2 },
      ]),
    ).toBe(false);
  });
});

describe('torneoBloqueaPartidas', () => {
  it.each([
    ['finalizado', true],
    ['cancelado', true],
    ['en_curso', false],
    ['inscripciones_abiertas', false],
    [null, false],
    [undefined, false],
  ] as const)('state %s → %s', (estado, expected) => {
    expect(torneoBloqueaPartidas(estado)).toBe(expected);
  });
});

describe('enfrentamientoTieneResultadoValidado', () => {
  it('returns true when any result has validado === true', () => {
    expect(
      enfrentamientoTieneResultadoValidado([
        { validado: false },
        { validado: true },
      ]),
    ).toBe(true);
  });

  it('returns false when no validated result exists', () => {
    expect(
      enfrentamientoTieneResultadoValidado([
        { validado: false },
        { validado: null },
      ]),
    ).toBe(false);
  });
});

describe('enfrentamientoAceptaRegistro', () => {
  const base = {
    idEquipo1: 1,
    idEquipo2: 2,
    estado: 'programado' as string | null,
    resultados: [] as { validado: boolean | null }[],
  };

  it('accepts a ready match with no validated score', () => {
    expect(enfrentamientoAceptaRegistro(base)).toBe(true);
  });

  it('rejects when either team slot is missing', () => {
    expect(
      enfrentamientoAceptaRegistro({ ...base, idEquipo2: null }),
    ).toBe(false);
  });

  it('rejects finished or cancelled matches', () => {
    expect(
      enfrentamientoAceptaRegistro({ ...base, estado: 'finalizado' }),
    ).toBe(false);
    expect(
      enfrentamientoAceptaRegistro({ ...base, estado: 'cancelado' }),
    ).toBe(false);
  });

  it('rejects when a validated result already exists', () => {
    expect(
      enfrentamientoAceptaRegistro({
        ...base,
        resultados: [{ validado: true }],
      }),
    ).toBe(false);
  });
});

describe('torneoTieneEnfrentamientosParaRegistrar', () => {
  it('returns true if any match accepts registration', () => {
    expect(
      torneoTieneEnfrentamientosParaRegistrar([
        {
          idEquipo1: null,
          idEquipo2: 2,
          estado: 'programado',
          resultados: [],
        },
        {
          idEquipo1: 1,
          idEquipo2: 2,
          estado: 'programado',
          resultados: [],
        },
      ]),
    ).toBe(true);
  });

  it('returns false when no match is eligible', () => {
    expect(torneoTieneEnfrentamientosParaRegistrar([])).toBe(false);
  });
});

describe('torneoTieneResultadosPendientesValidacion', () => {
  it('detects matches awaiting validation with a rejected first result', () => {
    expect(
      torneoTieneResultadosPendientesValidacion([
        {
          estado: 'esperando_validacion',
          resultados: [{ validado: false }],
        },
      ]),
    ).toBe(true);
  });

  it('returns false when validation is not pending', () => {
    expect(
      torneoTieneResultadosPendientesValidacion([
        {
          estado: 'programado',
          resultados: [{ validado: false }],
        },
        {
          estado: 'esperando_validacion',
          resultados: [{ validado: true }],
        },
      ]),
    ).toBe(false);
  });
});
