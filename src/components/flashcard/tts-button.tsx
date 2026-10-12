import { Volume2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { speak } from '@/lib/speech';

export interface TtsButtonProps {
  text: string;
  /** Código BCP-47 del idioma (`zh-CN`). */
  lang: string;
  /** Qué se escucha, para el nombre accesible ("Escuchar palabra"). */
  label: string;
  className?: string;
}

/** Reproduce el texto de un campo sin girar la carta. Avisa si el dispositivo no tiene voz para el idioma. */
export function TtsButton({ text, lang, label, className }: TtsButtonProps) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={['tts', className].filter(Boolean).join(' ')}
      data-no-flip
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        const result = speak(text, lang);
        if (result !== 'ok') toast.show({ message: 'Tu dispositivo no tiene voz para este idioma' });
      }}
    >
      <Volume2 className="ic" aria-hidden="true" />
    </button>
  );
}
