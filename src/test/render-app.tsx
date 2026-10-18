import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/app/routes';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AiProvider } from '@/lib/ai/ai-provider';
import type { AiCompleter } from '@/lib/domain/ai-completion';
import { AuthProvider } from '@/lib/auth/auth-provider';
import type { CharDataLoader } from '@/lib/handwriting/char-data';
import { CharDataProvider } from '@/lib/handwriting/char-data-provider';
import { RepositoriesProvider } from '@/lib/repositories/repositories-provider';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { FakeAuthService } from './fake-auth-service';
import { fixtureLoader } from './stroke-fixtures';

export const ANA = { uid: 'u1', email: 'ana@gmail.com' };

/**
 * Renderiza la app completa en una ruta, con servicios de autenticación y datos simulados.
 * Los datos de trazos salen siempre de los fixtures (nunca de la red).
 */
export function renderApp(path: string, service = new FakeAuthService(), repos = new MemoryRepositories(), ai?: AiCompleter, charData: CharDataLoader = fixtureLoader()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const factory = () => repos;
  const content = (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
  const view = render(
    <AuthProvider service={service}>
      <RepositoriesProvider factory={factory}>
        <CharDataProvider loader={charData}>
          {ai ? <AiProvider completer={ai}>{content}</AiProvider> : content}
        </CharDataProvider>
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
