import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/testUtils';
import TorneoCard, { type TorneoResumen } from './TorneoCard';

function buildTorneo(overrides: Partial<TorneoResumen> = {}): TorneoResumen {
  return {
    idTorneo: 42,
    nombre: 'Spring Cup',
    estado: 'inscripciones_abiertas',
    fechaInicio: '2026-06-15',
    numMaxParticipantes: 8,
    numInscritos: 2,
    tipoVideojuego: { nombre: 'Valorant' },
    formato: { nombre: 'Single elimination' },
    ...overrides,
  };
}

describe('TorneoCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-24T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders tournament name, game type initials, and subtitle', () => {
    renderWithProviders(<TorneoCard torneo={buildTorneo()} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Spring Cup',
    );
    expect(screen.getByText('VA')).toBeInTheDocument();
    expect(
      screen.getByText('Valorant · Single elimination'),
    ).toBeInTheDocument();
  });

  it('links to bracket and enrollment when inscriptions are open with capacity', () => {
    renderWithProviders(<TorneoCard torneo={buildTorneo()} />);
    expect(screen.getByRole('link', { name: /consultar/i })).toHaveAttribute(
      'href',
      '/torneos/42/bracket',
    );
    expect(screen.getByRole('link', { name: /inscribirse/i })).toHaveAttribute(
      'href',
      '/torneos/42/equipos',
    );
  });

  it('hides enroll link when the tournament is full', () => {
    renderWithProviders(
      <TorneoCard
        torneo={buildTorneo({ numInscritos: 8, _count: { equipos: 8 } })}
      />,
    );
    expect(screen.queryByRole('link', { name: /inscribirse/i })).toBeNull();
    expect(screen.getByText(/cupo completo/i)).toBeInTheDocument();
  });

  it('hides enroll link when estado is not inscripciones_abiertas', () => {
    renderWithProviders(
      <TorneoCard torneo={buildTorneo({ estado: 'en_curso' })} />,
    );
    expect(screen.queryByRole('link', { name: /inscribirse/i })).toBeNull();
    expect(screen.getByText('En curso')).toBeInTheDocument();
  });

  it('shows finalized badge without relative start text', () => {
    renderWithProviders(
      <TorneoCard torneo={buildTorneo({ estado: 'finalizado' })} />,
    );
    expect(screen.getByText('Finalizado')).toBeInTheDocument();
    expect(screen.queryByText(/empieza/i)).toBeNull();
  });

  it('shows cancelled badge', () => {
    renderWithProviders(
      <TorneoCard torneo={buildTorneo({ estado: 'cancelado' })} />,
    );
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('shows relative start label for upcoming tournaments', () => {
    renderWithProviders(<TorneoCard torneo={buildTorneo()} />);
    expect(screen.getByText(/empieza en 22 días/i)).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('renders enrollment progress from numInscritos and max', () => {
    renderWithProviders(<TorneoCard torneo={buildTorneo()} />);
    const bar = screen.getByRole('progressbar', {
      name: /2 de 8 equipos inscritos/i,
    });
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(screen.getByText('2 / 8')).toBeInTheDocument();
    expect(screen.getByText('25% del cupo del bracket ocupado')).toBeInTheDocument();
  });

  it('uses _count.equipos when numInscritos is omitted', () => {
    renderWithProviders(
      <TorneoCard
        torneo={buildTorneo({
          numInscritos: undefined,
          _count: { equipos: 4 },
        })}
      />,
    );
    expect(screen.getByText('4 / 8')).toBeInTheDocument();
  });

  it('shows no limit message when max participants is zero', () => {
    renderWithProviders(
      <TorneoCard
        torneo={buildTorneo({
          numMaxParticipantes: 0,
          numInscritos: 3,
        })}
      />,
    );
    expect(screen.getByText(/sin límite de cupo definido/i)).toBeInTheDocument();
    expect(screen.getByText('3 / —')).toBeInTheDocument();
  });

});
