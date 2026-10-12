import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/routes';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { FakeAuthService } from './fake-auth-service';

export const ANA = { uid: 'u1', email: 'ana@gmail.com' };

/** Renderiza la app completa en una ruta, con un servicio de autenticación simulado. */
export function renderApp(path: string, service = new FakeAuthService()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(
    <AuthProvider service={service}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>,
  );
  return { router, service, ...view };
}

/** Servicio con una sesión de una cuenta habilitada. */
export function signedInService() {
  const service = new FakeAuthService(ANA);
  service.allowed.add(ANA.email);
  return service;
}
