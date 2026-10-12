import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useMatches } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { Sidebar, type SidebarUser } from './sidebar';

export interface RouteHandle {
  /** Pantalla hija (formulario/detalle): oculta la barra inferior en mobile. */
  push?: boolean;
}

/**
 * Shell de la app: sidebar en desktop, barra inferior en mobile.
 * Al cambiar de ruta mueve el foco a `<main>` para teclado y lectores de pantalla.
 */
export function AppShell({ user }: { user?: SidebarUser }) {
  const { pathname } = useLocation();
  const push = useMatches().some((m) => (m.handle as RouteHandle | undefined)?.push);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className={push ? 'push' : undefined}>
      <Sidebar user={user} />
      <main ref={mainRef} id="main" className="app-main" tabIndex={-1} style={{ outline: 'none' }}>
        <Outlet />
      </main>
      {!push && <BottomNav />}
    </div>
  );
}
