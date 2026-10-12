import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'ai';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  large?: boolean;
  block?: boolean;
  loading?: boolean;
}

export function Button({ variant = 'primary', large, block, loading, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  const cls = ['btn', `btn-${variant}`, large && 'btn-lg', block && 'btn-block', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {children}
    </button>
  );
}
