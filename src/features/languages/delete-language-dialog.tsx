import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { LanguageUsage } from '@/lib/repositories/types';
import type { Language } from '@/lib/types';

export interface DeleteLanguageDialogProps {
  language: Language;
  usage?: LanguageUsage;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Eliminar un idioma exige escribir su nombre (borra también sus flashcards y mazos). */
export function DeleteLanguageDialog({ language, usage, busy, onConfirm, onClose }: DeleteLanguageDialogProps) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === language.name;
  return (
    <Dialog
      open
      role="alertdialog"
      title={`¿Eliminar «${language.name}»?`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" disabled={!matches} loading={busy} onClick={onConfirm}>Eliminar idioma</Button>
        </>
      }
    >
      <p className="muted">
        Se eliminarán también sus {count(usage?.flashcards ?? 0, 'flashcard', 'flashcards')} y {count(usage?.decks ?? 0, 'mazo', 'mazos')}.
        Esta acción no se puede deshacer.
      </p>
      <div style={{ marginTop: 'var(--sp-4)' }}>
        <Field label="Escribe el nombre del idioma para confirmar">
          {(c) => <Input {...c} data-autofocus placeholder={language.name} value={typed} onChange={(e) => setTyped(e.target.value)} />}
        </Field>
      </div>
    </Dialog>
  );
}
