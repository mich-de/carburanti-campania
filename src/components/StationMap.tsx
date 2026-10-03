'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { LocateFixed, Maximize2 } from 'lucide-react';
import { GasStation } from '../types/fuel';

interface StationMapProps {
  stations: GasStation[];
  selectedProvince: string;
  userLocation?: { lat: number; lng: number } | null;
  searchQuery?: string;
  isLocating?: boolean;
  onLocateMe?: () => void;
}

const PROVINCE_CENTERS: Record<string, [number, number, number]> = {
  all: [40.85, 14.65, 9], // Center of Campania
  PENISOLA_SORRENTINA: [40.645, 14.415, 12], // Penisola Sorrentina: Vico Equense, Meta, Sorrento, Massa Lubrense
  NA: [40.85, 14.26, 11],
  SA: [40.68, 14.76, 10],
  CE: [41.07, 14.33, 11],
  AV: [40.91, 14.79, 11],
  BN: [41.13, 14.78, 11],
};

// Prezzo minimo di ogni marcatore e presenza di un prezzo sotto 2 €: servono ai cluster per riassumere il gruppo
const markerStats = new WeakMap<L.Marker, { minPrice: number; underTwo: boolean }>();

// Le icone a pillola si riusano: con centinaia di impianti non se ne crea una per ogni marcatore
const pillIcons = new Map<string, L.DivIcon>();

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Nomi e indirizzi arrivano dai dati MIMIT: vanno escapati prima di entrare nel popup
const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

const brandClassOf = (brand: string): string => {
  const b = brand.toLowerCase();
  if (b.includes('eni')) return 'brand-eni';
  if (b.includes('ip')) return 'brand-ip';
  if (b.includes('q8')) return 'brand-q8';
  return '';
};

