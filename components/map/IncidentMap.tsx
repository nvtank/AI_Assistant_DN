'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, INCIDENT_TYPES, Location } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils';
import { listenToVerifiedIncidents } from '@/lib/incidentServiceFirebase';

interface IncidentMapProps {
  center: Location;
  incidents?: Incident[];
  onIncidentClick?: (incident: Incident) => void;
  onMapClick?: (location: Location) => void;
}

export default function IncidentMap({
  center,
  incidents = [],
  onIncidentClick,
  onMapClick,
}: IncidentMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [firebaseIncidents, setFirebaseIncidents] = useState<Incident[]>([]);
  const isInitializedRef = useRef(false);

  // Use Firebase incidents if available, otherwise fall back to props
  const displayIncidents = firebaseIncidents.length > 0 ? firebaseIncidents : incidents;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Setup realtime listener for Firebase incidents
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = listenToVerifiedIncidents((incidents) => {
      setFirebaseIncidents(incidents);
    });

    return () => {
      unsubscribe();
    };
  }, [isClient]);

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || isInitializedRef.current) return;

    try {
      // Fix for default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Define Da Nang bounds
      const daNangBounds = L.latLngBounds(
        L.latLng(15.9, 107.9),   // Southwest corner (bottom-left)
        L.latLng(16.2, 108.4)    // Northeast corner (top-right)
      );

      // Ensure center is within Da Nang bounds
      let mapCenter = center;
      if (!daNangBounds.contains([center.lat, center.lng])) {
        console.log(`📍 Location ${center.lat}, ${center.lng} outside Da Nang, using Da Nang center`);
        mapCenter = { lat: 16.0544, lng: 108.2022 }; // Da Nang center
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        maxBounds: daNangBounds,           // Restrict panning to Da Nang area
        maxBoundsViscosity: 1.0,           // Make bounds completely solid (can't drag outside)
        minZoom: 11,                       // Minimum zoom to see Da Nang area
        maxZoom: 18,                       // Maximum zoom for details
      }).setView([mapCenter.lat, mapCenter.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        bounds: daNangBounds,              // Only load tiles within Da Nang
      }).addTo(map);

      // Add user location marker
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background: #00B14F; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Ensure center is within Da Nang bounds for user marker too
      let userMarkerPos = center;
      if (!daNangBounds.contains([center.lat, center.lng])) {
        userMarkerPos = { lat: 16.0544, lng: 108.2022 };
      }

      userMarkerRef.current = L.marker([userMarkerPos.lat, userMarkerPos.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');

      // Handle map click
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      mapRef.current = map;
      isInitializedRef.current = true;

      // Force map to invalidate size after a brief delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      try {
        // Clear all markers first
        markersRef.current.forEach((marker) => {
          try {
            marker.remove();
          } catch (e) {
            // Ignore errors when removing markers
          }
        });
        markersRef.current = [];

        // Remove map
        if (mapRef.current) {
          mapRef.current.off(); // Remove all event listeners
          mapRef.current.remove();
          mapRef.current = null;
        }
        isInitializedRef.current = false;
      } catch (error) {
        console.error('Error cleaning up map:', error);
      }
    };
  }, [isClient]);

  // Update user location marker when center changes
  useEffect(() => {
    if (!mapRef.current || !userMarkerRef.current || !isClient) return;

    try {
      // Ensure center is within Da Nang bounds
      const daNangBounds = L.latLngBounds(
        L.latLng(15.9, 107.9),
        L.latLng(16.2, 108.4)
      );

      let markerPos = center;
      if (!daNangBounds.contains([center.lat, center.lng])) {
        markerPos = { lat: 16.0544, lng: 108.2022 };
      }

      userMarkerRef.current.setLatLng([markerPos.lat, markerPos.lng]);
      mapRef.current.panTo([markerPos.lat, markerPos.lng]);
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }, [center, isClient]);

  // Update incident markers
  useEffect(() => {
    if (!mapRef.current || !isClient || !isInitializedRef.current) return;

    try {
      // Clear existing markers safely
      markersRef.current.forEach((marker) => {
        try {
          if (marker && mapRef.current) {
            marker.remove();
          }
        } catch (e) {
          // Ignore errors when removing markers
        }
      });
      markersRef.current = [];

      // Add new markers
      displayIncidents.forEach((incident) => {
        if (!mapRef.current) return;

        try {
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
              <div class="incident-popup" style="padding: 12px; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
                  ${incidentType.icon} ${incidentType.label}
                </h3>
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                  ${incident.description}
                </p>
                ${incident.imageUrl ? `
                  <img src="${incident.imageUrl}" alt="Incident" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                ` : ''}
                <p style="margin: 0; font-size: 12px; color: #6b7280; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.1);">
                  ${formatTimestamp(incident.createdAt)}
                </p>
              </div>
            `, {
              className: 'incident-popup-custom',
              maxWidth: 300,
            });

          if (onIncidentClick) {
            marker.on('click', () => onIncidentClick(incident));
          }

          markersRef.current.push(marker);
        } catch (error) {
          // Silently fail - marker will not be added
        }
      });
    } catch (error) {
      // Silently fail - markers will not be updated
    }
  }, [displayIncidents, isClient, onIncidentClick]);

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
