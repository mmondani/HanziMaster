import type { CSSProperties } from 'react';
import { GRID_COLUMNS, usedRows } from '@/lib/domain/layout-grid';
import { isCjk, isTargetLanguageField } from '@/lib/domain/flashcard-form';
import type { FieldValue, Flashcard, Language, Layout, LayoutItem, TextAlign, TextSize } from '@/lib/types';
import { TtsButton } from './tts-button';

const FONT_SIZE: Record<TextSize, string> = { S: '0.875rem', M: '1.125rem', L: '1.75rem', XL: 'clamp(3rem, 14vw, 6rem)' };
const ALIGN_ITEMS: Record<TextAlign, CSSProperties['alignItems']> = { left: 'flex-start', center: 'center', right: 'flex-end' };
const JUSTIFY: Record<TextAlign, CSSProperties['justifyContent']> = { left: 'flex-start', center: 'center', right: 'flex-end' };

function asText(value: FieldValue | undefined): string {
  if (value === undefined) return '';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Elementos de un campo de lista, sin vacíos. */
function asLines(value: FieldValue | undefined): string[] {
  return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
}

export interface FlashcardViewProps {
  language: Language;
  card: Pick<Flashcard, 'values' | 'tags'>;
  layout: Layout;
}

/**
 * Renderiza una flashcard según un layout (qué campos, dónde y de qué tamaño).
 * Es puro respecto del giro: no maneja la cara visible. Los campos con text-to-speech llevan su botón de audio.
 */
export function FlashcardView({ language, card, layout }: FlashcardViewProps) {
  const rows = Math.max(usedRows(layout.items), 1);
  const cjk = isCjk(language);

  function renderItem(item: LayoutItem) {
    const field = language.fields.find((f) => f.id === item.fieldId);
    if (!field) return null;
    const isTags = field.system === 'tags';
    const text = isTags ? '' : asText(card.values[field.id]);
    if (!isTags && !text) return null;
    if (isTags && card.tags.length === 0) return null;
    const target = isTargetLanguageField(field);
    const textStyle: CSSProperties = { fontSize: FONT_SIZE[item.textSize], fontWeight: item.textSize === 'XL' || item.textSize === 'L' ? 700 : 500, lineHeight: 1.15, overflowWrap: 'anywhere' };
    const lines = field.type === 'list' && !isTags ? asLines(card.values[field.id]) : null;
    return (
      <div
        key={item.fieldId}
        data-field={field.id}
        style={{
          gridColumn: `${item.col} / span ${item.colSpan}`,
          gridRow: `${item.row} / span ${item.rowSpan}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: JUSTIFY[item.align],
          gap: 'var(--sp-2)',
          minWidth: 0,
          textAlign: item.align,
        }}
      >
        {isTags ? (
          <span className="tags" style={{ justifyContent: JUSTIFY[item.align] }}>
            {card.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </span>
        ) : lines ? (
          // Campo de lista: un elemento debajo del otro.
          <ul
            className={target && cjk ? 'han' : undefined}
            lang={target ? language.code : undefined}
            style={{ ...textStyle, listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25em', alignItems: ALIGN_ITEMS[item.align], minWidth: 0, maxHeight: '100%', overflowY: 'auto' }}
          >
            {lines.map((line, i) => <li key={`${i}-${line}`}>{line}</li>)}
          </ul>
        ) : (
          <span className={target && cjk ? 'han' : undefined} lang={target ? language.code : undefined} style={textStyle}>
            {text}
          </span>
        )}
        {field.tts && text && <TtsButton text={text} lang={language.code} label={`Escuchar ${field.name.toLowerCase()}`} />}
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap: 'var(--sp-2)',
      }}
    >
      {layout.items.map(renderItem)}
    </div>
  );
}
