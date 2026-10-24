import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faHouse } from '@fortawesome/free-solid-svg-icons';

import Header from '../Header';
import Footer from '../Footer';

const NotFound = () => (
  <>
    <Header />
    <main className="main">
      <div className="empty-state">
        <FontAwesomeIcon icon={faCompass} />
        <h1>404</h1>
        <h2>Esta ruta no existe</h2>
        <p>Parece que te desviaste. Volvamos a la ruta principal.</p>
        <Link to="/" className="btn btn--primary">
          <FontAwesomeIcon icon={faHouse} /> Ir al inicio
        </Link>
      </div>
    </main>
    <Footer />
  </>
);

export default NotFound;
