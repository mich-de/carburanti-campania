'use client';

import React, { useEffect, useRef } from 'react';
import { GasStation } from '../types/fuel';

interface StationMapProps {
  stations: GasStation[];
  selectedProvince: string;
  userLocation?: { lat: number; lng: number } | null;
}

const PROVINCE_CENTERS: Record<string, [number, number, number]> = {
  all: [40.85, 14.65, 9], // Center of Campania
  NA: [40.85, 14.26, 11],
  SA: [40.68, 14.76, 10],
  CE: [41.07, 14.33, 11],
  AV: [40.91, 14.79, 11],
  BN: [41.13, 14.78, 11],
};

export const StationMap: React.FC<StationMapProps> = ({ stations, selectedProvince, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  useEffect(() => {
    // Only execute on browser
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      const [centerLat, centerLng, defaultZoom] =
        PROVINCE_CENTERS[selectedProvince] || PROVINCE_CENTERS.all;

      // Initialize map instance if not existing
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: defaultZoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Use standard OpenStreetMap tiles (free, public, no external API key needed)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([centerLat, centerLng], defaultZoom);
      }

      // Refresh markers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();

        // Render user location marker if GPS is active
        if (userLocation) {
          const userIcon = L.divIcon({
            className: 'user-pin-icon',
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#0284c7;border:3px solid #ffffff;box-shadow:0 0 10px rgba(2,132,199,0.8);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
          userMarker.bindPopup('<strong style="font-size:12px;color:#0284c7;">📍 La tua posizione GPS</strong>');
          markersLayerRef.current.addLayer(userMarker);
        }

        // Limit rendering to top 300 to maintain smooth 60fps performance on mobile
        const displayStations = stations.slice(0, 300);

        displayStations.forEach((st) => {
          if (!st.latitude || !st.longitude) return;

          const brandClass = st.brand.toLowerCase().includes('eni')
            ? 'brand-eni'
            : st.brand.toLowerCase().includes('ip')
            ? 'brand-ip'
            : st.brand.toLowerCase().includes('q8')
            ? 'brand-q8'
            : '';

          const priceText = st.minPrice > 0 ? `${st.minPrice.toFixed(2)}€` : 'N/D';

          const customIcon = L.divIcon({
            className: 'custom-leaflet-icon',
            html: `<div class="custom-price-marker ${brandClass} ${
              st.hasUnder2Euro ? 'price-cap-pulse' : ''
            }">${priceText}</div>`,
            iconSize: [48, 22],
            iconAnchor: [24, 11],
          });

          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`;

          const pricesHtml = st.prices
            .map(
              (p) => `
              <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:11px;">
                <span>${p.fuelType} (${p.isSelf ? 'Self' : 'Serv'}):</span>
                <strong style="color:${p.isUnder2Euro ? '#059669' : '#0f172a'}">
                  ${p.price.toFixed(3)} €
                </strong>
              </div>
            `
            )
            .join('');

          const popupContent = `
            <div style="font-family:system-ui,sans-serif; min-width:200px; padding:2px;">
              <div style="font-weight:bold; font-size:13px; color:#0f172a; margin-bottom:2px;">
                ${st.name}
              </div>
              <div style="font-size:11px; color:#64748b; margin-bottom:6px;">
                ${st.address ? st.address + ', ' : ''}<strong>${st.city}</strong> (${st.province})
              </div>
              <div style="margin-bottom:6px; background:#f8fafc; padding:6px; border-radius:6px; border:1px solid #e2e8f0;">
                <div style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:2px;">
                  Listino Prezzi Rilevato
                </div>
                ${pricesHtml}
              </div>
              <a href="${navUrl}" target="_blank" rel="noopener noreferrer" 
                 style="display:block; text-align:center; background:#059669; color:white; font-size:11px; font-weight:700; padding:6px 10px; border-radius:6px; text-decoration:none;">
                Apri Navigatore GPS
              </a>
            </div>
          `;

          const marker = L.marker([st.latitude, st.longitude], { icon: customIcon });
          marker.bindPopup(popupContent);
          markersLayerRef.current.addLayer(marker);
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [stations, selectedProvince, userLocation]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs text-slate-700 font-medium">
        <span className="font-bold text-emerald-700">Verde:</span> &lt; 2.00 € |{' '}
        <span className="font-bold text-amber-600">Giallo:</span> Eni |{' '}
        <span className="font-bold text-sky-600">Blu:</span> IP |{' '}
        <span className="font-bold text-rose-600">Rosso:</span> Q8
      </div>
    </div>
  );
};
