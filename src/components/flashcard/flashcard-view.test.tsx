import { render, screen, within } from '@testing-library/react';
import { ToastProvider } from '@/components/ui/toast-provider';
import { chinese } from '@/test/fixtures';
import type { Language, Layout } from '@/lib/types';
import { FlashcardView } from './flashcard-view';

function withSynonyms(): { language: Language; layout: Layout } {
  const base = chinese();
  const language: Language = {
    ...base,
    fields: [...base.fields, { id: 'sinonimos', name: 'Sinónimos', type: 'list', tts: false, required: false, order: 9 }],
  };
  const layout: Layout = {
    id: 'ly3',
    name: 'Con sinónimos',
    items: [
      { fieldId: 'word', col: 1, row: 1, colSpan: 6, rowSpan: 2, textSize: 'L', align: 'center' },
      { fieldId: 'sinonimos', col: 1, row: 3, colSpan: 6, rowSpan: 3, textSize: 'M', align: 'left' },
    ],
  };
  return { language, layout };
}

describe('MJ5 · Campos de lista en los layouts', () => {
  it('MJ5-1 un campo de lista muestra cada elemento en su propia línea, uno debajo del otro', () => {
    const { language, layout } = withSynonyms();
    const { container } = render(
      <ToastProvider><FlashcardView language={language} layout={layout} card={{ values: { word: '你好', sinonimos: ['您好', '嗨', '哈喽'] }, tags: [] }} /></ToastProvider>,
    );
    const cell = container.querySelector('[data-field="sinonimos"]') as HTMLElement;
    const items = within(cell).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(['您好', '嗨', '哈喽']);
    expect(cell).not.toHaveTextContent('您好, 嗨');
    expect(getComputedStyle(within(cell).getByRole('list')).flexDirection).toBe('column');
  });

  it('MJ5-2 una lista vacía no dibuja nada y los campos de texto siguen en una línea', () => {
    const { language, layout } = withSynonyms();
    const { container } = render(
      <ToastProvider><FlashcardView language={language} layout={layout} card={{ values: { word: '你好', sinonimos: [] }, tags: [] }} /></ToastProvider>,
    );
    expect(container.querySelector('[data-field="sinonimos"]')).toBeNull();
    expect(screen.getByText('你好')).toBeInTheDocument();
  });
});
