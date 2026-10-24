import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotate, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import HomeList from '../Views/HomeList';

const SkeletonGrid = () => (
  <div className="page">
    <div className="skeleton skeleton--hero" />
    <div className="cards-grid">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div className="skeleton skeleton--card" key={item} />
      ))}
    </div>
  </div>
);

const Main = ({ data, type, loading, error, onRetry }) => {
  return (
    <main className="main">
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <h2>No pudimos cargar la información</h2>
          <p>{error}</p>
          {onRetry && (
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <FontAwesomeIcon icon={faRotate} /> Reintentar
            </button>
          )}
        </div>
      ) : (
        <HomeList datos={data} />
      )}
    </main>
  );
};

export default Main;
