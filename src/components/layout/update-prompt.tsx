import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';

/**
 * Avisa cuando hay una versión nueva de la app (service worker en espera) y deja elegir cuándo actualizar,
 * para no recargar la pantalla en medio de un recorrido.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <div className="toast with-actions" role="status" style={{ bottom: 'calc(var(--bottom-nav-h) + var(--sp-4) + env(safe-area-inset-bottom))', zIndex: 130 }}>
      <span>Hay una versión nueva de Hanzi Master.</span>
      <Button variant="ghost" style={{ color: 'var(--bg)' }} onClick={() => void updateServiceWorker(true)}>Actualizar</Button>
      <Button variant="ghost" style={{ color: 'var(--bg)' }} onClick={() => setNeedRefresh(false)}>Más tarde</Button>
    </div>
  );
}
