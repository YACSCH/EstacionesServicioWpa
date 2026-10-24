import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

const links = [
  { href: 'https://github.com/YACSCH', icon: faGithub, label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/yamil-castillo-28522221/', icon: faLinkedin, label: 'LinkedIn' },
  { href: 'mailto:yamilcs@gmail.com', icon: faEnvelope, label: 'Email' },
];

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__brand">
        <strong>Estaciones de Servicio</strong>
        <span>Datos de la Comisión Nacional de Energía (CNE).</span>
      </div>
      <ul className="site-footer__links">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
              <FontAwesomeIcon icon={link.icon} />
            </a>
          </li>
        ))}
      </ul>
      <p className="site-footer__copy">© {new Date().getFullYear()} YACS</p>
    </div>
  </footer>
);

export default Footer;
