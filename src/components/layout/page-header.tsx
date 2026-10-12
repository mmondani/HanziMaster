import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  /** Selector de idioma (chip). En mobile baja a una segunda línea. */
  languageSelector?: ReactNode;
  /** Acción principal de la pantalla (solo se muestra en desktop; en mobile va un FAB). */
  action?: ReactNode;
}

/** Encabezado de las pantallas raíz del shell (Flashcards, Mazos, Idiomas…). */
export function PageHeader({ title, languageSelector, action }: PageHeaderProps) {
  return (
    <header className="page-head">
      <div className="title-row">
        <h1>{title}</h1>
        {languageSelector}
        {action && <span className="only-desktop">{action}</span>}
      </div>
    </header>
  );
}
