import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faSliders,
  faLocationCrosshairs,
  faRotate,
  faTriangleExclamation,
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
  stationCoordinates,
} from '../../utils/stations';
import { getStorage, setStorage, STORAGE_KEYS } from '../../utils/storage';

const RADIUS_OPTIONS = [2, 5, 10, 15, 25];
const PAGE_SIZE = 12;

const EstacionList = ({ estaciones }) => {
  const [position, setPosition] = useState(null);
  const [allWithDist, setAllWithDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(() => getStorage(STORAGE_KEYS.home.radius, 5));
  const [fuelFilter, setFuelFilter] = useState('all');
  const [comuna, setComuna] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const allStations = useMemo(() => (estaciones ? Object.values(estaciones) : []), [estaciones]);

  useEffect(() => setStorage(STORAGE_KEYS.home.radius, radius), [radius]);

  const locate = useCallback(
    async (force = false) => {
      if (!allStations.length) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const cached = !force ? getStorage(STORAGE_KEYS.location, null) : null;
        let userPos = cached;
        if (!userPos) {
          userPos = await getUserLocation();
          setStorage(STORAGE_KEYS.location, userPos);
        } else {
          getUserLocation()
            .then((fresh) => {
              setStorage(STORAGE_KEYS.location, fresh);
              setPosition([fresh.lat, fresh.lon]);
            })
            .catch(() => {});
        }
        setPosition([userPos.lat, userPos.lon]);

        const withDistance = allStations
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

        setAllWithDist(withDistance);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'No pudimos obtener tu ubicación.');
      } finally {
        setLoading(false);
      }
    },
    [allStations]
  );

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [radius, fuelFilter, comuna, query, sortBy]);

  const comunas = useMemo(
    () =>
      [
        ...new Set(
          allWithDist.filter((station) => station._distance <= radius).map((station) => station.nombre_comuna)
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [allWithDist, radius]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let result = allWithDist.filter((station) => {
      const inRadius = station._distance <= radius;
      const matchesFuel = fuelFilter === 'all' || hasFuel(station, fuelFilter);
      const matchesComuna = comuna === 'all' || station.nombre_comuna === comuna;
      const haystack = [
        station.distribuidor?.marca,
        station.distribuidor?.nombre,
        station.nombre_comuna,
        station.ubicacion?.direccion,
        station.direccion_calle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      return inRadius && matchesFuel && matchesComuna && matchesQuery;
    });

    if (sortBy === 'distance') {
      result.sort((a, b) => a._distance - b._distance);
    } else if (sortBy === 'comuna') {
      result.sort((a, b) => (a.nombre_comuna || '').localeCompare(b.nombre_comuna || ''));
    } else if (sortBy === 'marca') {
      result.sort((a, b) =>
        (a.distribuidor?.marca || '').localeCompare(b.distribuidor?.marca || '')
      );
    } else {
      const key = sortBy.replace('price_', '');
      result.sort(
        (a, b) => (getNumericPrice(a, key) ?? Infinity) - (getNumericPrice(b, key) ?? Infinity)
      );
    }

    return result;
  }, [allWithDist, radius, fuelFilter, comuna, query, sortBy]);

  const visibleStations = filtered.slice(0, visible);
  const mapStations = filtered.filter((station) => stationCoordinates(station)).slice(0, 300);

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Cercanas a tu ubicación</span>
          <h1>Estaciones de servicio</h1>
          <p>Mostrando estaciones dentro del radio seleccionado desde tu ubicación.</p>
        </div>
        <span className="count-pill">{filtered.length} estaciones</span>
      </header>

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
            <span>Comuna</span>
            <select value={comuna} onChange={(event) => setComuna(event.target.value)}>
              <option value="all">Todas</option>
              {comunas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span>Ordenar por</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="distance">Distancia</option>
              <option value="comuna">Comuna</option>
              <option value="marca">Marca</option>
              <option value="price_93">Precio 93</option>
              <option value="price_95">Precio 95</option>
              <option value="price_DI">Precio diésel</option>
            </select>
          </label>
          <label className="search-field" style={{ borderRadius: '999px', padding: '0.5rem 0.8rem' }}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="search"
              placeholder="Buscar marca o dirección"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar estaciones"
            />
          </label>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => locate(true)}>
            <FontAwesomeIcon icon={faLocationCrosshairs} />
            Actualizar ubicación
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert--error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <div>
            <strong>Necesitamos tu ubicación</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => locate(true)}>
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
      ) : !error && filtered.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faRoute} />
          <h2>No hay estaciones cercanas</h2>
          <p>Amplía el radio de búsqueda o actualiza tu ubicación.</p>
          <button type="button" className="btn btn--primary" onClick={() => setRadius(25)}>
            Ampliar a 25 km
          </button>
        </div>
      ) : (
        !error && (
          <div className="home-layout">
            <div className="panel panel--map panel--map--sticky">
              <Mapa data={mapStations} center={position} userPosition={position} showPrices />
              <p className="map-caption">
                <FontAwesomeIcon icon={faLocationCrosshairs} /> Estaciones dentro de {radius} km de
                tu ubicación
              </p>
            </div>

            <div className="home-list">
              <header className="section-heading">
                <div>
                  <h2>Estaciones cercanas</h2>
                  <p>
                    {filtered.length} resultados · Mostrando {visibleStations.length}
                    {filtered.length > visibleStations.length ? ` de ${filtered.length}` : ''}
                  </p>
                </div>
              </header>

              <div className="cards-grid">
                {visibleStations.map((station, index) => (
                  <StationCard
                    key={station.id || `${station.distribuidor?.marca}-${index}`}
                    station={station}
                    distance={station._distance}
                    highlightedFuel={fuelFilter !== 'all' ? fuelFilter : undefined}
                  />
                ))}
              </div>

              {visible < filtered.length && (
                <div className="load-more">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setVisible((count) => count + PAGE_SIZE)}
                  >
                    <FontAwesomeIcon icon={faSliders} /> Mostrar más estaciones (
                    {filtered.length - visible} restantes)
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </section>
  );
};

export default EstacionList;
