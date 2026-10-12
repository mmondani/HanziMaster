import { Link, useLocation } from 'react-router-dom';
import { MOBILE_NAV, isActive } from './nav-items';

/** Barra inferior de 3 ítems (solo mobile; el CSS la oculta desde 1024px). */
export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {MOBILE_NAV.map((item) => (
        <Link key={item.to} to={item.to} aria-current={isActive(item, pathname) ? 'page' : undefined}>
          <span className="pill"><item.icon className="ic" aria-hidden="true" /></span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
