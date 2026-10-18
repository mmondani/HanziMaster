import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DRAW_LAYOUT_ID } from '@/lib/domain/handwriting';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded(code = 'zh-CN') {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese({ code })];
  repos.flashcardsData = [card('c1', 'zh')];
  repos.decksData = [deck('d1', 'zh', { cardIds: ['c1'] })];
  return repos;
}

const layoutNames = (select: HTMLElement) => within(select).getAllByRole('option').map((o) => o.textContent);

async function openNewModeDialog(code: string) {
  const repos = seeded(code);
  renderApp('/mazos/d1/editar', signedInService(), repos);
  const modes = within(await screen.findByRole('region', { name: 'Modos de recorrida' }));
  await userEvent.click(modes.getByRole('button', { name: /Agregar modo/ }));
  return { repos, dialog: within(screen.getByRole('dialog', { name: 'Nuevo modo de recorrida' })) };
}

describe('E1 · Layout Dibujar en el selector de los modos de recorrida', () => {
  it('en chino, Dibujar es una opción más tanto para el frente como para el reverso', async () => {
    const { dialog } = await openNewModeDialog('zh-CN');
    for (const label of [/Layout del frente/, /Layout del reverso/]) {
      expect(layoutNames(dialog.getByLabelText(label))).toEqual(['Elige un layout…', 'Palabra y pinyin', 'Solo traducción', 'Dibujar']);
    }
  });

  it('en japonés también aparece', async () => {
    const { dialog } = await openNewModeDialog('ja-JP');
    expect(layoutNames(dialog.getByLabelText(/Layout del reverso/))).toContain('Dibujar');
  });

  it('en otros idiomas no aparece', async () => {
    const { dialog } = await openNewModeDialog('en-US');
    expect(layoutNames(dialog.getByLabelText(/Layout del frente/))).not.toContain('Dibujar');
    expect(layoutNames(dialog.getByLabelText(/Layout del reverso/))).not.toContain('Dibujar');
  });

  it('un modo nuevo no propone Dibujar por defecto', async () => {
    const { dialog } = await openNewModeDialog('zh-CN');
    expect(dialog.getByLabelText(/Layout del frente/)).toHaveDisplayValue('Palabra y pinyin');
    expect(dialog.getByLabelText(/Layout del reverso/)).toHaveDisplayValue('Solo traducción');
  });

  it('se guarda un modo con Dibujar en el mazo', async () => {
    const { repos, dialog } = await openNewModeDialog('zh-CN');
    await userEvent.type(dialog.getByLabelText(/Nombre del modo/), 'Escribir');
    await userEvent.selectOptions(dialog.getByLabelText(/Layout del frente/), 'Solo traducción');
    await userEvent.selectOptions(dialog.getByLabelText(/Layout del reverso/), 'Dibujar');
    await userEvent.click(dialog.getByRole('button', { name: 'Agregar modo' }));
    expect(screen.getByText('Frente: Solo traducción · Reverso: Dibujar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar mazo' }));
    await waitFor(() => expect(repos.decksData[0].modes).toHaveLength(2));
    expect(repos.decksData[0].modes[1]).toMatchObject({ name: 'Escribir', frontLayoutId: 'ly2', backLayoutId: DRAW_LAYOUT_ID });
  });

  it('los modos por defecto del idioma también ofrecen Dibujar', async () => {
    renderApp('/idiomas/zh?tab=recorridas', signedInService(), seeded());
    const panel = within(await screen.findByRole('region', { name: 'Modos de recorrida por defecto' }));
    await userEvent.click(panel.getByRole('button', { name: 'Agregar modo' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Nuevo modo de recorrida' }));
    expect(layoutNames(dialog.getByLabelText(/Layout del frente/))).toContain('Dibujar');
  });
});
