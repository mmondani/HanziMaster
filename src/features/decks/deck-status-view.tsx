import { Link } from 'react-router-dom';
import { Languages, Layers, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeckRecord } from './use-deck-record';

/** Estados no listos de las pantallas de un mazo (cargando, error, inexistente, sin idioma). */
export function DeckStatusView({ record, title }: { record: Exclude<DeckRecord, { status: 'ready' }>; title: string }) {
  return (
    <>
      <TopBar title={title} backTo="/mazos" backLabel="Volver a Mazos" />
      {record.status === 'loading' && (
        <div className="page narrow" role="status" aria-label="Cargando mazo" style={{ '--w': '820px' } as React.CSSProperties}><Skeleton height={160} /></div>
      )}
      {record.status === 'error' && (
        <div className="page narrow stack" style={{ '--w': '820px' } as React.CSSProperties}>
          <Alert tone="err">No se pudo cargar el mazo.</Alert>
          <Button variant="secondary" onClick={record.retry}>Reintentar</Button>
        </div>
      )}
      {record.status === 'notfound' && (
        <EmptyState
          icon={<Layers className="ic lg" />}
          title="No se encontró el mazo"
          description="Puede que se haya eliminado."
          actions={<Link className="btn btn-primary" to="/mazos">Ver mazos</Link>}
        />
      )}
      {record.status === 'nolanguage' && (
        <EmptyState
          icon={<Languages className="ic lg" />}
          title="Primero configura un idioma"
          description="Los mazos agrupan las flashcards de un idioma. Crea el primero para empezar."
          actions={<Link className="btn btn-primary" to="/idiomas/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo idioma</Link>}
        />
      )}
    </>
  );
}
