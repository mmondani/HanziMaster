import { card } from '@/test/fixtures';
import { stripFromFlashcard } from './cascades';

describe('MJ7 · cascada de tags renombrados', () => {
  it('MJ7-5 renombra el tag de la flashcard conservando el resto y sin duplicados', () => {
    const c = card('c1', 'zh', { tags: ['Saludos', 'Escuela'] });
    expect(stripFromFlashcard(c, [], [], [{ from: 'Saludos', to: 'Hola' }])!.tags).toEqual(['Hola', 'Escuela']);
    expect(stripFromFlashcard(c, [], [], [{ from: 'Saludos', to: 'Escuela' }])!.tags).toEqual(['Escuela']);
  });

  it('los renombrados se resuelven a partir de los nombres originales (un intercambio no se pisa)', () => {
    const c = card('c1', 'zh', { tags: ['A', 'B'] });
    const swap = [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }];
    expect(stripFromFlashcard(c, [], [], swap)!.tags).toEqual(['B', 'A']);
  });

  it('sin cambios aplicables devuelve null y quitar sigue funcionando', () => {
    const c = card('c1', 'zh', { tags: ['Saludos'] });
    expect(stripFromFlashcard(c, [], [], [{ from: 'Otro', to: 'X' }])).toBeNull();
    expect(stripFromFlashcard(c, [], ['Saludos'])!.tags).toEqual([]);
  });
});
