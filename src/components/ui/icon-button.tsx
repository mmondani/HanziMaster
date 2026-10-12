import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio: un botón de solo ícono necesita nombre accesible. */
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ className, type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} className={['icon-btn', className].filter(Boolean).join(' ')} {...rest} />;
});
