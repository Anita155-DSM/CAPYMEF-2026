import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet pierde el ícono por defecto al empaquetar con Vite: se fija una vez.
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClicEnMapa({ onSeleccion }) {
  const [posicion, setPosicion] = useState(null);
  useMapEvents({
    click(e) {
      setPosicion(e.latlng);
      onSeleccion(e.latlng);
    },
  });
  return posicion === null ? null : <Marker position={posicion} />;
}

/**
 * Mapa clickeable. Se carga con React.lazy desde EventoFormModal para que
 * Leaflet (≈150 kB) no viaje en el bundle inicial.
 */
export default function MapaUbicacion({ onSeleccion }) {
  return (
    <MapContainer center={[-26.1848, -58.1731]} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClicEnMapa onSeleccion={onSeleccion} />
    </MapContainer>
  );
}
