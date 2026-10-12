import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Usa la tipografía CJK (campos con caracteres chinos/japoneses). */
  cjk?: boolean;
}

export function Input({ cjk, className, ...rest }: InputProps) {
  return <input className={['input', cjk && 'han-input', className].filter(Boolean).join(' ')} {...rest} />;
}
