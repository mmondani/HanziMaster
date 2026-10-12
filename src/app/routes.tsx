import { Navigate, type RouteObject } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { AccessDeniedPage } from '@/features/access/access-denied-page';
import { LoginPage } from '@/features/access/login-page';
import { RequireAuth } from '@/features/access/require-auth';
import { DeckDetailPage } from '@/features/decks/deck-detail-page';
import { DeckFormPage } from '@/features/decks/deck-form-page';
import { DecksPage } from '@/features/decks/decks-page';
import { FlashcardDetailPage } from '@/features/flashcards/flashcard-detail-page';
import { FlashcardFormPage } from '@/features/flashcards/flashcard-form-page';
import { ImportPage } from '@/features/flashcards/import-page';
import { FlashcardsPage } from '@/features/flashcards/flashcards-page';
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
          // Recorrido: pantalla completa, fuera del shell (se implementa en el paso 10).
          { path: '/mazos/:id/estudiar', element: <PlaceholderPage title="Recorrido" child /> },
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/flashcards" replace /> },
              { path: '/flashcards', element: <FlashcardsPage /> },
              { path: '/flashcards/nueva', element: <FlashcardFormPage />, handle: { push: true } },
              { path: '/flashcards/importar', element: <ImportPage />, handle: { push: true } },
              { path: '/flashcards/:id', element: <FlashcardDetailPage />, handle: { push: true } },
              { path: '/flashcards/:id/editar', element: <FlashcardFormPage />, handle: { push: true } },
              { path: '/mazos', element: <DecksPage /> },
              { path: '/mazos/nuevo', element: <DeckFormPage />, handle: { push: true } },
              { path: '/mazos/:id', element: <DeckDetailPage />, handle: { push: true } },
              { path: '/mazos/:id/editar', element: <DeckFormPage />, handle: { push: true } },
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
