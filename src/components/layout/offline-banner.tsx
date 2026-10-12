import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';

/** A04 · Franja de aviso cuando se pierde la conexión con la app abierta. */
export function OfflineBanner({ forceVisible = false }: { forceVisible?: boolean }) {
  const online = useOnlineStatus();
  if (online && !forceVisible) return null;
  return (
    <div className="alert warn" role="status" style={{ borderRadius: 0, justifyContent: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
      <WifiOff className="ic" aria-hidden="true" />
      <div><strong>Sin conexión.</strong> Puedes seguir estudiando; los cambios se guardarán al volver la red.</div>
    </div>
  );
}
