import { Link } from 'react-router-dom';
import { Copy, Languages, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { FlashcardRecord } from './use-flashcard-record';

/** Estados no listos de las pantallas de una flashcard (cargando, error, inexistente, sin idioma). */
export function RecordStatusView({ record, title }: { record: Exclude<FlashcardRecord, { status: 'ready' }>; title: string }) {
  return (
    <>
      <TopBar title={title} backTo="/flashcards" backLabel="Volver a Flashcards" />
      {record.status === 'loading' && (
        <div className="page narrow" role="status" aria-label="Cargando flashcard" style={{ '--w': '760px' } as React.CSSProperties}><Skeleton height={160} /></div>
      )}
      {record.status === 'error' && (
        <div className="page narrow stack" style={{ '--w': '760px' } as React.CSSProperties}>
          <Alert tone="err">No se pudo cargar la flashcard.</Alert>
          <Button variant="secondary" onClick={record.retry}>Reintentar</Button>
        </div>
      )}
      {record.status === 'notfound' && (
        <EmptyState
          icon={<Copy className="ic lg" />}
          title="No se encontró la flashcard"
          description="Puede que se haya eliminado."
          actions={<Link className="btn btn-primary" to="/flashcards">Ver flashcards</Link>}
        />
      )}
      {record.status === 'nolanguage' && (
        <EmptyState
          icon={<Languages className="ic lg" />}
          title="Primero configura un idioma"
          description="Las flashcards pertenecen a un idioma. Crea el primero para empezar."
          actions={<Link className="btn btn-primary" to="/idiomas/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo idioma</Link>}
        />
      )}
    </>
  );
}
