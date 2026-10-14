export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
];

const STORAGE_KEY = 'hm:theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const isPreference = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';

/** Preferencia guardada en este dispositivo; "sistema" si no hay o `localStorage` no está disponible. */
export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

const systemPrefersDark = () => typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;

/** Pone o quita `data-theme="dark"` en <html> según la preferencia (claro = sin atributo). */
export function applyTheme(preference: ThemePreference): void {
  const dark = preference === 'dark' || (preference === 'system' && systemPrefersDark());
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

/** Guarda la preferencia y la aplica de inmediato. */
export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Sin almacenamiento la preferencia rige solo hasta recargar.
  }
  applyTheme(preference);
}

/** Aplica la preferencia guardada y, en modo "sistema", sigue los cambios del sistema. */
export function initTheme(): void {
  applyTheme(getThemePreference());
  if (typeof window.matchMedia !== 'function') return;
  window.matchMedia(DARK_QUERY).addEventListener('change', () => applyTheme(getThemePreference()));
}
