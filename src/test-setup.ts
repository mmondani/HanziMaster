import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Las pantallas se cargan con `import()` bajo demanda: con la máquina cargada el segundo por defecto puede quedarse corto.
configure({ asyncUtilTimeout: 4000 });

// Cada test parte sin estado persistido (idioma activo, etc.).
afterEach(() => {
  localStorage.clear();
});
