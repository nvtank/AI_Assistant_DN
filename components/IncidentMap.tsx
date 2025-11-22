'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, INCIDENT_TYPES, Location } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import { formatTimestamp } from '@/lib/utils';

interface IncidentMapProps {
  center: Location;
  incidents: Incident[];
  onIncidentClick?: (incident: Incident) => void;
  onMapClick?: (location: Location) => void;
}

export default function IncidentMap({
  center,
  incidents,
  onIncidentClick,
  onMapClick,
}: IncidentMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapRef.current) return;

    // Fix for default marker icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div style="background: #00B14F; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([center.lat, center.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');

    // Handle map click
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    mapRef.current = map;

    // Listen for real-time incident updates
    const socket = getSocket();
    socket.on('incident:new', (incident: Incident) => {
      console.log('New incident received:', incident);
      // Map will re-render with updated incidents from parent
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient, center.lat, center.lng, onMapClick]);

  // Update incident markers
  useEffect(() => {
    if (!mapRef.current || !isClient) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    incidents.forEach((incident) => {
      if (!mapRef.current) return;

      const incidentType = INCIDENT_TYPES[incident.type];
      
      const icon = L.divIcon({
        className: 'incident-marker',
        html: `
          <div style="
            background: ${incidentType.color};
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${incidentType.icon}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([incident.location.lat, incident.location.lng], { icon })
        .addTo(mapRef.current)
        .bindPopup(`
          <div class="incident-popup">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
              ${incidentType.icon} ${incidentType.label}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px;">
              ${incident.description}
            </p>
            ${incident.imageUrl ? `
              <img src="${incident.imageUrl}" alt="Incident" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
            ` : ''}
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${formatTimestamp(incident.createdAt)}
            </p>
          </div>
        `);

      if (onIncidentClick) {
        marker.on('click', () => onIncidentClick(incident));
      }

      markersRef.current.push(marker);
    });
  }, [incidents, isClient, onIncidentClick]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-grab-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
