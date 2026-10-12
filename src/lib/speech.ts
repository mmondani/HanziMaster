export type SpeakResult = 'ok' | 'no-voice' | 'unsupported';

/**
 * Reproduce un texto con la voz del dispositivo (Web Speech API).
 * Devuelve `no-voice` si el dispositivo declara voces pero ninguna para el idioma.
 */
export function speak(text: string, lang: string): SpeakResult {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return 'unsupported';
  const synth = window.speechSynthesis;
  const base = lang.split('-')[0].toLowerCase();
  const voices = synth.getVoices();
  // Las voces pueden cargarse tarde: con la lista vacía se intenta igual.
  if (voices.length > 0 && !voices.some((v) => v.lang.toLowerCase().startsWith(base))) return 'no-voice';
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  synth.speak(utterance);
  return 'ok';
}
