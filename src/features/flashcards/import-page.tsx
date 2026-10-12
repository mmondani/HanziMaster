import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, Download, FileText, Upload } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { UnsavedChangesGuard } from '@/components/ui/unsaved-changes-guard';
import {
  analyzeCsv, buildSkippedCsv, buildTemplate, describeSkipped, expectedColumns, toFlashcards,
  MAX_CSV_ROWS, type ParsedRow,
} from '@/lib/domain/csv-import';
import { sortFields } from '@/lib/domain/field-rules';
import { isCjk } from '@/lib/domain/flashcard-form';
import { downloadText } from '@/lib/download';
import { useFlashcards } from '@/lib/flashcards/flashcards-provider';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Language } from '@/lib/types';
import { RecordStatusView } from './record-status-view';
import { useFlashcardRecord } from './use-flashcard-record';

const STEPS = ['Archivo', 'Revisar', 'Listo'];
const PREVIEW_ROWS = 50;

type Review = { fileName: string; headers: string[]; ignored: string[]; rows: ParsedRow[]; valid: number; newTags: string[] };
type Result = { imported: number; skipped: number; newTags: string[]; skippedCsv: string };

/** F05 · Importar flashcards desde un CSV en tres pasos: archivo, revisión y resultado. */
export function ImportPage() {
  const record = useFlashcardRecord(undefined);
  if (record.status !== 'ready') return <RecordStatusView record={record} title="Importar flashcards" />;
  return <Importer language={record.language} />;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Importer({ language }: { language: Language }) {
  const repos = useRepositories();
  const { flashcards } = useFlashcards();
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const importingRef = useRef(false);
  const whenImporting = useCallback(() => importingRef.current, []);
  useEffect(() => { importingRef.current = importing; }, [importing]);

  const columns = useMemo(() => expectedColumns(language), [language]);
  const cjk = isCjk(language);
  const secondary = sortFields(language.fields).find((f) => !f.system && f.type === 'text');
  const existingWords = useMemo(
    () => (flashcards ?? []).filter((c) => c.languageId === language.id).map((c) => String(c.values.word ?? '')),
    [flashcards, language.id],
  );

  async function readFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { setError('El archivo debe ser un .csv.'); return; }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError('No se pudo leer el archivo. Inténtalo de nuevo.');
      return;
    }
    const analysis = analyzeCsv(language, text, existingWords);
    if (!analysis.ok) { setError(analysis.error); return; }
    setReview({ fileName: file.name, ...analysis });
    setStep(1);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void readFile(e.dataTransfer.files[0]);
  }

  async function runImport() {
    if (!review) return;
    setImporting(true);
    setError(null);
    try {
      const cards = toFlashcards(language, review.rows, Date.now());
      if (review.newTags.length > 0) await repos.languages.save({ ...language, tags: [...language.tags, ...review.newTags] });
      await repos.flashcards.saveMany(cards);
      importingRef.current = false;
      setResult({
        imported: cards.length,
        skipped: review.rows.length - review.valid,
        newTags: review.newTags,
        skippedCsv: buildSkippedCsv(review.headers, review.rows),
      });
      setStep(2);
    } catch {
      setError('No se pudo completar la importación. Inténtalo de nuevo.');
    } finally {
      setImporting(false);
    }
  }

  const skippedRows = review ? review.rows.filter((r) => r.status !== 'ok') : [];

  return (
    <>
      <TopBar title="Importar flashcards" backTo="/flashcards" backLabel="Cancelar importación y volver" />
      <div className="page narrow" style={{ '--w': '820px' } as React.CSSProperties}>
        <div style={{ margin: 'var(--sp-2) 0 var(--sp-5)' }}><Stepper steps={STEPS} current={step} /></div>

        {step === 0 && (
          <section className="stack" aria-labelledby="s1">
            <h2 id="s1">Selecciona el archivo CSV</h2>
            {error && (
              <Alert tone="err"><strong>No se pudo leer el archivo.</strong> {error}</Alert>
            )}
            <div
              className="dropzone"
              style={dragging ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : undefined}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <span className="deck-icon"><Upload className="ic lg" aria-hidden="true" /></span>
              <strong>Arrastra el archivo aquí</strong>
              <span className="muted small">o</span>
              <Button onClick={() => input.current?.click()}>Elegir archivo</Button>
              <input
                ref={input}
                className="sr-only"
                type="file"
                accept=".csv,text/csv"
                aria-label="Archivo CSV"
                tabIndex={-1}
                onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ''; }}
              />
              <span className="xs muted">Formato .csv, codificación UTF-8, hasta {String(MAX_CSV_ROWS).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} filas.</span>
            </div>

            <div className="card flat">
              <h3 className="card-title"><FileText className="ic" aria-hidden="true" />Columnas esperadas para {language.name}</h3>
              <div className="scroll-x">
                <table className="t">
                  <thead><tr><th>Columna</th><th>Obligatoria</th><th>Ejemplo</th></tr></thead>
                  <tbody>
                    {columns.map((c) => (
                      <tr key={c.field.id}>
                        <td><code>{c.header}</code></td>
                        <td><Badge tone={c.required ? 'ok' : 'neutral'}>{c.required ? 'Sí' : 'No'}</Badge></td>
                        <td className={cjk && (c.field.system === 'word' || c.field.tts) ? 'han' : undefined} lang={cjk && (c.field.system === 'word' || c.field.tts) ? language.code : undefined} style={{ fontWeight: 500 }}>{c.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted" style={{ marginTop: 'var(--sp-3)' }}>
                La primera fila debe ser el encabezado con los nombres de los campos. Los tags se separan con punto y coma.
                Los tags que no existan se crearán. Las palabras que ya existen en {language.name} no se importan.
              </p>
              <Button variant="secondary" style={{ marginTop: 'var(--sp-3)' }} onClick={() => downloadText(`plantilla-${language.name.toLowerCase().replace(/\s+/g, '-')}.csv`, buildTemplate(language))}>
                <Download className="ic" aria-hidden="true" />Descargar plantilla CSV
              </Button>
            </div>
          </section>
        )}

        {step === 1 && review && (
          <section className="stack" aria-labelledby="s2">
            <h2 id="s2">Revisa antes de importar</h2>
            <p className="small muted">Archivo: {review.fileName}</p>
            {review.valid > 0 ? (
              <Alert tone="ok"><strong>{plural(review.valid, 'fila válida', 'filas válidas')}</strong> {review.valid === 1 ? 'lista' : 'listas'} para importar.</Alert>
            ) : (
              <Alert tone="err"><strong>No hay filas válidas para importar.</strong></Alert>
            )}
            {skippedRows.length > 0 && (
              <Alert tone="warn"><span><strong>{plural(skippedRows.length, 'fila con problemas', 'filas con problemas')}</strong> se omitirán: {describeSkipped(review.rows)}.</span></Alert>
            )}
            {review.ignored.length > 0 && (
              <Alert tone="info">Se ignoran las columnas que no corresponden a ningún campo: {review.ignored.join(', ')}.</Alert>
            )}
            {review.newTags.length > 0 && (
              <Alert tone="info">Se crearán {plural(review.newTags.length, 'tag nuevo', 'tags nuevos')}: {review.newTags.join(', ')}.</Alert>
            )}
            <div className="card flat scroll-x" style={{ padding: 0 }}>
              <table className="t" aria-label="Vista previa de filas">
                <thead>
                  <tr><th>#</th><th>Palabra</th>{secondary && <th>{secondary.name}</th>}<th>Traducción</th><th>Tags</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {review.rows.slice(0, PREVIEW_ROWS).map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td>
                      <td className={cjk ? 'han' : undefined} lang={language.code}>{r.fields.word || '—'}</td>
                      {secondary && <td>{r.fields[secondary.id] || '—'}</td>}
                      <td>{r.fields.translation || '—'}</td>
                      <td>{r.fields.tags || '—'}</td>
                      <td>
                        {r.status === 'ok' && <Badge tone="ok">OK</Badge>}
                        {r.status === 'invalid' && <Badge tone="err">{r.reason}</Badge>}
                        {r.status === 'duplicate' && <Badge tone="warn">Duplicada</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="xs muted">Mostrando {Math.min(PREVIEW_ROWS, review.rows.length)} de {review.rows.length} filas.</p>
            {error && <Alert tone="err">{error}</Alert>}
            <div className="sticky-foot">
              <Button variant="secondary" disabled={importing} onClick={() => { setReview(null); setError(null); setStep(0); }}>Elegir otro archivo</Button>
              <Button loading={importing} disabled={review.valid === 0} onClick={() => void runImport()}>
                {importing ? 'Importando…' : `Importar ${plural(review.valid, 'flashcard', 'flashcards')}`}
              </Button>
            </div>
          </section>
        )}

        {step === 2 && result && (
          <section aria-labelledby="s3">
            <div className="empty">
              <div className="art" style={{ background: 'var(--success-soft)', color: 'var(--success)' }} aria-hidden="true"><CircleCheck className="ic lg" /></div>
              <h2 id="s3">Se {result.imported === 1 ? 'importó' : 'importaron'} {plural(result.imported, 'flashcard', 'flashcards')}</h2>
              <p role="status">
                {result.newTags.length > 0 ? `Se ${result.newTags.length === 1 ? 'creó' : 'crearon'} ${plural(result.newTags.length, 'tag nuevo', 'tags nuevos')} (${result.newTags.join(', ')}). ` : ''}
                {result.skipped > 0 ? `Se ${result.skipped === 1 ? 'omitió' : 'omitieron'} ${plural(result.skipped, 'fila con problemas', 'filas con problemas')}.` : 'No se omitió ninguna fila.'}
              </p>
              <div className="btn-group" style={{ justifyContent: 'center' }}>
                <Link className="btn btn-primary" to="/flashcards">Ver flashcards</Link>
                {result.skipped > 0 && (
                  <Button variant="secondary" onClick={() => downloadText('filas-omitidas.csv', result.skippedCsv)}>
                    <Download className="ic" aria-hidden="true" />Descargar filas omitidas
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
      <UnsavedChangesGuard when={whenImporting} />
    </>
  );
}
