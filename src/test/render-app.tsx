import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/routes';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { RepositoriesProvider } from '@/lib/repositories/repositories-provider';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { FakeAuthService } from './fake-auth-service';

export const ANA = { uid: 'u1', email: 'ana@gmail.com' };

/** Renderiza la app completa en una ruta, con servicios de autenticación y datos simulados. */
export function renderApp(path: string, service = new FakeAuthService(), repos = new MemoryRepositories()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const factory = () => repos;
  const view = render(
    <AuthProvider service={service}>
      <RepositoriesProvider factory={factory}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </RepositoriesProvider>
    </AuthProvider>,
  );
  return { router, service, repos, ...view };
}

/** Servicio con una sesión de una cuenta habilitada. */
export function signedInService() {
  const service = new FakeAuthService(ANA);
  service.allowed.add(ANA.email);
  return service;
}
