import { app } from '@/lib/firebase';
import type { AiCompleter, AiRequest, AiResponse } from '@/lib/domain/ai-completion';
import { AI_SYSTEM_INSTRUCTION, buildAiPrompt } from './ai-prompt';

/** Modelo por defecto; se cambia con `VITE_AI_MODEL` sin tocar código. */
export const DEFAULT_AI_MODEL = 'gemini-3.5-flash';
const TIMEOUT_MS = 30_000;

/**
 * Autocompletado con Gemini vía Firebase AI Logic (Gemini Developer API). La clave de Gemini vive en Firebase,
 * no en la app. El SDK se carga recién al usar la IA para no pesar en el arranque.
 */
export function createGeminiCompleter(model: string = import.meta.env.VITE_AI_MODEL || DEFAULT_AI_MODEL): AiCompleter {
  return {
    async complete(request: AiRequest): Promise<AiResponse> {
      const { getAI, getGenerativeModel, GoogleAIBackend, Schema } = await import('firebase/ai');
      const fieldIds = request.fields.map((f) => f.id);

      const properties: Record<string, InstanceType<typeof Schema>> = {};
      if (fieldIds.length > 0) {
        properties.fields = Schema.array({
          items: Schema.object({ properties: { fieldId: Schema.enumString({ enum: fieldIds }), value: Schema.string() } }),
        });
      }
      if (request.tags.length > 0) {
        properties.tags = Schema.array({ items: Schema.enumString({ enum: request.tags }) });
      }

      const generative = getGenerativeModel(
        getAI(app, { backend: new GoogleAIBackend() }),
        {
          model,
          systemInstruction: AI_SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: Schema.object({ properties, optionalProperties: Object.keys(properties) }),
            temperature: 0.2,
          },
        },
        { timeout: TIMEOUT_MS },
      );

      const result = await generative.generateContent(buildAiPrompt(request));
      return parseGeminiJson(result.response.text());
    },
  };
}

/** Pasa el JSON de Gemini (`{fields:[{fieldId,value}], tags:[]}`) al formato interno. No valida contenido: eso lo hace `applyAiResult`. */
export function parseGeminiJson(text: string): AiResponse {
  const data: unknown = JSON.parse(text);
  const obj = (data && typeof data === 'object' ? data : {}) as { fields?: unknown; tags?: unknown };
  const values: Record<string, string> = {};
  if (Array.isArray(obj.fields)) {
    for (const item of obj.fields) {
      const { fieldId, value } = (item ?? {}) as { fieldId?: unknown; value?: unknown };
      if (typeof fieldId === 'string' && typeof value === 'string') values[fieldId] = value;
    }
  }
  const tags = Array.isArray(obj.tags) ? obj.tags.filter((t): t is string => typeof t === 'string') : [];
  return { values, tags };
}
