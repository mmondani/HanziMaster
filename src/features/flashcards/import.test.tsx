import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addField } from '@/lib/domain/field-rules';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const base = chinese({ tags: ['Saludos', 'HSK1'] });
  const repos = new MemoryRepositories();
  repos.languagesData = [{ ...base, fields: addField(base.fields, { id: 'nivel', name: 'Nivel', type: 'number', tts: false, required: false, order: 9 }) }];
  repos.flashcardsData = [card('c1', 'zh', { values: { word: '你好', translation: 'hola' } })];
  return repos;
}

const HEADER = 'Palabra,Pinyin,Traducción,Tags,Nivel';
const GOOD = [
  HEADER,
  '谢谢,xièxie,gracias,Saludos;Viajes,1',
  '再见,zàijiàn,adiós,HSK1,',
  '医院,yīyuàn,,Lugares,',
  '你好,nǐ hǎo,hola,,',
].join('\n');

const csv = (content: string, name = 'cartas.csv') => new File([content], name, { type: 'text/csv' });

async function openImport(repos = seeded()) {
  const view = renderApp('/flashcards/importar', signedInService(), repos);
  await screen.findByRole('heading', { name: 'Selecciona el archivo CSV' });
  return { ...view, repos };
}

async function upload(file: File) {
  await userEvent.upload(screen.getByLabelText('Archivo CSV'), file);
}

function captureDownloads() {
  const blobs: Blob[] = [];
  const names: string[] = [];
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: (b: Blob) => { blobs.push(b); return 'blob:x'; } });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
  return { blobs, names, click };
}

afterEach(() => vi.restoreAllMocks());

