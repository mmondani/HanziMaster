import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { UpdatePrompt } from '@/components/layout/update-prompt';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AiProvider } from '@/lib/ai/ai-provider';
import { createGeminiCompleter } from '@/lib/ai/gemini-completer';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { createFirebaseAuthService } from '@/lib/auth/firebase-auth-service';
import { createFirestoreRepositories } from '@/lib/repositories/firestore-repositories';
import { RepositoriesProvider } from '@/lib/repositories/repositories-provider';
import { routes } from './routes';

const router = createBrowserRouter(routes);
const authService = createFirebaseAuthService();
const aiCompleter = createGeminiCompleter();

export function App() {
  return (
    <AuthProvider service={authService}>
      <RepositoriesProvider factory={createFirestoreRepositories}>
        <AiProvider completer={aiCompleter}>
          <ToastProvider>
            <RouterProvider router={router} />
            <UpdatePrompt />
          </ToastProvider>
        </AiProvider>
      </RepositoriesProvider>
    </AuthProvider>
  );
}
