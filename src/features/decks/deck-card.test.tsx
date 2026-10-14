import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { deck, MODE_A } from '@/test/fixtures';
import { DeckCard } from './deck-card';

function renderCard(status: Parameters<typeof DeckCard>[0]['status']) {
  const { container } = render(
    <MemoryRouter>
      <DeckCard deck={deck('d1', 'zh', { name: 'HSK 1', cardIds: ['c1', 'c2'], modes: [MODE_A] })} status={status} onStudy={() => {}} />
    </MemoryRouter>,
  );
  return container.querySelector('.deck-card') as HTMLElement;
}

describe('MJ9 · Tarjeta de mazo compacta en mobile', () => {
  it('MJ9-1 en una misma tarjeta están el nombre, el botón de configuración y el de estudiar, y el resto se marca para ocultarse', () => {
    const card = renderCard({ kind: 'ok' });
    // Hijos directos (o de .row, que en mobile pasa a display: contents) en el orden de la fila compacta.
    expect(within(card).getByRole('heading', { name: 'HSK 1' })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Ver detalle de HSK 1' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /Estudiar/ })).toBeEnabled();
    expect(card.querySelector('.deck-count')).toHaveTextContent('2 flashcards');
    expect(card.querySelector(':scope > .tags')).not.toBeNull();
    const order = Array.from(card.querySelectorAll('h2, a, button')).map((n) => n.tagName);
    expect(order).toEqual(['H2', 'A', 'BUTTON']);
  });

  it('MJ9-2 un mazo no disponible conserva un indicador mínimo y no se puede estudiar', () => {
    const card = renderCard({ kind: 'broken', modes: [MODE_A] });
    expect(card.querySelector('.deck-warn')).toHaveAttribute('aria-label', 'Mazo no disponible');
    expect(within(card).getByRole('button', { name: /Estudiar/ })).toBeDisabled();
    expect(screen.getByText('Mazo no disponible.')).toBeInTheDocument();
  });

  it('un mazo disponible no muestra el indicador', () => {
    expect(renderCard({ kind: 'ok' }).querySelector('.deck-warn')).toBeNull();
  });
});
