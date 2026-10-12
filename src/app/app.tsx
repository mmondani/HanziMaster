import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { createFirebaseAuthService } from '@/lib/auth/firebase-auth-service';
import { routes } from './routes';

const router = createBrowserRouter(routes);
const authService = createFirebaseAuthService();

export function App() {
  return (
    <AuthProvider service={authService}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}
