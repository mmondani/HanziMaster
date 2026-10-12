import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth/auth-provider';
import { OfflineScreen } from './offline-screen';

/** Guarda de rutas privadas (A01-1): sin sesión válida lleva a /login recordando el destino. */
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();

  switch (state.status) {
    case 'loading':
      return <div role="status" aria-label="Cargando" className="center-screen"><div className="skeleton" style={{ width: 72, height: 72, borderRadius: 22 }} /></div>;
    case 'unreachable':
      return <OfflineScreen />;
    case 'signedOut':
      return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    case 'allowed':
      return <Outlet />;
  }
}
