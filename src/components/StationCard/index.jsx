import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faLocationDot,
  faRoute,
  faShareNodes,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import {
  FUEL_OPTIONS,
  formatPrice,
  hasFuel,
  routeUrl,
  shareStation,
  stationAddress,
  stationBrand,
  stationCoordinates,
} from '../../utils/stations';

const StationCard = ({ station, distance, highlightedFuel, badge }) => {
  const [copied, setCopied] = useState(false);
  const coords = stationCoordinates(station);
  const availableFuels = FUEL_OPTIONS.filter((fuel) => hasFuel(station, fuel.key));

  const handleShare = async () => {
    const result = await shareStation({
      title: stationBrand(station),
      text: `${stationAddress(station)} · ${station.nombre_comuna || ''}`,
      url: coords
        ? `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`
        : window.location.href,
    });
    if (result === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="station-card">
      <header className="station-card__header">
        <div className="station-card__brand">
          <span className="station-card__avatar" aria-hidden="true">
            {stationBrand(station).charAt(0).toUpperCase()}
          </span>
          <div>
            <h3>{stationBrand(station)}</h3>
            <p className="station-card__comuna">
              <FontAwesomeIcon icon={faLocationDot} />
              {station.nombre_comuna || station.ubicacion?.nombre_comuna || 'Sin comuna'}
            </p>
          </div>
        </div>
        {distance != null && (
          <span className="badge badge--distance">{distance.toFixed(1)} km</span>
        )}
        {badge && <span className="badge">{badge}</span>}
      </header>

      <p className="station-card__address">{stationAddress(station)}</p>

      <p className="station-card__hours">
        <FontAwesomeIcon icon={faClock} />
        {station.horario_atencion || 'Horario no informado'}
      </p>

      {availableFuels.length > 0 ? (
        <div className="price-grid">
          {availableFuels.map((fuel) => (
            <div
              key={fuel.key}
              className={`price-pill${highlightedFuel === fuel.key ? ' price-pill--active' : ''}`}
            >
              <span className="price-pill__label">{fuel.label}</span>
              <span className="price-pill__value">{formatPrice(station, fuel.key)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-inline">Precios no informados</p>
      )}

      <footer className="station-card__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={!coords}
          onClick={() => coords && window.open(routeUrl(coords[0], coords[1]), '_blank', 'noopener,noreferrer')}
        >
          <FontAwesomeIcon icon={faRoute} />
          Cómo llegar
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={handleShare}>
          <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} />
          {copied ? 'Copiado' : 'Compartir'}
        </button>
      </footer>
    </article>
  );
};

export default StationCard;
