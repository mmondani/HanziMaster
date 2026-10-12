import { vi } from 'vitest';

/** Estado simulado de `useRegisterSW` para tests; se modifica desde el test. */
export const pwaState = { needRefresh: false, updateServiceWorker: vi.fn() };

export function useRegisterSW() {
  return {
    needRefresh: [pwaState.needRefresh, vi.fn()] as const,
    offlineReady: [false, vi.fn()] as const,
    updateServiceWorker: pwaState.updateServiceWorker,
  };
}
