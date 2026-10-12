import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { PlaceholderPage } from './placeholder-page';

/** Mapa de rutas (ver docs/features/000-mvp/pantallas/navegacion.md). */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/flashcards" replace /> },
      { path: '/flashcards', element: <PlaceholderPage title="Flashcards" /> },
      { path: '/mazos', element: <PlaceholderPage title="Mazos" /> },
      { path: '/mas', element: <PlaceholderPage title="Más" /> },
      { path: '/idiomas', element: <PlaceholderPage title="Idiomas" /> },
      { path: '/idiomas/nuevo', element: <PlaceholderPage title="Nuevo idioma" child />, handle: { push: true } },
    ],
  },
];
