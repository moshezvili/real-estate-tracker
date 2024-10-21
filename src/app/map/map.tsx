'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

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



interface AlertData {
  date: Date;
  title: string;
  location: string;
  category: string;
  lat: number;
  lon: number;
}

interface MapProps {
  alertData: AlertData[];
  showMarkers: boolean;
  showHeatmap: boolean;
}

export default function Map({ alertData, showMarkers, showHeatmap }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const heatmapLayerRef = useRef<L.HeatLayer | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([31.5, 34.75], 7)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current)
    }

    // Clear existing layers
    if (heatmapLayerRef.current) {
      mapRef.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }
    if (markersLayerRef.current) {
      mapRef.current.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }

    // Ensure the map is properly initialized before adding layers
    if (mapRef.current && alertData.length > 0) {
      updateLayers();
    }
  }, [alertData, showMarkers, showHeatmap])

  const updateLayers = () => {
    if (!mapRef.current) return;

    // Heatmap logic
    if (showHeatmap) {
      const heatmapData = alertData.reduce((acc, alert) => {
        if (alert.lat && alert.lon) {
          const key = `${alert.lat},${alert.lon}`;
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const heatData = Object.entries(heatmapData).map(([key, count]) => {
        const [lat, lon] = key.split(',').map(Number);
        return [lat, lon, count] as L.HeatLatLngTuple;
      });

      heatmapLayerRef.current = L.heatLayer(heatData, { 
        radius: 25,
        minOpacity: 0.4,
        // gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
      }).addTo(mapRef.current);

      // Make heatmap clickable
      mapRef.current.on('click', (e) => {
        const latlng = e.latlng;
        const nearestPoint = findNearestPoint(latlng, heatData);
        if (nearestPoint) {
          const [lat, lon, count] = nearestPoint;
          const location = alertData.find(alert => alert.lat === lat && alert.lon === lon)?.location;
          if (location) {
            setSelectedLocation(`${location}: ${count} התראות`);
          }
        } else {
          setSelectedLocation(null);
        }
      });
    }

    // Markers logic
    if (showMarkers) {
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      const uniqueLocations = alertData.reduce((acc, alert) => {
        if (alert.lat && alert.lon) {
          const key = `${alert.lat},${alert.lon}`;
          if (!acc[key]) {
            acc[key] = alert;
          }
        }
        return acc;
      }, {} as Record<string, AlertData>);

      Object.values(uniqueLocations).forEach((alert) => {
        const marker = L.marker([alert.lat, alert.lon])
          .bindPopup(`
            Location: ${alert.location}
          `);
        markersLayerRef.current?.addLayer(marker);
      });
    }
  }

  const findNearestPoint = (latlng: L.LatLng, heatData: L.HeatLatLngTuple[]): L.HeatLatLngTuple | null => {
    let nearestPoint = null;
    let minDistance = Infinity;
    for (const point of heatData) {
      const distance = latlng.distanceTo(L.latLng(point[0], point[1]));
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }
    return minDistance < 20000 ? nearestPoint : null; // 20km threshold
  }

  return (
    <div dir='rtl'>
      <div className='z-0' id="map" style={{ height: 'calc(100vh - 200px)', width: '100%' }} />
      {selectedLocation && (
        <div className="absolute bottom-4 tight-4 bg-black p-2 rounded shadow text-white text-xxl">
          {selectedLocation}
        </div>
      )}
    </div>
  )
}
