import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  /** Selector de idioma (chip). En mobile baja a una segunda línea. */
  languageSelector?: ReactNode;
  /** Acciones secundarias visibles solo en desktop (en mobile van en un menú). */
  desktopActions?: ReactNode;
  /** Acción principal de la pantalla (solo se muestra en desktop; en mobile va un FAB). */
  action?: ReactNode;
  /** Contenido extra solo mobile (ej. menú de acciones). */
  mobileActions?: ReactNode;
}

/** Encabezado de las pantallas raíz del shell (Flashcards, Mazos, Idiomas…). */
export function PageHeader({ title, languageSelector, desktopActions, action, mobileActions }: PageHeaderProps) {
  return (
    <header className="page-head">
      <div className="title-row">
        <h1>{title}</h1>
        {languageSelector && <div data-lang-selector>{languageSelector}</div>}
        {desktopActions && <span className="only-desktop row">{desktopActions}</span>}
        {action && <span className="only-desktop">{action}</span>}
        {mobileActions && <span className="only-mobile">{mobileActions}</span>}
      </div>
    </header>
  );
}
