import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faSliders, faInbox } from '@fortawesome/free-solid-svg-icons';
import Mapa from '../Maps';
import StationCard from '../StationCard';
import {
  FUEL_OPTIONS,
  getNumericPrice,
  hasFuel,
  stationCoordinates,
} from '../../utils/stations';

const PAGE_SIZE = 12;

const EstacionList = ({ estaciones }) => {
  const [query, setQuery] = useState('');
  const [comuna, setComuna] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('comuna');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const allStations = useMemo(() => {
    if (!estaciones) return [];
    return Object.values(estaciones).filter(
      (station) => station?.ubicacion?.codigo_region === '13'
    );
  }, [estaciones]);

  const comunas = useMemo(
    () =>
      [...new Set(allStations.map((station) => station.nombre_comuna).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [allStations]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let result = allStations.filter((station) => {
      const matchesComuna = comuna === 'all' || station.nombre_comuna === comuna;
      const matchesFuel = fuelFilter === 'all' || hasFuel(station, fuelFilter);
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
      return matchesComuna && matchesFuel && matchesQuery;
    });

    if (sortBy === 'comuna') {
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
  }, [allStations, query, comuna, fuelFilter, sortBy]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, comuna, fuelFilter, sortBy]);

  const visibleStations = filtered.slice(0, visible);
  const withCoords = filtered.filter((station) => stationCoordinates(station));
  const mapStations = withCoords.slice(0, 300);

  return (
    <section className="page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Región Metropolitana</span>
          <h1>Estaciones de servicio</h1>
          <p>Compara precios de combustibles y revisa la disponibilidad por comuna.</p>
        </div>
        <span className="count-pill">{filtered.length} estaciones</span>
      </header>

      <div className="search-bar">
        <label className="search-field">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="search"
            placeholder="Buscar por marca, comuna o dirección…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar estaciones"
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

        <label className="select-field">
          <span>Combustible</span>
          <select value={fuelFilter} onChange={(event) => setFuelFilter(event.target.value)}>
            <option value="all">Todos</option>
            {FUEL_OPTIONS.map((fuel) => (
              <option key={fuel.key} value={fuel.key}>
                {fuel.name}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Ordenar por</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="comuna">Comuna</option>
            <option value="marca">Marca</option>
            <option value="price_93">Precio 93</option>
            <option value="price_95">Precio 95</option>
            <option value="price_DI">Precio diésel</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faInbox} />
          <h2>No encontramos estaciones</h2>
          <p>Prueba con otra comuna, otro combustible o limpia la búsqueda.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setQuery('');
              setComuna('all');
              setFuelFilter('all');
            }}
          >
            <FontAwesomeIcon icon={faSliders} /> Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {withCoords.length > 0 && (
            <div className="panel panel--map panel--map-wide">
              <Mapa data={mapStations} showPrices />
              <p className="map-caption">
                {mapStations.length === withCoords.length
                  ? `${withCoords.length} estaciones con ubicación en el mapa`
                  : `Mostrando ${mapStations.length} de ${withCoords.length} estaciones en el mapa`}
              </p>
            </div>
          )}

          <div className="cards-grid">
            {visibleStations.map((station, index) => (
              <StationCard
                key={station.id || `${station.distribuidor?.marca}-${index}`}
                station={station}
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
                Mostrar más estaciones ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default EstacionList;
