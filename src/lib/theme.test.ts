import { applyTheme, getThemePreference, initTheme, setThemePreference } from './theme';

function mockSystem(dark: boolean) {
  const listeners: (() => void)[] = [];
  const state = { dark };
  window.matchMedia = ((query: string) => ({
    matches: state.dark && query.includes('dark'),
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  return { change(next: boolean) { state.dark = next; listeners.forEach((fn) => fn()); } };
}

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

describe('MJ3 · tema claro / oscuro / sistema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('MJ3-1 sin preferencia guardada rige el sistema', () => {
    mockSystem(true);
    expect(getThemePreference()).toBe('system');
    applyTheme(getThemePreference());
    expect(isDark()).toBe(true);
  });

  it('MJ3-2 claro y oscuro ignoran el sistema', () => {
    mockSystem(true);
    setThemePreference('light');
    expect(isDark()).toBe(false);
    mockSystem(false);
    setThemePreference('dark');
    expect(isDark()).toBe(true);
  });

  it('MJ3-3 la preferencia se recuerda y se aplica al iniciar', () => {
    mockSystem(false);
    setThemePreference('dark');
    document.documentElement.removeAttribute('data-theme');
    initTheme();
    expect(getThemePreference()).toBe('dark');
    expect(isDark()).toBe(true);
  });

  it('MJ3-4 en modo sistema se sigue el cambio del sistema; con una preferencia fija, no', () => {
    const system = mockSystem(false);
    initTheme();
    expect(isDark()).toBe(false);
    system.change(true);
    expect(isDark()).toBe(true);
    setThemePreference('light');
    system.change(true);
    expect(isDark()).toBe(false);
  });

  it('un valor guardado inválido o un almacenamiento que falla equivalen a "sistema"', () => {
    localStorage.setItem('hm:theme', 'violeta');
    expect(getThemePreference()).toBe('system');
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(getThemePreference()).toBe('system');
    spy.mockRestore();
  });
});
