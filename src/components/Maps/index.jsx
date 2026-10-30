import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoute } from '@fortawesome/free-solid-svg-icons';
import {
  formatPrice,
  routeUrl,
  stationAddress,
  stationBrand,
  stationCoordinates,
} from '../../utils/stations';

const stationIcon = L.icon({
  iconUrl: `${import.meta.env.BASE_URL}img/marker-icon.png`,
  iconRetinaUrl: `${import.meta.env.BASE_URL}img/marker-icon-2x.png`,
  shadowUrl: `${import.meta.env.BASE_URL}img/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const FitToStations = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    if (points.length > 1) {
      map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
    }
  }, [map, points]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
};

const InvalidateSizeOnMount = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

/**
 * Mapa reutilizable de estaciones.
 * props: data, center, userPosition, zoom, className, showPrices
 */
const Mapa = ({ data = [], center, userPosition, zoom = 13, className = '', showPrices = false }) => {
  const stations = useMemo(
    () =>
      data
        .map((station) => ({ station, coords: stationCoordinates(station) }))
        .filter((item) => item.coords),
    [data]
  );

  const points = useMemo(() => stations.map((item) => item.coords), [stations]);
  const fitPoints = useMemo(
    () => (userPosition ? [...points, userPosition] : points),
    [points, userPosition]
  );
  const initialCenter =
    center || (points.length ? points[0] : [-33.4489, -70.6693]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      className={`map ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {fitPoints.length > 0 && <FitToStations points={fitPoints} />}
      <InvalidateSizeOnMount />

      {userPosition && (
        <Marker position={userPosition} icon={userIcon} zIndexOffset={1000}>
          <Popup>Tu ubicación aproximada</Popup>
        </Marker>
      )}

      {stations.map(({ station, coords }, index) => (
        <Marker position={coords} icon={stationIcon} key={`${station.id || 's'}-${index}`}>
          <Popup>
            <div className="map-popup">
              <strong>{stationBrand(station)}</strong>
              <span>{stationAddress(station)}</span>
              {showPrices && (
                <span className="map-popup__prices">
                  93 {formatPrice(station, '93')} · 95 {formatPrice(station, '95')} · Diésel{' '}
                  {formatPrice(station, 'DI')}
                </span>
              )}
              <button
                type="button"
                className="btn btn--primary btn--xs"
                onClick={() => window.open(routeUrl(coords[0], coords[1]), '_blank', 'noopener,noreferrer')}
              >
                <FontAwesomeIcon icon={faRoute} /> Cómo llegar
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Mapa;
