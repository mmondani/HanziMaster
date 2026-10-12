import { MAX_AI_TAGS, type AiRequest } from '@/lib/domain/ai-completion';

const TYPE_HINT = {
  text: 'texto',
  list: 'lista de elementos separados por comas',
  number: 'número',
} as const;

export const AI_SYSTEM_INSTRUCTION =
  'Eres un asistente para estudiantes de idiomas que completa flashcards de vocabulario. ' +
  'Responde solo con los datos pedidos, con precisión y sin inventar: si no estás seguro de un campo, no lo incluyas. ' +
  'Las explicaciones, traducciones y definiciones se escriben en español, salvo que la descripción del campo indique otra cosa.';

/** Texto que se envía a Gemini para una palabra; la estructura de la respuesta la fija el `responseSchema`. */
export function buildAiPrompt(request: AiRequest): string {
  const fields = request.fields
    .map((f) => `- "${f.id}" (${f.name}; ${TYPE_HINT[f.type]})${f.description ? `: ${f.description}` : ''}`)
    .join('\n');
  const tags = request.tags.length > 0
    ? `Elige como máximo ${MAX_AI_TAGS} tags de esta lista, solo los que mejor describan la palabra (si ninguno encaja, no elijas ninguno): ${request.tags.map((t) => `"${t}"`).join(', ')}.`
    : 'No hay tags disponibles: deja la lista de tags vacía.';
  return [
    `Idioma que se estudia: ${request.languageName} (${request.languageCode}).`,
    `${request.wordFieldName}: ${JSON.stringify(request.word)}`,
    '',
    'Completa estos campos de la flashcard, usando el id indicado en `fieldId`:',
    fields || '(ninguno)',
    '',
    tags,
  ].join('\n');
}
