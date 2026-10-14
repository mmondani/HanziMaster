import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { DESKTOP_NAV, LANGUAGES_NAV, isActive } from './nav-items';
import { IconButton } from '@/components/ui/icon-button';
import { ThemeSelector } from './theme-selector';

export interface SidebarUser {
  email: string;
  onSignOut: () => void;
}

/** Barra lateral fija (solo desktop; el CSS la oculta bajo 1024px). */
export function Sidebar({ user }: { user?: SidebarUser }) {
  const { pathname } = useLocation();
  const languages = LANGUAGES_NAV;
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">汉</span>
        Hanzi Master
      </div>
      <nav className="side-nav" aria-label="Principal">
        {DESKTOP_NAV.map((item) => (
          <Link key={item.to} to={item.to} aria-current={isActive(item, pathname) ? 'page' : undefined}>
            <item.icon className="ic" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="side-sep" />
      <div className="side-label" id="side-config">Configuración</div>
      <nav className="side-nav" aria-labelledby="side-config">
        <Link className="secondary" to={languages.to} aria-current={isActive(languages, pathname) ? 'page' : undefined}>
          <languages.icon className="ic" aria-hidden="true" />
          {languages.label}
        </Link>
      </nav>
      <div className="side-theme">
        <div className="side-label" id="side-theme">Apariencia</div>
        <ThemeSelector />
      </div>
      {user && (
        <div className="side-user">
          <span className="avatar" aria-hidden="true">{user.email.slice(0, 2).toUpperCase()}</span>
          <span className="grow small" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
          <IconButton aria-label="Cerrar sesión" onClick={user.onSignOut}><LogOut className="ic" aria-hidden="true" /></IconButton>
        </div>
      )}
    </aside>
  );
}