const pillIconFor = (st: GasStation): L.DivIcon => {
  const brandClass = brandClassOf(st.brand);
  const priceText = st.minPrice > 0 ? `${st.minPrice.toFixed(2)}€` : 'N/D';
  const key = `${brandClass}|${st.hasUnder2Euro ? 'cap' : 'std'}|${priceText}`;
  let icon = pillIcons.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div class="custom-price-marker ${brandClass} ${st.hasUnder2Euro ? 'price-cap-pulse' : ''}">${priceText}</div>`,
      iconSize: [48, 22],
      iconAnchor: [24, 11],
    });
    pillIcons.set(key, icon);
  }
  return icon;
};

// Cluster: numero di impianti nel gruppo, prezzo più basso contenuto e colore verde se c'è un prezzo sotto 2 €
const clusterIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  const children = cluster.getAllChildMarkers() as L.Marker[];
  let minPrice = Infinity;
  let underTwo = false;
  for (const marker of children) {
    const stats = markerStats.get(marker);
    if (!stats) continue;
    if (stats.minPrice > 0 && stats.minPrice < minPrice) minPrice = stats.minPrice;
    if (stats.underTwo) underTwo = true;
  }
  const priceLabel = minPrice < Infinity ? `<small>da ${minPrice.toFixed(2)}€</small>` : '';
  return L.divIcon({
    className: 'map-cluster-icon',
    html: `<div class="map-cluster${underTwo ? ' map-cluster--under2' : ''}"><span>${children.length}</span>${priceLabel}</div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const popupHtml = (st: GasStation): string => {
  const rows = st.prices
    .map((p) => {
      // Un prezzo pari o inferiore a zero è "N/D", mai un prezzo reale (regola di testo.txt)
      const price = p.price > 0 ? `${p.price.toFixed(3)} €` : 'N/D';
      return `<div class="station-popup__row"><span>${escapeHtml(p.rawFuelName)} (${p.isSelf ? 'Self' : 'Serv'})</span><strong class="${p.isUnder2Euro ? 'is-cap' : ''}">${price}</strong></div>`;
    })
    .join('');
  const distance =
    typeof st.distanceKm === 'number'
      ? `<div class="station-popup__dist">📍 a ${st.distanceKm < 1 ? `${Math.round(st.distanceKm * 1000)} m` : `${st.distanceKm.toFixed(1)} km`} da te</div>`
      : '';
  return `
    <div class="station-popup">
      <div class="station-popup__name">${escapeHtml(st.name)}</div>
      <div class="station-popup__addr">${escapeHtml(st.address ? `${st.address}, ` : '')}<strong>${escapeHtml(st.city)}</strong> (${escapeHtml(st.province)})</div>
      ${distance}
      <div class="station-popup__box">
        <div class="station-popup__label">Listino prezzi rilevato</div>
        ${rows}
      </div>
      <a class="station-popup__cta" href="https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}" target="_blank" rel="noopener noreferrer">Apri navigatore</a>
    </div>`;
};

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedProvince,
  userLocation,
  searchQuery,
  isLocating,
  onLocateMe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Su schermi stretti lo zoom iniziale è uno in meno, così si vede tutta la zona
  const zoomFor = (zoom: number): number => (window.innerWidth < 640 ? zoom - 1 : zoom);

  // 1. Crea la mappa una sola volta e la distrugge quando il componente esce dalla pagina
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const [lat, lng, zoom] = PROVINCE_CENTERS[selectedProvince] || PROVINCE_CENTERS.all;
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: zoomFor(zoom),
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: (z: number) => (z >= 15 ? 20 : 60),
      iconCreateFunction: clusterIcon,
    });
    cluster.addTo(map);

    mapRef.current = map;
    clusterRef.current = cluster;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // 2. Marcatori: si ricostruiscono quando cambiano gli impianti (filtri o distanza GPS)
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();
    const markers: L.Marker[] = [];
    for (const st of stations) {
      if (!st.latitude || !st.longitude) continue;

      const marker = L.marker([st.latitude, st.longitude], {
        icon: pillIconFor(st),
        title: st.name,
        riseOnHover: true,
      });
      // Il contenuto del popup si costruisce solo quando il popup si apre
      // Lo spazio in alto a sinistra è dei pulsanti zoom: il popup si sposta in modo da non finirci sotto
      marker.bindPopup(() => popupHtml(st), {
        minWidth: 220,
        maxWidth: 260,
        autoPanPaddingTopLeft: L.point(64, 16),
        autoPanPaddingBottomRight: L.point(16, 16),
      });
      markerStats.set(marker, { minPrice: st.minPrice, underTwo: st.hasUnder2Euro });
      markers.push(marker);
    }
    cluster.addLayers(markers);
  }, [stations]);

  // 3. Centro della mappa solo quando cambiano provincia o territorio: i filtri non la riportano al centro
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const [lat, lng, zoom] = PROVINCE_CENTERS[selectedProvince] || PROVINCE_CENTERS.all;
    map.setView([lat, lng], zoomFor(zoom));
  }, [selectedProvince]);

  // 4. Ricerca: inquadra gli impianti trovati
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || !searchQuery) return;
    const bounds = cluster.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [searchQuery, stations]);

  // 5. Posizione GPS: punto blu sulla mappa e vista centrata sull'utente
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    if (!userLocation) return;

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.divIcon({
        className: 'user-pin-icon',
        html: '<span class="user-pin"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
    map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [userLocation]);

  const fitResults = () => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;
    const bounds = cluster.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  };

  return (
    <div className="relative w-full h-[60svh] min-h-[320px] sm:h-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={containerRef} className="w-full h-full" />

      {/* Pulsanti sulla mappa: posizione GPS e inquadratura di tutti i risultati */}
      <div className="absolute bottom-10 right-3 z-[1000] flex flex-col gap-2">
        {onLocateMe && (
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            aria-label="Centra la mappa sulla mia posizione"
            title="Dove sono"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sky-700 shadow-md border border-slate-200 transition active:scale-95 disabled:opacity-60"
          >
            <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          type="button"
          onClick={fitResults}
          aria-label="Inquadra tutti i distributori"
          title="Tutti i risultati"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md border border-slate-200 transition active:scale-95"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Legenda: su smartphone va a capo e lascia libera la colonna dei pulsanti */}
      <div className="absolute bottom-3 left-3 right-16 sm:right-auto z-[1000] flex flex-wrap items-center gap-x-3 gap-y-1 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-[11px] sm:text-xs text-slate-700 font-medium">
        <span className="whitespace-nowrap"><span className="font-bold text-emerald-700">Verde:</span> &lt; 2.00 €</span>
        <span className="whitespace-nowrap"><span className="font-bold text-amber-600">Giallo:</span> Eni</span>
        <span className="whitespace-nowrap"><span className="font-bold text-sky-600">Blu:</span> IP</span>
        <span className="whitespace-nowrap"><span className="font-bold text-rose-600">Rosso:</span> Q8</span>
      </div>
    </div>
  );
};
