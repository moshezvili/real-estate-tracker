import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Apartment } from '@/types/apartment'

import L from 'leaflet'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Add a red icon for irrelevant apartments
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  apartments: Apartment[]
}

export default function Map({ apartments }: MapProps) {
  const center = apartments.length > 0
    ? [apartments[apartments.length - 1].lat, apartments[apartments.length - 1].lng]
    : [32.0853, 34.7818] // Tel Aviv coordinates

  const generateWhatsAppLink = (apartment: Apartment) => {
    const message = encodeURIComponent(`היי, אני מתעניין בדירה בכתובת ${apartment.address}. האם אפשר לקבל פרטים נוספים?`)
    return `https://wa.me/${apartment.contactPhone}?text=${message}`
  }

  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer center={center as [number, number]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {apartments.map(apartment => (
          <Marker 
            key={apartment.id} 
            position={[apartment.lat, apartment.lng]}
            icon={apartment.isIrrelevant ? redIcon : L.Icon.Default.prototype}
          >
            <Popup>
              <div className="rtl text-right">
                <h3>{apartment.address}</h3>
                <p>מחיר: ₪{apartment.price}</p>
                <p>חדרים: {apartment.rooms}</p>
                <p>גודל: {apartment.size} מ"ר</p>
                <p>קומה: {apartment.floor}</p>
                <p>איש קשר: {apartment.contactName}</p>
                <p>טלפון: {apartment.contactPhone}</p>
                <p>פרטים נוספים: {apartment.details}</p>
                <a href={generateWhatsAppLink(apartment)} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline">
                  שלח וואטסאפ
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
