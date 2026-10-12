import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="art" aria-hidden="true">{icon}</div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actions}
    </div>
  );
}
