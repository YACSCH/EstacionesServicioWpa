import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFire,
  faStore,
  faRoute,
  faLocationDot,
  faClock,
  faInbox,
} from '@fortawesome/free-solid-svg-icons';
import Mapa from '../Maps';
import { routeUrl, stationCoordinates } from '../../utils/stations';

const DistribuidoresList = ({ distribuidores }) => {
  const [query, setQuery] = useState('');
  const [comuna, setComuna] = useState('all');

  const allStores = useMemo(() => {
    if (!distribuidores) return [];
    return Object.values(distribuidores).filter((store) => store?.id_region === '13');
  }, [distribuidores]);

  const comunas = useMemo(
    () =>
      [
        ...new Set(
          allStores
            .map((store) => store.ubicacion?.nombre_comuna || store.nombre_comuna)
            .filter(Boolean)
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [allStores]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return allStores.filter((store) => {
      const storeComuna = store.ubicacion?.nombre_comuna || store.nombre_comuna;
      const matchesComuna = comuna === 'all' || storeComuna === comuna;
      const haystack = [store.nombre_empresa, storeComuna, store.ubicacion?.direccion]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesComuna && (!term || haystack.includes(term));
    });
  }, [allStores, query, comuna]);

  const withCoords = filtered.filter((store) => stationCoordinates(store));
  const mapStores = withCoords.slice(0, 300);

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            <FontAwesomeIcon icon={faFire} /> Calefacción
          </span>
          <h1>Puntos de venta de calefacción</h1>
          <p>Encuentra dónde comprar combustible para calefacción en la Región Metropolitana.</p>
        </div>
        <span className="count-pill">{filtered.length} puntos</span>
      </header>

      <div className="search-bar">
        <label className="search-field">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="search"
            placeholder="Buscar por empresa, comuna o dirección…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar puntos de venta"
          />
        </label>

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
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faInbox} />
          <h2>Sin puntos de venta</h2>
          <p>Prueba con otra comuna o limpia la búsqueda.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setQuery('');
              setComuna('all');
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {withCoords.length > 0 && (
            <div className="panel panel--map panel--map-wide">
              <Mapa data={mapStores} />
              <p className="map-caption">{mapStores.length} puntos de venta en el mapa</p>
            </div>
          )}

          <div className="cards-grid">
            {filtered.map((store, index) => {
              const coords = stationCoordinates(store);
              const storeComuna = store.ubicacion?.nombre_comuna || store.nombre_comuna;
              const address = [store.ubicacion?.direccion, store.direccion_numero]
                .filter(Boolean)
                .join(' ');

              return (
                <article className="station-card" key={store.id || `${store.nombre_empresa}-${index}`}>
                  <header className="station-card__header">
                    <div className="station-card__brand">
                      <span className="station-card__avatar station-card__avatar--store" aria-hidden="true">
                        <FontAwesomeIcon icon={faStore} />
                      </span>
                      <div>
                        <h3>{store.nombre_empresa || 'Punto de venta'}</h3>
                        <p className="station-card__comuna">
                          <FontAwesomeIcon icon={faLocationDot} />
                          {storeComuna || 'Sin comuna'}
                        </p>
                      </div>
                    </div>
                  </header>

                  <p className="station-card__address">{address || 'Dirección no disponible'}</p>

                  <p className="station-card__hours">
                    <FontAwesomeIcon icon={faClock} />
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
        </>
      )}
    </section>
  );
};

export default DistribuidoresList;
