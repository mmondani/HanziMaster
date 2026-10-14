import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { ModeEditorDialog } from '@/features/decks/mode-editor-dialog';
import { describeMode, isModeBroken } from '@/lib/domain/deck-rules';
import type { Language, TraversalMode } from '@/lib/types';

export interface DefaultModesPanelProps {
  language: Language;
  modes: TraversalMode[];
  onChange: (modes: TraversalMode[]) => void;
}

/** Pestaña "Recorridas" del editor de idioma: modos que traerán por defecto los mazos nuevos. */
export function DefaultModesPanel({ language, modes, onChange }: DefaultModesPanelProps) {
  const [editing, setEditing] = useState<TraversalMode | 'new' | null>(null);
  const noLayouts = language.layouts.length === 0;

  function save(mode: TraversalMode) {
    onChange(modes.some((m) => m.id === mode.id) ? modes.map((m) => (m.id === mode.id ? mode : m)) : [...modes, mode]);
    setEditing(null);
  }

  return (
    <section className="section" aria-label="Modos de recorrida por defecto">
      <p className="section-hint">
        Cada mazo nuevo de este idioma empieza con una copia de estos modos. Después se pueden editar o quitar en cada mazo sin afectar a este idioma, ni a los mazos que ya existen.
      </p>
      {noLayouts && (
        <Alert tone="warn">
          <span>Este idioma todavía no tiene layouts. <Link to="?tab=layouts" style={{ fontWeight: 600, textDecoration: 'underline' }}>Crea uno en Layouts</Link> para armar los modos.</span>
        </Alert>
      )}
      <div className="card-title" style={{ marginTop: 'var(--sp-3)' }}>
        <h2 className="grow as-h3">Modos por defecto</h2>
        <Button variant="secondary" disabled={noLayouts} onClick={() => setEditing('new')}><Plus className="ic" aria-hidden="true" />Agregar modo</Button>
      </div>
      {modes.length === 0 ? (
        <p className="muted">Todavía no hay modos por defecto: los mazos nuevos empiezan sin modos.</p>
      ) : (
        <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
          {modes.map((m) => (
            <li key={m.id} className="item" style={{ flexWrap: 'wrap' }}>
              <span className="meta">
                <span className="t">{m.name}</span>
                <span className="s">{describeMode(m, language)}</span>
                {isModeBroken(m, language) && (
                  <span className="tags" style={{ marginTop: 4 }}><Badge tone="err">Layout eliminado · no se aplicará a los mazos nuevos</Badge></span>
                )}
              </span>
              <IconButton aria-label={`Editar modo por defecto ${m.name}`} onClick={() => setEditing(m)}><Pencil className="ic" aria-hidden="true" /></IconButton>
              <IconButton aria-label={`Quitar modo por defecto ${m.name}`} onClick={() => onChange(modes.filter((x) => x.id !== m.id))}><Trash2 className="ic" aria-hidden="true" /></IconButton>
            </li>
          ))}
        </ul>
      )}
      {editing !== null && (
        <ModeEditorDialog language={language} mode={editing === 'new' ? null : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
