/** Aplica el tema claro/oscuro del sistema (`data-theme` en <html>) y lo sigue si cambia. */
export function initTheme(): void {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    if (query.matches) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  };
  apply();
  query.addEventListener('change', apply);
}
