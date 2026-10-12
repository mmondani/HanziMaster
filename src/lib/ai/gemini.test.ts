import { buildAiRequest } from '@/lib/domain/ai-completion';
import { chinese } from '@/test/fixtures';
import { buildAiPrompt } from './ai-prompt';
import { parseGeminiJson } from './gemini-completer';

describe('buildAiPrompt', () => {
  it('incluye la palabra, los campos con su descripción y los tags permitidos', () => {
    const prompt = buildAiPrompt(buildAiRequest(chinese(), '朋友'));
    expect(prompt).toContain('Chino mandarín (zh-CN)');
    expect(prompt).toContain('"朋友"');
    expect(prompt).toContain('"pinyin" (Pinyin; texto): Pronunciación con tonos');
    expect(prompt).toContain('"Saludos", "Escuela"');
    expect(prompt).toContain('como máximo 2 tags');
  });

  it('sin tags en el idioma pide dejar la lista vacía', () => {
    expect(buildAiPrompt(buildAiRequest(chinese({ tags: [] }), '朋友'))).toContain('No hay tags disponibles');
  });
});

describe('parseGeminiJson', () => {
  it('convierte la respuesta estructurada al formato interno', () => {
    expect(parseGeminiJson('{"fields":[{"fieldId":"pinyin","value":"péngyou"},{"fieldId":"translation","value":"amigo"}],"tags":["Saludos"]}')).toEqual({
      values: { pinyin: 'péngyou', translation: 'amigo' },
      tags: ['Saludos'],
    });
  });

  it('ignora elementos mal formados', () => {
    expect(parseGeminiJson('{"fields":[null,{"fieldId":1,"value":"x"},{"fieldId":"a"}],"tags":["T",3]}')).toEqual({ values: {}, tags: ['T'] });
    expect(parseGeminiJson('{}')).toEqual({ values: {}, tags: [] });
    expect(parseGeminiJson('null')).toEqual({ values: {}, tags: [] });
  });

  it('lanza si no es JSON (el formulario lo muestra como error de IA)', () => {
    expect(() => parseGeminiJson('no es json')).toThrow();
  });
});
