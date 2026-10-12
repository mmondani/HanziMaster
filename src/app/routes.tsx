import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { AccessDeniedPage } from '@/features/access/access-denied-page';
import { LoginPage } from '@/features/access/login-page';
import { RequireAuth } from '@/features/access/require-auth';
import { DataLayout } from './data-layout';

/** Carga la pantalla al entrar en la ruta (un chunk por pantalla) en lugar de incluirla en el arranque. */
function page<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M & string): NonNullable<RouteObject['lazy']> {
  return async () => ({ Component: (await load())[name] as React.ComponentType });
}

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
          // Recorrido: pantalla completa, fuera del shell.
          { path: '/mazos/:id/estudiar', lazy: page(() => import('@/features/study/study-page'), 'StudyPage') },
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/flashcards" replace /> },
              { path: '/flashcards', lazy: page(() => import('@/features/flashcards/flashcards-page'), 'FlashcardsPage') },
              { path: '/flashcards/nueva', lazy: page(() => import('@/features/flashcards/flashcard-form-page'), 'FlashcardFormPage'), handle: { push: true } },
              { path: '/flashcards/importar', lazy: page(() => import('@/features/flashcards/import-page'), 'ImportPage'), handle: { push: true } },
              { path: '/flashcards/:id', lazy: page(() => import('@/features/flashcards/flashcard-detail-page'), 'FlashcardDetailPage'), handle: { push: true } },
              { path: '/flashcards/:id/editar', lazy: page(() => import('@/features/flashcards/flashcard-form-page'), 'FlashcardFormPage'), handle: { push: true } },
              { path: '/mazos', lazy: page(() => import('@/features/decks/decks-page'), 'DecksPage') },
              { path: '/mazos/nuevo', lazy: page(() => import('@/features/decks/deck-form-page'), 'DeckFormPage'), handle: { push: true } },
              { path: '/mazos/:id', lazy: page(() => import('@/features/decks/deck-detail-page'), 'DeckDetailPage'), handle: { push: true } },
              { path: '/mazos/:id/editar', lazy: page(() => import('@/features/decks/deck-form-page'), 'DeckFormPage'), handle: { push: true } },
              { path: '/mas', lazy: page(() => import('@/features/more/more-page'), 'MorePage') },
              { path: '/idiomas', lazy: page(() => import('@/features/languages/languages-page'), 'LanguagesPage'), handle: { push: true } },
              { path: '/idiomas/nuevo', lazy: page(() => import('@/features/languages/language-editor-page'), 'LanguageEditorPage'), handle: { push: true } },
              { path: '/idiomas/:id', lazy: page(() => import('@/features/languages/language-editor-page'), 'LanguageEditorPage'), handle: { push: true } },
              { path: '/idiomas/:id/layouts/nuevo', lazy: page(() => import('@/features/languages/layout-editor-page'), 'LayoutEditorPage'), handle: { push: true } },
              { path: '/idiomas/:id/layouts/:layoutId', lazy: page(() => import('@/features/languages/layout-editor-page'), 'LayoutEditorPage'), handle: { push: true } },
            ],
          },
        ],
      },
    ],
  },
];
