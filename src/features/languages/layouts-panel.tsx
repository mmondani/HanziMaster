import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { LayoutCanvas } from '@/components/flashcard/layout-canvas';
import type { Language } from '@/lib/types';

export interface LayoutsPanelProps {
  language: Language;
  /** Un idioma sin guardar todavía no tiene dónde guardar layouts. */
  persisted: boolean;
}

/** Pestaña "Layouts" del editor de idioma. */
export function LayoutsPanel({ language, persisted }: LayoutsPanelProps) {
  return (
    <section className="section" aria-label="Layouts">
      <div className="row" style={{ marginBottom: 'var(--sp-3)' }}>
        <p className="section-hint grow" style={{ margin: 0 }}>
          Un layout define qué campos se muestran, dónde y de qué tamaño. Los mazos los combinan como frente y reverso.
        </p>
        {persisted ? (
          <Link className="btn btn-secondary" to={`/idiomas/${language.id}/layouts/nuevo`}>
            <Plus className="ic" aria-hidden="true" />
            <span className="only-desktop">Nuevo layout</span>
            <span className="only-mobile" aria-hidden="true">Layout</span>
          </Link>
        ) : null}
      </div>
      {!persisted && <p className="muted">Guarda el idioma para poder crear layouts.</p>}
      {persisted && language.layouts.length === 0 && <p className="muted">Todavía no hay layouts.</p>}
      <ul className="deck-grid" style={{ listStyle: 'none', padding: 0 }}>
        {language.layouts.map((l) => (
          <li key={l.id}>
            <Link className="card deck-card" to={`/idiomas/${language.id}/layouts/${l.id}`} aria-label={`Editar layout ${l.name}`}>
              <LayoutCanvas items={l.items} fields={language.fields} compact label={`Miniatura de ${l.name}`} />
              <div>
                <h3>{l.name}</h3>
                <div className="small muted">{l.items.length} {l.items.length === 1 ? 'campo' : 'campos'}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
