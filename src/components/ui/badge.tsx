import type { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'ok' | 'warn' | 'err';
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  const cls = ['badge', tone !== 'neutral' && tone, className].filter(Boolean).join(' ');
  return <span className={cls} {...rest} />;
}
