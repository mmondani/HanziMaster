import { useState } from 'react';
import { Segmented } from '@/components/ui/segmented';
import { getThemePreference, setThemePreference, THEME_OPTIONS, type ThemePreference } from '@/lib/theme';

/** Elige el tema de la app: claro, oscuro o el del sistema. Se recuerda en este dispositivo. */
export function ThemeSelector() {
  const [value, setValue] = useState<ThemePreference>(getThemePreference);
  return (
    <Segmented
      label="Tema"
      options={THEME_OPTIONS}
      value={value}
      onChange={(next) => { setValue(next); setThemePreference(next); }}
    />
  );
}
