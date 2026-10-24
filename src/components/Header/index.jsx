import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGasPump } from '@fortawesome/free-solid-svg-icons'
import InstallPrompt from '../InstallPrompt'

const Header = () => {
  return (
    <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <p>
            <FontAwesomeIcon icon={faGasPump} className='header-icon'/>
            <span>Estaciones de Servicio Santiago</span>
          </p>
          <InstallPrompt />
        </div>
        <nav>
            <Link to="/" className='nav-item'>Inicio</Link>
            <Link to="/estaciones" className='nav-item'>Estaciones</Link>
            <Link to="/distribuidores" className='nav-item'>Calefacción</Link>
        </nav>
    </header>
  )
}

export default Header