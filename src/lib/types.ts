export type FieldType = 'text' | 'list' | 'number';
export type SystemField = 'word' | 'translation' | 'tags';
export type FieldValue = string | number | string[];

export interface FieldDef {
  id: string;
  name: string;
  description?: string;
  type: FieldType;
  defaultValue?: FieldValue;
  tts: boolean;
  required: boolean;
  system?: SystemField;
  order: number;
}

export type TextSize = 'S' | 'M' | 'L' | 'XL';
export type TextAlign = 'left' | 'center' | 'right';

export interface LayoutItem {
  fieldId: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  textSize: TextSize;
  align: TextAlign;
}

export interface Layout {
  id: string;
  name: string;
  items: LayoutItem[];
}

export interface Language {
  id: string;
  name: string;
  /** BCP-47 para text-to-speech y atributo lang, ej. "zh-CN". */
  code: string;
  fields: FieldDef[];
  tags: string[];
  layouts: Layout[];
  /** Modos de recorrida que se copian a cada mazo nuevo del idioma. Pueden faltar en idiomas anteriores a la iteración 001. */
  defaultModes?: TraversalMode[];
}

export interface Flashcard {
  id: string;
  languageId: string;
  values: Record<string, FieldValue>;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TraversalMode {
  id: string;
  name: string;
  frontLayoutId: string;
  backLayoutId: string;
}

export interface Deck {
  id: string;
  languageId: string;
  name: string;
  /** Alta del mazo (ms). Falta en los mazos creados antes de la iteración 001: cuentan como los más antiguos. */
  createdAt?: number;
  cardIds: string[];
  modes: TraversalMode[];
  /** "Libre" en el MVP; reservado para otras formas de aprendizaje. */
  learning: 'free';
}

export interface AllowedEmail {
  email: string;
}
