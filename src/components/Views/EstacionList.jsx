import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Icon } from 'leaflet'
import icon from '../../../public/img/marker-icon.png'
import iconShadow from '../../../public/img/marker-shadow.png'

let iconUbicacion = new L.icon({
    iconUrl:icon,
    iconShadow: iconShadow,
  })

const  EstacionList = ({ estaciones }) => {

  const filterStations = Object.values(estaciones).filter((station) => station.ubicacion.codigo_region === "13");

  return (
    <>
    {   filterStations ?
      Object.values(filterStations).map((item,index) => (
      <article className="card" key={index}>
        <h2 className="card-title">{item.distribuidor.marca}</h2>
        <MapContainer center={[item.ubicacion.latitud, item.ubicacion.longitud]}  zoom={13} scrollWheelZoom={false} className='card-img'>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position= {[item.ubicacion.latitud, item.ubicacion.longitud]} icon={iconUbicacion} key={index}>
          <Popup>
            Horario de Atencion : {item.horario_atencion} 
          </Popup>
        </Marker>
      </MapContainer>
        <section className="card-body">
          <p className="card-text">Dirección: {item.ubicacion.direccion} {item.direccion_numero}</p>
          <p className="card-text">Comuna: {item.nombre_comuna}</p>
          <p className="card-text">Región: {item.nombre_region}</p>
        </section>
      </article>
    )) :<>Sin informacion</> }
    </>
  )
}

export default EstacionList
