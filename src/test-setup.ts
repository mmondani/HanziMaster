import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Las pantallas se cargan con `import()` bajo demanda: con la máquina cargada el segundo por defecto puede quedarse corto.
configure({ asyncUtilTimeout: 4000 });

// jsdom no pinta canvas (y avisa por consola si se pide un contexto): el dibujo se prueba por su estado, no por los píxeles.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

// Cada test parte sin estado persistido (idioma activo, etc.).
afterEach(() => {
  localStorage.clear();
});
