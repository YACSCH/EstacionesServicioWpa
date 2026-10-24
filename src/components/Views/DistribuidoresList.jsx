import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faSliders,
  faLocationCrosshairs,
  faRotate,
  faTriangleExclamation,
  faRoute,
  faFire,
} from '@fortawesome/free-solid-svg-icons';
import Mapa from '../Maps';
import { routeUrl, stationCoordinates, getDistanceKm, getUserLocation } from '../../utils/stations';
import { getStorage, setStorage, STORAGE_KEYS } from '../../utils/storage';

const RADIUS_OPTIONS = [2, 5, 10, 15, 25];
const PAGE_SIZE = 12;

const DistribuidoresList = ({ distribuidores }) => {
  const [position, setPosition] = useState(null);
  const [allWithDist, setAllWithDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(() => getStorage(STORAGE_KEYS.home.radius, 5));
  const [comuna, setComuna] = useState('all');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const allStores = useMemo(() => (distribuidores ? Object.values(distribuidores) : []), [distribuidores]);

  useEffect(() => setStorage(STORAGE_KEYS.home.radius, radius), [radius]);

  const locate = useCallback(
    async (force = false) => {
      if (!allStores.length) {
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

        const withDistance = allStores
          .map((store) => {
            const { latitud, longitud } = store.ubicacion || {};
            if (!latitud || !longitud) return null;
            const distance = getDistanceKm(
              userPos.lat,
              userPos.lon,
              parseFloat(latitud),
              parseFloat(longitud)
            );
            return { ...store, _distance: distance };
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
    [allStores]
  );

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [radius, comuna, query]);

  const comunas = useMemo(
    () =>
      [
        ...new Set(
          allWithDist
            .filter((store) => store._distance <= radius)
            .map((store) => store.ubicacion?.nombre_comuna || store.nombre_comuna)
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [allWithDist, radius]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allWithDist.filter((store) => {
      const storeComuna = store.ubicacion?.nombre_comuna || store.nombre_comuna;
      const inRadius = store._distance <= radius;
      const matchesComuna = comuna === 'all' || storeComuna === comuna;
      const haystack = [store.nombre_empresa, storeComuna, store.ubicacion?.direccion]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !term || haystack.includes(term);
      return inRadius && matchesComuna && matchesQuery;
    });
  }, [allWithDist, radius, comuna, query]);

  const visibleStores = filtered.slice(0, visible);
  const mapStores = filtered.filter((store) => stationCoordinates(store)).slice(0, 300);

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            <FontAwesomeIcon icon={faFire} /> Cercanas a tu ubicación
          </span>
          <h1>Puntos de venta de calefacción</h1>
          <p>Mostrando puntos de venta dentro del radio seleccionado desde tu ubicación.</p>
        </div>
        <span className="count-pill">{filtered.length} puntos</span>
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
          <label className="search-field" style={{ borderRadius: '999px', padding: '0.5rem 0.8rem' }}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="search"
              placeholder="Buscar empresa o dirección"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar puntos de venta"
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
          <h2>No hay puntos cercanos</h2>
          <p>Amplía el radio de búsqueda o actualiza tu ubicación.</p>
          <button type="button" className="btn btn--primary" onClick={() => setRadius(25)}>
            Ampliar a 25 km
          </button>
        </div>
      ) : (
        !error && (
          <div className="home-layout">
            <div className="panel panel--map panel--map--sticky">
              <Mapa data={mapStores} center={position} userPosition={position} />
              <p className="map-caption">
                <FontAwesomeIcon icon={faLocationCrosshairs} /> Puntos dentro de {radius} km de tu
                ubicación
              </p>
            </div>

            <div className="home-list">
              <header className="section-heading">
                <div>
                  <h2>Puntos cercanos</h2>
                  <p>
                    {filtered.length} resultados · Mostrando {visibleStores.length}
                    {filtered.length > visibleStores.length ? ` de ${filtered.length}` : ''}
                  </p>
                </div>
              </header>

              <div className="cards-grid">
                {visibleStores.map((store, index) => {
                  const coords = stationCoordinates(store);
                  const storeComuna = store.ubicacion?.nombre_comuna || store.nombre_comuna;
                  const address = [store.ubicacion?.direccion, store.direccion_numero]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <article
                      className="station-card"
                      key={store.id || `${store.nombre_empresa}-${index}`}
                    >
                      <header className="station-card__header">
                        <div className="station-card__brand">
                          <span className="station-card__avatar station-card__avatar--store" aria-hidden="true">
                            <FontAwesomeIcon icon={faFire} />
                          </span>
                          <div>
                            <h3>{store.nombre_empresa || 'Punto de venta'}</h3>
                            <p className="station-card__comuna">
                              <FontAwesomeIcon icon={faLocationCrosshairs} />
                              {storeComuna || 'Sin comuna'} · {store._distance?.toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      </header>

                      <p className="station-card__address">{address || 'Dirección no disponible'}</p>

                      <p className="station-card__hours">
                        <FontAwesomeIcon icon={faRoute} />
                        {store.horario_atencion || 'Horario no informado'}
                      </p>

                      <footer className="station-card__actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={!coords}
                          onClick={() =>
                            coords &&
                            window.open(routeUrl(coords[0], coords[1]), '_blank', 'noopener,noreferrer')
                          }
                        >
                          <FontAwesomeIcon icon={faRoute} /> Cómo llegar
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>

              {visible < filtered.length && (
                <div className="load-more">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setVisible((count) => count + PAGE_SIZE)}
                  >
                    <FontAwesomeIcon icon={faSliders} /> Mostrar más puntos (
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

export default DistribuidoresList;
