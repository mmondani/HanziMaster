/** Estado de un recorrido de mazo (forma "Libre": orden aleatorio, sin registrar aciertos). */
export interface StudyState {
  /** Ids de las flashcards en el orden en que se recorren. */
  order: string[];
  index: number;
  /** ¿Se ve el reverso de la carta actual? */
  flipped: boolean;
  /** Se avanzó más allá de la última carta (fin del mazo). */
  finished: boolean;
}

export type StudyAction =
  | { type: 'flip' }
  | { type: 'next' }
  | { type: 'prev' }
  /** Vuelve a empezar con un nuevo orden. */
  | { type: 'restart'; order: string[] };

export function initStudy(order: string[]): StudyState {
  return { order, index: 0, flipped: false, finished: false };
}

export function studyReducer(state: StudyState, action: StudyAction): StudyState {
  if (action.type === 'restart') return initStudy(action.order);
  if (state.finished) return state;
  switch (action.type) {
    case 'flip':
      return { ...state, flipped: !state.flipped };
    case 'next':
      // Cada carta nueva se muestra por el frente; pasar de la última termina el mazo.
      return state.index >= state.order.length - 1
        ? { ...state, finished: true }
        : { ...state, index: state.index + 1, flipped: false };
    case 'prev':
      return state.index === 0 ? state : { ...state, index: state.index - 1, flipped: false };
  }
}
