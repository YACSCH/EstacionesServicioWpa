import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { getStorage, setStorage, getStoredLocation, setStoredLocation, STORAGE_KEYS } from '../../utils/storage';

const RADIUS_OPTIONS = [2, 5, 10, 15];
const PAGE_SIZE = 60;

const readRadius = () => {
  const stored = Number(getStorage(STORAGE_KEYS.home.radius, 5));
  return RADIUS_OPTIONS.includes(stored) ? stored : 5;
};

const readFuel = () => {
  const stored = getStorage(STORAGE_KEYS.home.fuel, 'all');
  return stored === 'all' || FUEL_OPTIONS.some((fuel) => fuel.key === stored) ? stored : 'all';
};

const HomeList = ({ datos, onRefresh }) => {
  const [position, setPosition] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [radius, setRadius] = useState(readRadius);
  const [fuelFilter, setFuelFilter] = useState(readFuel);
  // Permite ver todo el país cuando no hay estaciones en el radio máximo.
  const [unlimited, setUnlimited] = useState(false);
  // Render incremental: evita montar cientos de tarjetas y marcadores de golpe.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Solo el primer montaje muestra el esqueleto; al recargar datos no.
  const hasLoadedRef = useRef(false);
  // Última posición en memoria: evita perderla si localStorage falla o al
  // recargar datos sin volver a pedir el GPS.
  const positionRef = useRef(null);

  const availableStations = useMemo(
    () => (datos ? Object.values(datos) : []),
    [datos]
  );

  useEffect(() => setStorage(STORAGE_KEYS.home.radius, radius), [radius]);
  useEffect(() => setStorage(STORAGE_KEYS.home.fuel, fuelFilter), [fuelFilter]);

  // Calcula distancias y ordena. Se reutiliza al refrescar la ubicación en
  // segundo plano para que position y _distance nunca queden desincronizados.
  const withDistances = useCallback((list, userPos) => {
    return list
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
  }, []);

  const applyPosition = useCallback(
    (userPos) => {
      positionRef.current = userPos;
      setPosition([userPos.lat, userPos.lon]);
      setStations(withDistances(availableStations, userPos));
    },
    [availableStations, withDistances]
  );

  const showStationsWithoutLocation = useCallback(() => {
    positionRef.current = null;
    setPosition(null);
    setStations(availableStations.map((station) => ({ ...station, _distance: null })));
  }, [availableStations]);

  // Recalcula la lista con la ubicación guardada o solicita ubicación al ingresar.
  const locate = useCallback(
    async ({ silent = false, autoRequest = false } = {}) => {
      if (!silent) setLoading(true);
      if (!silent) setError(null);
      const cached = positionRef.current || getStoredLocation();
      if (cached) {
        applyPosition(cached);
        hasLoadedRef.current = true;
        if (!silent) setLoading(false);
        return;
      }
      if (autoRequest && !hasLoadedRef.current) {
        try {
          const userPos = await getUserLocation();
          setStoredLocation(userPos);
          setUnlimited(false);
          applyPosition(userPos);
        } catch (err) {
          const message = typeof err === 'string' ? err : 'No pudimos obtener tu ubicación.';
          showStationsWithoutLocation();
          setError(message);
        } finally {
          hasLoadedRef.current = true;
          if (!silent) setLoading(false);
        }
        return;
      }
      showStationsWithoutLocation();
      hasLoadedRef.current = true;
      if (!silent) setLoading(false);
    },
    [applyPosition, showStationsWithoutLocation]
  );

  // Solicitud explícita de GPS: solo se ejecuta con un gesto del usuario.
  const requestLocation = useCallback(async () => {
    setError(null);
    setLocating(true);
    try {
      const userPos = await getUserLocation();
      setStoredLocation(userPos);
      setUnlimited(false);
      applyPosition(userPos);
    } catch (err) {
      const message = typeof err === 'string' ? err : 'No pudimos obtener tu ubicación.';
      const cached = getStoredLocation();
      if (cached) {
        applyPosition(cached);
        setError(`${message} Mostrando tu última ubicación conocida.`);
      } else {
        // Sin permiso ni caché: la app sigue siendo utilizable mostrando
        // todas las estaciones, sin distancias ni filtro por radio.
        showStationsWithoutLocation();
        setError(message);
      }
    } finally {
      setLocating(false);
    }
  }, [applyPosition, showStationsWithoutLocation]);

  // "Actualizar" recarga los datos de estaciones (o recalcula con la
  // ubicación guardada). No abre el diálogo de permiso de ubicación.
  const refresh = useCallback(async () => {
    setRefreshError(null);
    setRefreshing(true);
    try {
      if (onRefresh) {
        const ok = await onRefresh();
        if (ok === false) {
          setRefreshError(
            'No pudimos actualizar las estaciones. Revisa tu conexión e inténtalo de nuevo.'
          );
        }
      } else {
        locate({ silent: true });
      }
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, locate]);

  useEffect(() => {
    if (availableStations.length) {
      locate({ silent: hasLoadedRef.current, autoRequest: !hasLoadedRef.current });
    } else {
      setLoading(false);
    }
  }, [availableStations, locate]);

  const hasLocation = position !== null;

  const filteredStations = useMemo(() => {
    let result = stations;

    if (hasLocation && !unlimited) {
      result = result.filter(
        (station) => station._distance !== null && station._distance <= radius
      );
    }

    if (fuelFilter !== 'all') {
      result = result.filter((station) => hasFuel(station, fuelFilter));
    }

    // Orden fijo: siempre por cercanía; sin distancia, al final.
    return [...result].sort(
      (a, b) => (a._distance ?? Infinity) - (b._distance ?? Infinity)
    );
  }, [stations, fuelFilter, radius, hasLocation, unlimited]);

  // Al cambiar cualquier filtro se vuelve a la primera página.
  useEffect(() => setVisibleCount(PAGE_SIZE), [radius, fuelFilter, unlimited]);

  const visibleStations = useMemo(
    () => filteredStations.slice(0, visibleCount),
    [filteredStations, visibleCount]
  );

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

  // Sin resultados: la acción cambia según lo que realmente esté limitando.
  const emptyAction = (() => {
    if (hasLocation && !unlimited && radius < 15) {
      return { label: 'Ampliar a 15 km', onClick: () => setRadius(15) };
    }
    if (fuelFilter !== 'all') {
      return { label: 'Quitar filtro de combustible', onClick: () => setFuelFilter('all') };
    }
    if (hasLocation && !unlimited) {
      return { label: 'Buscar en todo el país', onClick: () => setUnlimited(true) };
    }
    return { label: 'Usar mi ubicación', onClick: requestLocation };
  })();

  return (
    <section className="page page--home">
      <div className="hero">
        <div className="hero__content">
          <span className="hero__badge">
            <FontAwesomeIcon icon={faGasPump} /> Datos oficiales CNE
          </span>
          <h1>Tu estación más cercana, al mejor precio</h1>
          <p>Compara precios de combustibles en todo Chile y llega con un solo toque.</p>
        </div>
        <div className="hero__stats">
          <div className="stat">
            <strong>{filteredStations.length}</strong>
            <span>estaciones</span>
          </div>
          <div className="stat">
            <strong>{hasLocation && !unlimited ? `${radius} km` : 'Todo Chile'}</strong>
            <span>{hasLocation && !unlimited ? 'a la redonda' : 'del país'}</span>
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
        {/* Orden: radio, combustible y acciones. En escritorio las acciones
            se alinean al borde derecho. */}
        <div className="chip-group chip-group--radio" role="group" aria-label="Radio de búsqueda">
          <span className="toolbar__label">Radio</span>
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip${hasLocation && !unlimited && radius === option ? ' chip--active' : ''}`}
              aria-pressed={hasLocation && !unlimited && radius === option}
              onClick={() => {
                setUnlimited(false);
                setRadius(option);
              }}
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
            aria-pressed={fuelFilter === 'all'}
            onClick={() => setFuelFilter('all')}
          >
            Todos
          </button>
          {FUEL_OPTIONS.map((fuel) => (
            <button
              key={fuel.key}
              type="button"
              className={`chip${fuelFilter === fuel.key ? ' chip--active' : ''}`}
              aria-pressed={fuelFilter === fuel.key}
              onClick={() => setFuelFilter(fuel.key)}
            >
              {fuel.name}
            </button>
          ))}
        </div>

        <div className="toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <FontAwesomeIcon icon={faRotate} spin={refreshing} />
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {!hasLocation && !error && !loading && (
        <div className="alert alert--info">
          <FontAwesomeIcon icon={faLocationCrosshairs} />
          <div>
            <strong>Activa tu ubicación para ver las estaciones más cercanas</strong>
            <p>Mientras tanto mostramos todas las estaciones de Chile, sin distancias.</p>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={requestLocation}
            disabled={locating}
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} /> Usar mi ubicación
          </button>
        </div>
      )}

      {refreshError && (
        <div className="alert alert--error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <div>
            <strong>No pudimos actualizar las estaciones</strong>
            <p>{refreshError}</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <FontAwesomeIcon icon={faRotate} /> Reintentar
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert--error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <div>
            <strong>No pudimos acceder a tu ubicación</strong>
            <p>{error}</p>
            <p>
              {hasLocation
                ? 'Puedes seguir usando la última ubicación guardada.'
                : 'Mientras tanto mostramos todas las estaciones del país.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={requestLocation}
            disabled={locating}
          >
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
      ) : filteredStations.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faRoute} />
          <h2>{hasLocation && !unlimited ? 'Sin estaciones en este radio' : 'Sin estaciones que coincidan'}</h2>
          <p>
            {hasLocation && !unlimited
              ? 'Amplía el radio de búsqueda o cambia el filtro de combustible.'
              : 'No hay estaciones que coincidan con el filtro.'}
          </p>
          <button type="button" className="btn btn--primary" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </button>
        </div>
      ) : (
        <div className="home-layout">
          <div className="panel panel--map panel--map--sticky">
            <Mapa
              data={visibleStations}
              center={position}
              userPosition={position}
              showPrices
              zoom={13}
            />
            <p className="map-caption">
              <FontAwesomeIcon icon={faLocationCrosshairs} />{' '}
              {!hasLocation
                ? 'Todas las estaciones del país (sin ubicación)'
                : unlimited
                  ? 'Estaciones en todo el país'
                  : `Tu ubicación y las estaciones dentro de ${radius} km`}
            </p>
          </div>

          <div className="home-list">
            <header className="section-heading">
              <div>
                <h2>{hasLocation && !unlimited ? 'Estaciones cercanas' : 'Estaciones'}</h2>
                <p>
                  {filteredStations.length}{' '}
                  {filteredStations.length === 1 ? 'estación' : 'estaciones'} ·{' '}
                  {filteredStations.length === 1 ? 'ordenada' : 'ordenadas'} por distancia
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
            {visibleStations.length < filteredStations.length && (
              <div className="home-more">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Mostrar más ({filteredStations.length - visibleStations.length} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeList;
