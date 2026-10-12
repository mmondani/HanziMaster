# Datos que asumen las pantallas

> **Supuestos de UI**, no el modelo definitivo. El modelo real se define en `docs/arquitectura.md` durante la planificación; esto sirve para que los mockups y el plan hablen del mismo vocabulario. Todos los datos viven bajo el usuario autenticado (`users/{uid}/…`), según la restricción de privacidad de `vision.md`.

```ts
type FieldType = 'text' | 'list' | 'number';

interface FieldDef {            // I03
  id: string;
  name: string;                 // "Palabra", "Pinyin"…
  description?: string;
  type: FieldType;
  defaultValue?: string | number | string[];   // vacío si no se define
  tts: boolean;                 // muestra ícono de audio
  required: boolean;
  system?: 'word' | 'translation' | 'tags';    // los 3 campos base: no se eliminan
  order: number;
}

interface LayoutItem {          // I04
  fieldId: string;
  col: number; row: number;     // 1..6 / 1..n
  colSpan: number; rowSpan: number;
  textSize: 'S' | 'M' | 'L' | 'XL';
  align: 'left' | 'center' | 'right';
}
interface Layout { id: string; name: string; items: LayoutItem[]; }

interface Language {            // I01, I02
  id: string;
  name: string;                 // "Chino mandarín"
  code: string;                 // BCP-47 para TTS y atributo lang: "zh-CN", "ja-JP"
  fields: FieldDef[];           // ≥ 3 (palabra, traducción, tags)
  tags: string[];               // set de tags del idioma
  layouts: Layout[];
}

interface Flashcard {           // F03, F04
  id: string;
  languageId: string;
  values: Record<string /*fieldId*/, string | number | string[]>;
  tags: string[];               // 0..n (también es el campo base "Tags")
  createdAt: number; updatedAt: number;
}

interface TraversalMode {       // M02
  id: string;
  name: string;
  frontLayoutId: string;
  backLayoutId: string;
}
interface Deck {                // M02, M03
  id: string;
  languageId: string;
  name: string;
  cardIds: string[];
  modes: TraversalMode[];       // ≥ 1
  learning: 'free';             // "Libre" en el MVP; reservado para otras formas
}

// colección global (A02): emails que pueden autenticarse
interface AllowedEmail { email: string }
```

## Reglas que las pantallas dan por hechas

- Un idioma tiene **siempre ≥ 3 campos**: palabra, traducción y tags (`system`). La UI no permite eliminarlos, pero sí renombrarlos, cambiarles descripción/TTS/default y reordenarlos.
- `Palabra` y `Traducción` son **obligatorias**; Tags puede estar vacío.
- Una flashcard solo puede usarse en mazos del **mismo idioma**.
- Un mazo debe tener **≥ 1 modo de recorrida**; el recorrido elige las cartas en orden aleatorio (forma "Libre") y no persiste aciertos.
- Quitar un tag del idioma lo quita de las flashcards; eliminar una flashcard la quita de los mazos; eliminar un layout **no** borra los modos que lo usan: los mazos afectados quedan *no disponibles* (derivado, sin flag) hasta que se edita el modo y se elige otro layout; eliminar un idioma elimina sus flashcards y mazos.
- Búsqueda: coincidencia *contiene*, sin distinguir mayúsculas ni acentos, sobre el campo `word` y `translation` (en el cliente; el volumen esperado es bajo).
- Autocompletado con IA: recibe `word` + idioma + definición de campos + set de tags; devuelve valores para los campos vacíos y **como máximo 2 tags del set existente**. El usuario siempre puede editar el resultado antes de guardar.
