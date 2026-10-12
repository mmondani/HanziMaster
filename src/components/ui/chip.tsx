import type { ButtonHTMLAttributes } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Chip activable (filtros). Para etiquetas de solo lectura usar `Badge`. */
export function Chip({ selected, className, type = 'button', ...rest }: ChipProps) {
  return <button type={type} className={['chip', 'button', className].filter(Boolean).join(' ')} aria-pressed={selected ?? false} {...rest} />;
}
