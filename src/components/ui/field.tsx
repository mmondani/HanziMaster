import { useId, type ReactNode } from 'react';

export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  'aria-required'?: true;
}

export interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  help?: string;
  error?: string;
  /** Recibe las props de accesibilidad que debe aplicar al control. */
  children: (control: FieldControlProps) => ReactNode;
}

/** Etiqueta visible + ayuda + error enlazados al control (label/for, aria-describedby). */
export function Field({ label, required, optional, help, error, children }: FieldProps) {
  const uid = useId();
  const helpId = help ? `${uid}-help` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={uid}>
        {label}
        {required && <span className="req" aria-hidden="true">*</span>}
        {optional && <span className="opt">(opcional)</span>}
      </label>
      {children({
        id: uid,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {help && <p id={helpId} className="help">{help}</p>}
      {error && <p id={errorId} className="error" role="alert">{error}</p>}
    </div>
  );
}
