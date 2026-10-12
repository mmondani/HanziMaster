import { Copy, Ellipsis, Languages, Layers, type LucideIcon } from 'lucide-react';

export interface NavItemDef {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Prefijos de ruta en los que el ítem se muestra activo. */
  match: string[];
}

/** Navegación primaria en mobile (barra inferior). Idiomas vive dentro de "Más". */
export const MOBILE_NAV: NavItemDef[] = [
  { to: '/flashcards', label: 'Flashcards', icon: Copy, match: ['/flashcards'] },
  { to: '/mazos', label: 'Mazos', icon: Layers, match: ['/mazos'] },
  { to: '/mas', label: 'Más', icon: Ellipsis, match: ['/mas', '/idiomas'] },
];

/** Navegación primaria en desktop (sidebar). */
export const DESKTOP_NAV: NavItemDef[] = [MOBILE_NAV[0], MOBILE_NAV[1]];

/** Ítem secundario del sidebar, bajo "Configuración". */
export const LANGUAGES_NAV: NavItemDef = { to: '/idiomas', label: 'Idiomas', icon: Languages, match: ['/idiomas'] };

export function isActive(item: NavItemDef, pathname: string): boolean {
  return item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
