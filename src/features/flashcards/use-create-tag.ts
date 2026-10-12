import { useCallback } from 'react';
import { addTag } from '@/lib/domain/field-rules';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Language } from '@/lib/types';

/**
 * Alta de un tag nuevo en el set del idioma. Si ya existe (sin distinguir mayúsculas) se reutiliza.
 * Resuelve con el nombre definitivo del tag.
 */
export function useCreateTag(language: Language) {
  const repos = useRepositories();
  return useCallback(async (raw: string): Promise<string> => {
    const existing = language.tags.find((t) => t.toLowerCase() === raw.trim().toLowerCase());
    if (existing) return existing;
    const { tags } = addTag(language.tags, raw);
    await repos.languages.save({ ...language, tags });
    return raw.trim();
  }, [language, repos]);
}
