import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Modo controlado (el recorrido maneja la cara visible). */
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  /** Estilos del contenedor (proporciones de la carta). */
  style?: CSSProperties;
}

/** Carta con giro 3D (`rotateY`). Clic, Enter y Espacio giran; los botones internos marcados `data-no-flip` no. */
export function FlipCard({ front, back, flipped: controlled, onFlipChange, style }: FlipCardProps) {
  const [inner, setInner] = useState(false);
  const flipped = controlled ?? inner;
  const toggle = () => {
    onFlipChange?.(!flipped);
    if (controlled === undefined) setInner(!flipped);
  };

  function onClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-no-flip]')) return;
    toggle();
  }
  function onKeyDown(e: KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
  }

  return (
    <div
      className={`flip${flipped ? ' is-flipped' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Girar carta. Mostrando ${flipped ? 'el reverso' : 'el frente'}`}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <div className="flip-inner">
        <div className="face" aria-hidden={flipped || undefined}>{front}</div>
        <div className="face back" aria-hidden={!flipped || undefined}>{back}</div>
      </div>
    </div>
  );
}