describe('F05 · Importar CSV', () => {
  it('F05-1 se puede elegir un CSV con el selector de archivos', async () => {
    await openImport();
    await upload(csv(GOOD));
    expect(await screen.findByRole('heading', { name: 'Revisa antes de importar' })).toBeInTheDocument();
    expect(screen.getByText('Archivo: cartas.csv')).toBeInTheDocument();
  });

  it('F05-1 se puede arrastrar un CSV', async () => {
    await openImport();
    const zone = document.querySelector('.dropzone')!;
    fireEvent.drop(zone, { dataTransfer: { files: [csv(GOOD)] } });
    expect(await screen.findByRole('heading', { name: 'Revisa antes de importar' })).toBeInTheDocument();
  });

  it('rechaza un archivo que no es .csv', async () => {
    await openImport();
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), new File(['x'], 'cartas.txt', { type: 'text/plain' }), { applyAccept: false });
    expect(await screen.findByRole('alert')).toHaveTextContent('El archivo debe ser un .csv.');
  });

  it('F05-2 las columnas esperadas salen de los campos del idioma y se descarga una plantilla', async () => {
    await openImport();
    const table = within(screen.getByRole('table'));
    expect(table.getAllByRole('row').slice(1).map((r) => r.querySelector('code')?.textContent)).toEqual(['Palabra', 'Pinyin', 'Traducción', 'Tags', 'Nivel']);
    expect(within(table.getByText('Traducción').closest('tr')!).getByText('Sí')).toBeInTheDocument();
    expect(within(table.getByText('Pinyin').closest('tr')!).getByText('No')).toBeInTheDocument();

    const dl = captureDownloads();
    await userEvent.click(screen.getByRole('button', { name: /Descargar plantilla CSV/ }));
    expect(dl.names).toEqual(['plantilla-chino-mandarín.csv']);
    expect(await dl.blobs[0].text()).toContain('Palabra,Pinyin,Traducción,Tags,Nivel');
  });

  it('F05-3 antes de importar muestra filas válidas y con problemas, con los motivos', async () => {
    await openImport();
    await upload(csv(GOOD));
    expect(await screen.findByText('2 filas válidas')).toBeInTheDocument();
    expect(screen.getByText('2 filas con problemas').closest('.alert')).toHaveTextContent('fila 3 (falta traducción) y fila 4 (palabra duplicada)');
    const table = within(screen.getByRole('table', { name: 'Vista previa de filas' }));
    expect(table.getAllByRole('row')).toHaveLength(5);
    expect(table.getByText('Falta Traducción')).toBeInTheDocument();
    expect(table.getByText('Duplicada')).toBeInTheDocument();
    expect(table.getAllByText('OK')).toHaveLength(2);
    expect(screen.getByText('Mostrando 4 de 4 filas.')).toBeInTheDocument();
  });

  it('F05-4 / F05-5 / F05-7 importa solo las filas válidas, crea los tags nuevos y muestra el resultado', async () => {
    const { repos, router } = await openImport();
    await upload(csv(GOOD));
    expect(await screen.findByText(/Se crearán 1 tag nuevo: Viajes/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Importar 2 flashcards' }));

    expect(await screen.findByRole('heading', { name: 'Se importaron 2 flashcards' })).toBeInTheDocument();
    expect(screen.getByText('Se creó 1 tag nuevo (Viajes). Se omitieron 2 filas con problemas.')).toBeInTheDocument();
    expect(repos.flashcardsData).toHaveLength(3);
    const imported = repos.flashcardsData.filter((c) => c.id !== 'c1');
    expect(imported.map((c) => c.values.word).sort()).toEqual(['再见', '谢谢']);
    expect(imported.find((c) => c.values.word === '谢谢')).toMatchObject({ languageId: 'zh', tags: ['Saludos', 'Viajes'], values: { translation: 'gracias', pinyin: 'xièxie', nivel: 1 } });
    expect(repos.languagesData[0].tags).toEqual(['Saludos', 'HSK1', 'Viajes']);

    await userEvent.click(screen.getByRole('link', { name: 'Ver flashcards' }));
    expect(router.state.location.pathname).toBe('/flashcards');
  });

  it('F05-4 las filas omitidas se pueden descargar con el motivo', async () => {
    await openImport();
    await upload(csv(GOOD));
    await userEvent.click(await screen.findByRole('button', { name: 'Importar 2 flashcards' }));
    const dl = captureDownloads();
    await userEvent.click(await screen.findByRole('button', { name: /Descargar filas omitidas/ }));
    expect(dl.names).toEqual(['filas-omitidas.csv']);
    const text = await dl.blobs[0].text();
    expect(text).toContain('Palabra,Pinyin,Traducción,Tags,Nivel,Motivo');
    expect(text).toContain('医院,yīyuàn,,Lugares,,Falta Traducción');
    expect(text).toContain('你好,nǐ hǎo,hola,,,Palabra duplicada');
  });

  it('F05-6 un archivo sin las columnas obligatorias se rechaza indicando cuál falta', async () => {
    await openImport();
    await upload(csv('Palabra,Pinyin\n你好,nǐ hǎo'));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudo leer el archivo.');
    expect(alert).toHaveTextContent('Falta la columna obligatoria «Traducción»');
    expect(screen.getByRole('heading', { name: 'Selecciona el archivo CSV' })).toBeInTheDocument();
  });

  it('F05-8 el encabezado se interpreta por nombre de campo y se avisa de las columnas ignoradas', async () => {
    await openImport();
    await upload(csv('palabra,TRADUCCION,Color\n谢谢,gracias,rojo'));
    expect(await screen.findByText('1 fila válida')).toBeInTheDocument();
    expect(screen.getByText(/Se ignoran las columnas.*Color/)).toBeInTheDocument();
  });

  it('F05-9 las palabras que ya existen no se agregan ni modifican las existentes', async () => {
    const { repos } = await openImport();
    await upload(csv('Palabra,Traducción\n你好,saludo nuevo\n谢谢,gracias'));
    expect(await screen.findByText('1 fila válida')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Importar 1 flashcard' }));
    await screen.findByRole('heading', { name: 'Se importó 1 flashcard' });
    expect(repos.flashcardsData).toHaveLength(2);
    expect(repos.flashcardsData.find((c) => c.id === 'c1')!.values.translation).toBe('hola');
  });

  it('sin filas válidas no se puede importar', async () => {
    await openImport();
    await upload(csv('Palabra,Traducción\n你好,hola'));
    expect(await screen.findByText('No hay filas válidas para importar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar 0 flashcards' })).toBeDisabled();
  });

  it('se puede volver a elegir otro archivo desde la revisión', async () => {
    await openImport();
    await upload(csv(GOOD));
    await userEvent.click(await screen.findByRole('button', { name: 'Elegir otro archivo' }));
    expect(screen.getByRole('heading', { name: 'Selecciona el archivo CSV' })).toBeInTheDocument();
  });

  it('el indicador de pasos marca el paso actual', async () => {
    await openImport();
    const current = () => document.querySelector('[aria-current="step"]')?.textContent;
    expect(current()).toContain('Archivo');
    await upload(csv(GOOD));
    await waitFor(() => expect(current()).toContain('Revisar'));
  });
});

describe('F01 · accesos a Importar CSV', () => {
  it('el listado ofrece Importar CSV y lleva a la pantalla', async () => {
    const { router } = renderApp('/flashcards', signedInService(), seeded());
    await screen.findByRole('link', { name: /你好/ });
    await userEvent.click(screen.getAllByRole('link', { name: /Importar CSV/ })[0]);
    expect(router.state.location.pathname).toBe('/flashcards/importar');
  });

  it('F01-6 el estado vacío ofrece crear e importar', async () => {
    const repos = seeded();
    repos.flashcardsData = [];
    renderApp('/flashcards', signedInService(), repos);
    expect(await screen.findByText('Todavía no hay flashcards en Chino mandarín')).toBeInTheDocument();
    const main = within(screen.getByRole('main'));
    expect(main.getAllByRole('link', { name: /Nueva flashcard/ }).length).toBeGreaterThan(0);
    expect(main.getAllByRole('link', { name: /Importar CSV/ }).length).toBeGreaterThan(0);
  });
});
