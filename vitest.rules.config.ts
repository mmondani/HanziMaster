import { defineConfig } from 'vitest/config';

// Tests de reglas de Firestore: requieren el emulador (npm run test:rules).
export default defineConfig({
  test: { environment: 'node', globals: true, include: ['tests/rules/**/*.test.ts'] },
});
