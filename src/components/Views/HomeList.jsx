import { useEffect, useState } from 'react';
import Mapa from '../Maps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationCrosshairs, faRoute } from '@fortawesome/free-solid-svg-icons';

// Función para obtener la ubicación actual
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocalización no soportada.');
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          reject('Error obteniendo ubicación: ' + error.message);
        }
      );
    }
  });
}

// Función para calcular distancia entre dos coordenadas
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const COMBUSTIBLES = [
  { key: '93', label: 'Gasolina 93' },
  { key: '95', label: 'Gasolina 95' },
  { key: '97', label: 'Gasolina 97' },
  { key: 'DI', label: 'Diésel' },
  { key: 'KE', label: 'Kerosene' }
];

const HomeList = ({ datos }) => {
  const [position, setPosition] = useState(null);
  const [stationsWithDist, setStationsWithDist] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(5);
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  const fetchLocationAndFilter = async (r = radius) => {
    try {
      setLoading(true);
      setError(null);
      const userPos = await getUserLocation();
      setPosition([userPos.lat, userPos.lon]);

      const nearbyStations = Object.values(datos || {})
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
        .filter((s) => s && s._distance <= r)
        .sort((a, b) => a._distance - b._distance);

      setStationsWithDist(nearbyStations);
    } catch (err) {
      console.error(err);
      setError(typeof err === 'string' ? err : 'Error al obtener ubicación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datos && Object.keys(datos).length > 0) {
      fetchLocationAndFilter(radius);
    } else {
      setLoading(false);
    }
  }, [datos]);

  useEffect(() => {
    let result = [...stationsWithDist];
    if (fuelFilter !== 'all') {
      result = result.filter((station) => {
        const precios = station.precios || {};
        const p1 = precios[fuelFilter]?.precio;
        const p2 = precios[`A${fuelFilter}`]?.precio;
        return p1 || p2;
      });
    }
    if (sortBy === 'distance') {
      result.sort((a, b) => a._distance - b._distance);
    } else if (sortBy === 'price_93') {
      result.sort((a, b) => {
        const pa = (a.precios?.['93']?.precio || a.precios?.['A93']?.precio || Infinity);
        const pb = (b.precios?.['93']?.precio || b.precios?.['A93']?.precio || Infinity);
        return pa - pb;
      });
    }
    setFilteredStations(result);
  }, [stationsWithDist, fuelFilter, sortBy]);

  const getPrice = (station, key) => {
    const precios = station.precios || {};
    return precios[key]?.precio || precios[`A${key}`]?.precio || 'N/D';
  };

  const openRoute = (lat, lon) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    window.open(url, '_blank');
  };

  if (loading || !position) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem' }}>
        <p>Obteniendo tu ubicación y buscando estaciones cercanas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => fetchLocationAndFilter(radius)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faLocationCrosshairs} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ marginRight: '0.25rem' }}>Radio:</label>
          <select value={radius} onChange={(e) => { setRadius(Number(e.target.value)); fetchLocationAndFilter(Number(e.target.value)); }}>
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={15}>15 km</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '0.25rem' }}>Combustible:</label>
          <select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)}>
            <option value="all">Todos</option>
            {COMBUSTIBLES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ marginRight: '0.25rem' }}>Ordenar:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="distance">Por distancia</option>
            <option value="price_93">Por precio 93</option>
          </select>
        </div>
        <button onClick={() => fetchLocationAndFilter(radius)} style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
          <FontAwesomeIcon icon={faLocationCrosshairs} /> Actualizar
        </button>
      </div>

      {filteredStations.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>No hay estaciones con los filtros seleccionados 🚫⛽</h2>
          <p>Prueba ampliando el radio o cambiando el filtro de combustible.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <div style={{ height: '50vh', minHeight: '300px' }}>
            <Mapa data={filteredStations} pos={position} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {filteredStations.map((station, idx) => (
              <article className="card" key={idx} style={{ width: '100%', margin: 0 }}>
                <h3 className="card-title">{station.distribuidor?.marca || 'Estación'}</h3>
                <section className="card-body">
                  <p className="card-text"><strong>Dirección:</strong> {station.direccion_calle || station.ubicacion?.direccion} {station.direccion_numero || ''}</p>
                  <p className="card-text"><strong>Comuna:</strong> {station.nombre_comuna}</p>
                  <p className="card-text"><strong>Distancia:</strong> {station._distance?.toFixed(2)} km</p>
                  <p className="card-text"><strong>Horario:</strong> {station.horario_atencion || 'N/D'}</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Precios</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      <li>93: ${getPrice(station, '93')}</li>
                      <li>95: ${getPrice(station, '95')}</li>
                      <li>97: ${getPrice(station, '97')}</li>
                      <li>Diésel: ${getPrice(station, 'DI')}</li>
                      <li>Kerosene: ${getPrice(station, 'KE')}</li>
                    </ul>
                  </div>
                  <button onClick={() => openRoute(station.ubicacion.latitud, station.ubicacion.longitud)} style={{ marginTop: '0.75rem', padding: '0.4rem 0.75rem', cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={faRoute} /> Cómo llegar
                  </button>
                </section>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeList;
