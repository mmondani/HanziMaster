import type { ButtonHTMLAttributes } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio: un botón de solo ícono necesita nombre accesible. */
  'aria-label': string;
}

export function IconButton({ className, type = 'button', ...rest }: IconButtonProps) {
  return <button type={type} className={['icon-btn', className].filter(Boolean).join(' ')} {...rest} />;
}
