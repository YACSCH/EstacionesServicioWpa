import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump } from '@fortawesome/free-solid-svg-icons';
import InstallPrompt from '../InstallPrompt';
import ThemeToggle from '../ThemeToggle';

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

        <div className="site-header__actions">
          <InstallPrompt />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
