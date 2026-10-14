import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { card, chinese } from '@/test/fixtures';
import { FlashcardRow } from './flashcard-row';

const language = chinese();
const pinyin = language.fields.find((f) => f.id === 'pinyin');

function renderRow(secondary?: typeof pinyin) {
  const { container } = render(
    <MemoryRouter>
      <FlashcardRow card={card('c1', 'zh', { values: { word: '你好', translation: 'hola', pinyin: 'nǐ hǎo' }, tags: ['Saludos'] })} language={language} secondary={secondary} />
    </MemoryRouter>,
  );
  return container.querySelector('.card-row') as HTMLElement;
}

describe('MJ8 · Fila de flashcard compacta en mobile', () => {
  it('MJ8-1 con campo secundario, la traducción queda en la línea que se ve en mobile y el secundario se marca para ocultarse', () => {
    const row = renderRow(pinyin);
    expect(row.querySelector('.lead')).toHaveTextContent('你好');
    expect(row.querySelector('.meta .t.is-secondary')).toHaveTextContent('nǐ hǎo');
    expect(row.querySelector('.meta .s')).toHaveTextContent('hola');
  });

  it('MJ8-2 sin campo secundario, la traducción es la línea principal y no se oculta', () => {
    const row = renderRow(undefined);
    expect(row.querySelector('.meta .t')).toHaveTextContent('hola');
    expect(row.querySelector('.meta .t.is-secondary')).toBeNull();
  });

  it('MJ8-3 los tags de la versión mobile están en un bloque aparte que el CSS oculta', () => {
    const row = renderRow(pinyin);
    expect(row.querySelector('.meta .m-tags')).toHaveTextContent('Saludos');
  });
});
