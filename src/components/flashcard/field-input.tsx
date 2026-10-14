import type { ReactNode } from 'react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { isCjk, isTargetLanguageField } from '@/lib/domain/flashcard-form';
import type { FieldDef, Language } from '@/lib/types';

export interface FieldInputProps {
  field: FieldDef;
  language: Language;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  /** El valor lo puso la IA y sigue sin editarse. */
  fromAi?: boolean;
  /** Esperando a la IA: se muestra como esqueleto y no se puede editar. */
  loading?: boolean;
  disabled?: boolean;
  /** Control junto al input (p. ej. el botón de IA). */
  action?: ReactNode;
  /** Texto de ayuda extra bajo el input, con un id propio para enlazarlo desde `action`. */
  note?: { id: string; text: string };
}

/** Input adecuado al tipo del campo (texto, lista o número) con etiqueta, ayuda y error enlazados. */
export function FieldInput({ field, language, value, error, onChange, fromAi, loading, disabled, action, note }: FieldInputProps) {
  const target = isTargetLanguageField(field);
  const sentence = (text?: string) => (text && !/[.!?]$/.test(text.trim()) ? `${text.trim()}.` : text);
  const help = [
    sentence(field.description),
    field.type === 'list' ? 'Separa los elementos con comas.' : undefined,
    field.tts ? 'Este campo tiene audio (text-to-speech).' : undefined,
    fromAi ? 'Completado con IA: revísalo.' : undefined,
  ].filter(Boolean).join(' ');

  return (
    <Field label={field.name} required={field.required} optional={!field.required} help={help || undefined} error={error}>
      {(c) => {
        const input = (
          <Input
            {...c}
            className={[loading && 'skeleton', fromAi && !loading && 'from-ai'].filter(Boolean).join(' ') || undefined}
            cjk={target && isCjk(language)}
            type={field.type === 'number' ? 'number' : 'text'}
            inputMode={field.type === 'number' ? 'decimal' : undefined}
            step={field.type === 'number' ? 'any' : undefined}
            autoComplete="off"
            value={value}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        );
        return (
          <>
            {action ? <div className="input-wrap">{input}{action}</div> : input}
            {note && <p id={note.id} className="help">{note.text}</p>}
          </>
        );
      }}
    </Field>
  );
}
