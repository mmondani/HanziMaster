import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

export interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  /** Modo controlado (el recorrido maneja la cara visible). */
  flipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  /** Estilos del contenedor (proporciones de la carta). */
  style?: CSSProperties;
}

/**
 * Carta con giro 3D (`rotateY`). Tocar la carta o usar su botón (Enter/Espacio) la gira; los botones internos marcados
 * `data-no-flip` (p. ej. el audio) no. El control accesible es un `<button>` hermano de las caras, no un contenedor
 * `role="button"` con botones adentro (los controles anidados no los anuncian bien los lectores de pantalla).
 */
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
  return (
    // El clic del puntero se atiende en el contenedor (cualquier parte de la carta); la tecla, en el botón.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- el teclado lo cubre `.flip-toggle`
    <div className={`flip${flipped ? ' is-flipped' : ''}`} style={style} onClick={onClick}>
      <button
        type="button"
        className="flip-toggle"
        data-no-flip
        aria-label={`Girar carta. Mostrando ${flipped ? 'el reverso' : 'el frente'}`}
        onClick={toggle}
      />
      <div className="flip-inner">
        <div className="face" aria-hidden={flipped || undefined}>{front}</div>
        <div className="face back" aria-hidden={!flipped || undefined}>{back}</div>
      </div>
    </div>
  );
}
