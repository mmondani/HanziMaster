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
}

/** Input adecuado al tipo del campo (texto, lista o número) con etiqueta, ayuda y error enlazados. */
export function FieldInput({ field, language, value, error, onChange }: FieldInputProps) {
  const target = isTargetLanguageField(field);
  const sentence = (text?: string) => (text && !/[.!?]$/.test(text.trim()) ? `${text.trim()}.` : text);
  const help = [
    sentence(field.description),
    field.type === 'list' ? 'Separa los elementos con comas.' : undefined,
    field.tts ? 'Este campo tiene audio (text-to-speech).' : undefined,
  ].filter(Boolean).join(' ');

  return (
    <Field label={field.name} required={field.required} optional={!field.required} help={help || undefined} error={error}>
      {(c) => (
        <Input
          {...c}
          cjk={target && isCjk(language)}
          lang={target ? language.code : undefined}
          type={field.type === 'number' ? 'number' : 'text'}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          step={field.type === 'number' ? 'any' : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}
