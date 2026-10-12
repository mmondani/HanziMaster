import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { addTag, removeTag } from '@/lib/domain/field-rules';

export interface TagsPanelProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

/** Pestaña "Tags" del editor de idioma. */
export function TagsPanel({ tags, onChange }: TagsPanelProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = addTag(tags, text);
    if (result.error) { setError(result.error); return; }
    onChange(result.tags);
    setText('');
    setError(undefined);
  }

  return (
    <section className="section" aria-label="Tags">
      <p className="section-hint">
        Set inicial de tags disponibles al crear flashcards de este idioma. También se pueden crear desde la flashcard.
      </p>
      <form onSubmit={submit} style={{ marginBottom: 'var(--sp-4)' }}>
        <Field label="Nuevo tag" error={error}>
          {(c) => (
            <div className="input-wrap">
              <Input {...c} placeholder="Ej. Saludos" value={text} onChange={(e) => { setText(e.target.value); setError(undefined); }} />
              <Button type="submit"><Plus className="ic" aria-hidden="true" />Agregar</Button>
            </div>
          )}
        </Field>
      </form>
      {tags.length === 0 ? (
        <p className="muted">Todavía no hay tags.</p>
      ) : (
        <ul className="tags" style={{ listStyle: 'none', padding: 0 }}>
          {tags.map((t) => (
            <li key={t} className="chip">
              {t}
              <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} aria-label={`Quitar tag ${t}`} onClick={() => onChange(removeTag(tags, t))}>
                <X className="ic sm" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 'var(--sp-4)' }}>
        <Alert tone="warn">Quitar un tag también lo quita de las flashcards que lo usan.</Alert>
      </div>
    </section>
  );
}
