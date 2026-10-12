import { CircleAlert, CircleCheck, Info, Sparkles, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'ok' | 'warn' | 'err' | 'ai';

const ICONS = { info: Info, ok: CircleCheck, warn: TriangleAlert, err: CircleAlert, ai: Sparkles } as const;

export interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
}

/** Los errores se anuncian (`role="alert"`); el resto como estado (`role="status"`). */
export function Alert({ tone = 'info', children }: AlertProps) {
  const Icon = ICONS[tone];
  return (
    <div className={`alert${tone === 'info' ? '' : ` ${tone}`}`} role={tone === 'err' ? 'alert' : 'status'}>
      <Icon className="ic" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
