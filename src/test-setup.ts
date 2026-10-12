import '@testing-library/jest-dom/vitest';

// Cada test parte sin estado persistido (idioma activo, etc.).
afterEach(() => {
  localStorage.clear();
});
