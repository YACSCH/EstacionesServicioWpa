import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationCrosshairs,
  faRotate,
  faTriangleExclamation,
  faGasPump,
  faRoute,
} from '@fortawesome/free-solid-svg-icons';
import Mapa from '../Maps';
import StationCard from '../StationCard';
import {
  FUEL_OPTIONS,
  getDistanceKm,
  getNumericPrice,
  getUserLocation,
  hasFuel,
} from '../../utils/stations';

const RADIUS_OPTIONS = [2, 5, 10, 15];

const HomeList = ({ datos }) => {
  const [position, setPosition] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5);
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  const availableStations = useMemo(
    () => (datos ? Object.values(datos) : []),
    [datos]
  );

  const locate = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const userPos = await getUserLocation();
        setPosition([userPos.lat, userPos.lon]);

        const withDistance = availableStations
          .map((station) => {
            const { latitud, longitud } = station.ubicacion || {};
            if (!latitud || !longitud) return null;
            const distance = getDistanceKm(
              userPos.lat,
              userPos.lon,
              parseFloat(latitud),
              parseFloat(longitud)
            );
            return { ...station, _distance: distance };
          })
          .filter(Boolean)
          .sort((a, b) => a._distance - b._distance);

        setStations(withDistance);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'No pudimos obtener tu ubicación.');
      } finally {
        setLoading(false);
      }
    },
    [availableStations]
  );

  useEffect(() => {
    if (availableStations.length) {
      locate();
    } else {
      setLoading(false);
    }
  }, [availableStations, locate]);

  const filteredStations = useMemo(() => {
    let result = stations.filter((station) => station._distance <= radius);

    if (fuelFilter !== 'all') {
      result = result.filter((station) => hasFuel(station, fuelFilter));
    }

    if (sortBy === 'distance') {
      result.sort((a, b) => a._distance - b._distance);
    } else {
      const fuelKey = sortBy.replace('price_', '');
      result.sort((a, b) => {
        const priceA = getNumericPrice(a, fuelKey) ?? Infinity;
        const priceB = getNumericPrice(b, fuelKey) ?? Infinity;
        return priceA - priceB;
      });
    }

    return result;
  }, [stations, fuelFilter, sortBy, radius]);

  const cheapest = useMemo(() => {
    if (!filteredStations.length) return null;
    const key = fuelFilter !== 'all' ? fuelFilter : '93';
    return filteredStations.reduce(
      (best, station) => {
        const price = getNumericPrice(station, key);
        if (price === null) return best;
        if (best === null || price < best.price) {
          return {
            price,
            brand:
              station.distribuidor?.marca ||
              station.distribuidor?.nombre ||
              'Estación',
          };
        }
        return best;
      },
      null
    );
  }, [filteredStations, fuelFilter]);

  return (
    <section className="page page--home">
      <div className="hero">
        <div className="hero__content">
          <span className="hero__badge">
            <FontAwesomeIcon icon={faGasPump} /> Datos oficiales CNE
          </span>
          <h1>Tu estación más cercana, al mejor precio</h1>
          <p>Compara precios de combustibles en Santiago y llega con un solo toque.</p>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <strong>{filteredStations.length}</strong>
            <span>estaciones</span>
          </div>
          <div className="stat">
            <strong>{radius} km</strong>
            <span>a la redonda</span>
          </div>
          {cheapest && (
            <div className="stat stat--highlight">
              <strong>${cheapest.price.toLocaleString('es-CL')}</strong>
              <span>
                {FUEL_OPTIONS.find((fuel) => fuel.key === (fuelFilter !== 'all' ? fuelFilter : '93'))?.name}{' '}
                desde · {cheapest.brand}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="chip-group" role="group" aria-label="Radio de búsqueda">
          <span className="toolbar__label">Radio</span>
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip${radius === option ? ' chip--active' : ''}`}
              onClick={() => setRadius(option)}
            >
              {option} km
            </button>
          ))}
        </div>

        <div className="chip-group chip-group--scroll" role="group" aria-label="Filtrar por combustible">
          <span className="toolbar__label">Combustible</span>
          <button
            type="button"
            className={`chip${fuelFilter === 'all' ? ' chip--active' : ''}`}
            onClick={() => setFuelFilter('all')}
          >
            Todos
          </button>
          {FUEL_OPTIONS.map((fuel) => (
            <button
              key={fuel.key}
              type="button"
              className={`chip${fuelFilter === fuel.key ? ' chip--active' : ''}`}
              onClick={() => setFuelFilter(fuel.key)}
            >
              {fuel.name}
            </button>
          ))}
        </div>

        <div className="toolbar__right">
          <label className="select-field">
            <span>Ordenar por</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="distance">Distancia</option>
              <option value="price_93">Precio 93</option>
              <option value="price_95">Precio 95</option>
              <option value="price_DI">Precio diésel</option>
            </select>
          </label>
          <button type="button" className="btn btn--primary btn--sm" onClick={locate}>
            <FontAwesomeIcon icon={faLocationCrosshairs} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <div>
            <strong>No pudimos acceder a tu ubicación</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={locate}>
            <FontAwesomeIcon icon={faRotate} /> Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="home-layout">
          <div className="panel panel--map skeleton skeleton--map" />
          <div className="cards-grid">
            {[0, 1, 2, 3].map((item) => (
              <div className="skeleton skeleton--card" key={item} />
            ))}
          </div>
        </div>
      ) : !error && filteredStations.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faRoute} />
          <h2>Sin estaciones en este radio</h2>
          <p>Amplía el radio de búsqueda o cambia el filtro de combustible.</p>
          <button type="button" className="btn btn--primary" onClick={() => setRadius(15)}>
            Ampliar a 15 km
          </button>
        </div>
      ) : (
        !error && (
          <div className="home-layout">
            <div className="panel panel--map panel--map--sticky">
              <Mapa
                data={filteredStations}
                center={position}
                userPosition={position}
                showPrices
                zoom={13}
              />
              <p className="map-caption">
                <FontAwesomeIcon icon={faLocationCrosshairs} /> Tu ubicación y las estaciones
                dentro de {radius} km
              </p>
            </div>

            <div className="home-list">
              <header className="section-heading">
                <div>
                  <h2>Estaciones cercanas</h2>
                  <p>{filteredStations.length} resultados ordenados por {sortBy === 'distance' ? 'distancia' : 'precio'}</p>
                </div>
              </header>
              <div className="cards-grid">
                {filteredStations.map((station, index) => (
                  <StationCard
                    key={station.id || `${station.distribuidor?.marca}-${index}`}
                    station={station}
                    distance={station._distance}
                    highlightedFuel={fuelFilter !== 'all' ? fuelFilter : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      )}
    </section>
  );
};

export default HomeList;
