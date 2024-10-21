'use client'

import { useEffect, useRef } from 'react'
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

      heatmapLayerRef.current = L.heatLayer(heatData, { radius: 25 }).addTo(mapRef.current);
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

  }, [alertData, showMarkers, showHeatmap])

  return <div id="map" style={{ height: 'calc(100vh - 200px)', width: '100%' }} />
}
