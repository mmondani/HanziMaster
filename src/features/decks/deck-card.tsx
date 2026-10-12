import { Link } from 'react-router-dom';
import { Layers, Play, SlidersHorizontal } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canStudy, type DeckStatus } from '@/lib/domain/deck-rules';
import type { Deck } from '@/lib/types';

export interface DeckCardProps {
  deck: Deck;
  status: DeckStatus;
  onStudy: () => void;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Tarjeta de mazo (M01): estado, detalle y botón Estudiar. Tocar la tarjeta no inicia el estudio. */
export function DeckCard({ deck, status, onStudy }: DeckCardProps) {
  return (
    <div className="card deck-card">
      <div className="row">
        <span className="deck-icon"><Layers className="ic" aria-hidden="true" /></span>
        <div className="grow">
          <h3>{deck.name}</h3>
          <div className="small muted">{plural(deck.cardIds.length, 'flashcard', 'flashcards')}</div>
        </div>
        <Link className="icon-btn" to={`/mazos/${deck.id}`} aria-label={`Ver detalle de ${deck.name}`}>
          <SlidersHorizontal className="ic" aria-hidden="true" />
        </Link>
      </div>
      {status.kind === 'broken' ? (
        <Alert tone="warn"><strong>Mazo no disponible.</strong> Un layout que usaba fue eliminado.</Alert>
      ) : (
        <div className="tags">
          <Badge>{plural(deck.modes.length, 'modo de recorrida', 'modos de recorrida')}</Badge>
          <Badge>Libre</Badge>
          {status.kind === 'empty' && <Badge tone="warn">Sin flashcards</Badge>}
        </div>
      )}
      <Button block disabled={!canStudy(status)} onClick={onStudy}><Play className="ic" aria-hidden="true" />Estudiar</Button>
    </div>
  );
}
