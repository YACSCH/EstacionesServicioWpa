import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import InstallPrompt from '../InstallPrompt';
import ThemeToggle from '../ThemeToggle';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/estaciones', label: 'Estaciones' },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="brand" end>
          <span className="brand__icon">
            <FontAwesomeIcon icon={faGasPump} />
          </span>
          <span className="brand__text">
            <strong>Estaciones</strong>
            <small>de Servicio</small>
          </span>
        </NavLink>

        <nav className={`site-nav${menuOpen ? ' site-nav--open' : ''}`} aria-label="Navegación principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <InstallPrompt />
          <ThemeToggle />
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
