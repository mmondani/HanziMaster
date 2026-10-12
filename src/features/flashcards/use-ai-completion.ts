import { useCallback, useState } from 'react';
import { useAi } from '@/lib/ai/ai-provider';
import { applyAiResult, buildAiRequest, NO_AI_APPLIED, type AiApplied, type AiApplyResult } from '@/lib/domain/ai-completion';
import type { FormValues } from '@/lib/domain/flashcard-form';
import type { Language } from '@/lib/types';

export type AiStatus = 'idle' | 'loading' | 'done' | 'error';

/** Estado de "Completar con IA" para un formulario de flashcard. `complete` resuelve con lo que hay que volcar al formulario. */
export function useAiCompletion(language: Language, wordFieldId: string | undefined) {
  const ai = useAi();
  const [status, setStatus] = useState<AiStatus>('idle');
  const [applied, setApplied] = useState<AiApplied>(NO_AI_APPLIED);
  const [filledCount, setFilledCount] = useState(0);

  const complete = useCallback(
    async (current: { values: FormValues; tags: string[] }): Promise<AiApplyResult | null> => {
      if (!ai || !wordFieldId) return null;
      setStatus('loading');
      try {
        const response = await ai.complete(buildAiRequest(language, current.values[wordFieldId] ?? ''));
        const result = applyAiResult(language, current, response, applied);
        setApplied(result.applied);
        setFilledCount(result.filledCount);
        setStatus('done');
        return result;
      } catch {
        setStatus('error');
        return null;
      }
    },
    [ai, applied, language, wordFieldId],
  );

  return { available: ai !== null, status, applied, filledCount, complete };
}
