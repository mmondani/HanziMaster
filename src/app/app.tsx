import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UpdatePrompt } from '@/components/layout/update-prompt';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { createFirebaseAuthService } from '@/lib/auth/firebase-auth-service';
import { createFirestoreRepositories } from '@/lib/repositories/firestore-repositories';
import { RepositoriesProvider } from '@/lib/repositories/repositories-provider';
import { routes } from './routes';

const router = createBrowserRouter(routes);
const authService = createFirebaseAuthService();

export function App() {
  return (
    <AuthProvider service={authService}>
      <RepositoriesProvider factory={createFirestoreRepositories}>
        <ToastProvider>
          <RouterProvider router={router} />
          <UpdatePrompt />
        </ToastProvider>
      </RepositoriesProvider>
    </AuthProvider>
  );
}
