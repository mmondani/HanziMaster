import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { AccessDeniedPage } from '@/features/access/access-denied-page';
import { LoginPage } from '@/features/access/login-page';
import { RequireAuth } from '@/features/access/require-auth';
import { LanguageEditorPage } from '@/features/languages/language-editor-page';
import { LanguagesPage } from '@/features/languages/languages-page';
import { LayoutEditorPage } from '@/features/languages/layout-editor-page';
import { MorePage } from '@/features/more/more-page';
import { DataLayout } from './data-layout';
import { PlaceholderPage } from './placeholder-page';

/** Mapa de rutas (ver docs/features/000-mvp/pantallas/navegacion.md). */
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/acceso-denegado', element: <AccessDeniedPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DataLayout />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/flashcards" replace /> },
              { path: '/flashcards', element: <PlaceholderPage title="Flashcards" /> },
              { path: '/mazos', element: <PlaceholderPage title="Mazos" /> },
              { path: '/mas', element: <MorePage /> },
              { path: '/idiomas', element: <LanguagesPage />, handle: { push: true } },
              { path: '/idiomas/nuevo', element: <LanguageEditorPage />, handle: { push: true } },
              { path: '/idiomas/:id', element: <LanguageEditorPage />, handle: { push: true } },
              { path: '/idiomas/:id/layouts/nuevo', element: <LayoutEditorPage />, handle: { push: true } },
              { path: '/idiomas/:id/layouts/:layoutId', element: <LayoutEditorPage />, handle: { push: true } },
            ],
          },
        ],
      },
    ],
  },
];
