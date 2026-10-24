import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet'
import L from 'leaflet'
import markerIcon from '../../../public/img/marker-icon.png'
import iconShadow from '../../../public/img/marker-shadow.png'

let iconUbicacion = new L.icon({
    iconUrl:markerIcon,
    iconShadow: iconShadow,
}) 

const Mapa = ({ data, pos}) => {
  console.log(data.length);
 
  return (
    <MapContainer center={pos} zoom={13} scrollWheelZoom={false} className='mapa'>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((item,index) => (

         
        
        <Marker position= {[item.ubicacion.latitud, item.ubicacion.longitud]} icon={iconUbicacion} key={index}>
          <Popup>
            Distribuidor: {item.distribuidor.marca } <br /> 
            Direccion: {item.direccion_calle} {item.ubicacion.direccion} <br />
            Horario de Atencion : {item.horario_atencion} 
            <h3>Precios</h3>
            Gas-93 : {item.precios?.["93"]?.precio || item?.precios?.["A93"]?.precio} <br/>
            Gas-95 : {item.precios?.["95"]?.precio || item?.precios?.["A95"]?.precio} <br/>
            Gas-97 : {item.precios?.["97"]?.precio || item?.precios?.["A97"]?.precio} <br/>
            Diesel : {item.precios?.["DI"]?.precio || item?.precios?.["ADI"]?.precio} <br/>
            Kerosene : {item.precios?.["KE"]?.precio || item?.precios?.["AKE"]?.precio} <br/>
          </Popup>
        </Marker>
         ))}
      </MapContainer>
  )
}

export default Mapa