import { Outlet } from 'react-router-dom';
import { LanguagesProvider } from '@/lib/languages/languages-provider';

/** Datos compartidos por todas las rutas privadas (idiomas y selección de idioma activo). */
export function DataLayout() {
  return (
    <LanguagesProvider>
      <Outlet />
    </LanguagesProvider>
  );
}
