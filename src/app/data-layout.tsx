import { Outlet } from 'react-router-dom';
import { DecksProvider } from '@/lib/decks/decks-provider';
import { FlashcardsProvider } from '@/lib/flashcards/flashcards-provider';
import { LanguagesProvider } from '@/lib/languages/languages-provider';

/** Datos compartidos por todas las rutas privadas: idiomas (con idioma activo), flashcards y mazos. */
export function DataLayout() {
  return (
    <LanguagesProvider>
      <FlashcardsProvider>
        <DecksProvider>
          <Outlet />
        </DecksProvider>
      </FlashcardsProvider>
    </LanguagesProvider>
  );
}
