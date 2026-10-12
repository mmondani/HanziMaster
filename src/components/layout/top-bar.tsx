import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

export interface TopBarProps {
  title: string;
  /** Destino fijo del botón Volver; si se omite vuelve a la pantalla anterior. */
  backTo?: string;
  /** Nombre accesible del botón Volver (por defecto "Volver"). */
  backLabel?: string;
  /** Oculta el botón Volver en desktop (donde el sidebar ya permite navegar). */
  hideBackOnDesktop?: boolean;
  actions?: ReactNode;
}

/** Barra superior de pantallas hijas (formularios, detalle) con botón Volver. */
export function TopBar({ title, backTo, backLabel = 'Volver', hideBackOnDesktop, actions }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <IconButton
        className={hideBackOnDesktop ? 'only-mobile' : undefined}
        aria-label={backLabel}
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
      >
        <ArrowLeft className="ic" aria-hidden="true" />
      </IconButton>
      <h1>{title}</h1>
      {actions}
    </header>
  );
}
