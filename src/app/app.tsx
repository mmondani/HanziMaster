import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/toast-provider';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
