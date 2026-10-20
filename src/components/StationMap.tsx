'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet-rotate';
import type { Feature, FeatureCollection } from 'geojson';
import { Crosshair, Focus, LocateFixed, LocateOff, Maximize2, Minimize2, Navigation, RotateCw } from 'lucide-react';
import { GasStation } from '../types/fuel';
import { CAMPANIA_BOUNDS, UserLocation, formatDistanceMeters } from '../lib/geo';
import confini from '../data/campania-confini.json';

interface StationMapProps {
  stations: GasStation[];
  selectedProvince: string;
  userLocation?: UserLocation | null;
  searchQuery?: string;
  isLocating?: boolean;
  onLocateMe?: () => void;
  onClearLocation?: () => void;
  onPickLocation?: (lat: number, lng: number) => void;
}

const PROVINCE_CENTERS: Record<string, [number, number, number]> = {
  all: [40.85, 14.65, 9], // Center of Campania
  PENISOLA_SORRENTINA: [40.645, 14.415, 12], // Penisola Sorrentina: Vico Equense, Meta, Sorrento, Massa Lubrense
  COSTIERA_AMALFITANA: [40.65, 14.605, 12], // Costiera Amalfitana: da Positano a Vietri sul Mare
  NA: [40.85, 14.26, 11],
  SA: [40.68, 14.76, 10],
  CE: [41.07, 14.33, 11],
  AV: [40.91, 14.79, 11],
  BN: [41.13, 14.78, 11],
};

// Le due costiere si inquadrano con un riquadro: la mappa lo adatta allo schermo, verticale od orizzontale
const AREA_BOUNDS: Record<string, L.LatLngBoundsExpression> = {
  PENISOLA_SORRENTINA: [
    [40.56, 14.31],
    [40.7, 14.47],
  ],
  COSTIERA_AMALFITANA: [
    [40.6, 14.46],
    [40.73, 14.75],
  ],
};

// Con lo zoom indietro e lo spostamento la mappa resta sulla Campania
const CAMPANIA = L.latLngBounds(CAMPANIA_BOUNDS);
// Un cerchio di precisione più grande della mappa non serve: oltre questo valore non viene disegnato
const MAX_ACCURACY_CIRCLE_M = 5000;

// Colori delle province: gli stessi dei badge provincia nelle schede (NA blu, SA ambra, CE verde, AV viola, BN rosa)
const PROVINCE_STYLE: Record<string, { fill: string; text: string; name: string }> = {
  NA: { fill: '#3b82f6', text: '#1e40af', name: 'Napoli' },
  SA: { fill: '#f59e0b', text: '#92400e', name: 'Salerno' },
  CE: { fill: '#10b981', text: '#065f46', name: 'Caserta' },
  AV: { fill: '#a855f7', text: '#6b21a8', name: 'Avellino' },
  BN: { fill: '#f43f5e', text: '#9f1239', name: 'Benevento' },
};
// Da questo zoom in su le tinte delle province sbiadiscono e i nomi spariscono: in città contano le strade
const DETAIL_ZOOM = 13;

// Confini ISTAT (1 gennaio 2026, via geojson-italy), semplificati a 100 m e inclusi nel progetto: nessuna chiamata di rete
const BOUNDARIES = confini as unknown as FeatureCollection;
// Credito breve per stare su una riga anche sui telefoni: quello completo (CC BY 4.0) è nel piè di pagina
const BOUNDARY_ATTRIBUTION = 'Confini © <a href="https://www.istat.it/">ISTAT</a>';

const boundariesOf = (level: string): FeatureCollection => ({
  type: 'FeatureCollection',
  features: BOUNDARIES.features.filter((f) => f.properties?.livello === level),
});

const provinceFill = (feature: Feature | undefined, detail: boolean): L.PathOptions => ({
  stroke: false,
  fillColor: PROVINCE_STYLE[feature?.properties?.prov_acr]?.fill ?? '#94a3b8',
  fillOpacity: detail ? 0.04 : 0.1,
});

// Prezzo minimo di ogni marcatore e presenza di un prezzo sotto 2 €: servono ai cluster per riassumere il gruppo
const markerStats = new WeakMap<L.Marker, { minPrice: number; underTwo: boolean }>();

// Le icone a pillola si riusano: con centinaia di impianti non se ne crea una per ogni marcatore
const pillIcons = new Map<string, L.DivIcon>();

const userPinIcon = L.divIcon({
  className: 'user-pin-icon',
  html: '<span class="user-pin"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

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
      ? `<div class="station-popup__dist">📍 a ${formatDistanceMeters(st.distanceKm * 1000)} da te</div>`
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

const btnBase =
  'flex h-11 w-11 items-center justify-center rounded-xl shadow-md border transition active:scale-95 disabled:opacity-60';
const btnNormal = `${btnBase} bg-white border-slate-200 text-slate-700`;
const btnSky = `${btnBase} bg-white border-slate-200 text-sky-700`;
const btnSkyActive = `${btnBase} bg-sky-600 border-sky-600 text-white`;
const btnPicking = `${btnBase} bg-amber-100 border-amber-400 text-amber-900`;

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedProvince,
  userLocation,
  searchQuery,
  isLocating,
  onLocateMe,
  onClearLocation,
  onPickLocation,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyRef = useRef<L.Circle | null>(null);
  const pickingRef = useRef(false);
  const onPickRef = useRef(onPickLocation);

  const [picking, setPicking] = useState(false);
  const [bearing, setBearing] = useState(0);
  // Schermo intero: quello nativo del browser quando c'è, altrimenti la mappa occupa tutta la pagina via CSS
  const [nativeFull, setNativeFull] = useState(false);
  const [cssFull, setCssFull] = useState(false);
  const isFull = nativeFull || cssFull;

  // Su schermi stretti lo zoom iniziale è uno in meno, così si vede tutta la zona
  const zoomFor = (zoom: number): number => (window.innerWidth < 640 ? zoom - 1 : zoom);

  useEffect(() => {
    onPickRef.current = onPickLocation;
  }, [onPickLocation]);

  useEffect(() => {
    pickingRef.current = picking;
  }, [picking]);

  // 1. Crea la mappa una sola volta e la distrugge quando il componente esce dalla pagina
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const [lat, lng, zoom] = PROVINCE_CENTERS[selectedProvince] || PROVINCE_CENTERS.all;
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: zoomFor(zoom),
      maxBounds: CAMPANIA,
      maxBoundsViscosity: 1,
      zoomControl: true,
      attributionControl: true,
      // Rotazione: due dita sul telefono, Shift + rotella sul computer, pulsanti sulla mappa
      rotate: true,
      bearing: 0,
      // Il plugin aggiungerebbe un suo controllo di rotazione: qui ci sono già i nostri pulsanti
      rotateControl: false,
      touchRotate: true,
      shiftKeyRotate: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Confini: tinta tenue per provincia, tratteggio tra province, linea marcata con alone bianco per la regione.
    // Non sono interattivi: tocchi e clic passano alla mappa e ai distributori
    const provinces = L.geoJSON(boundariesOf('provincia'), {
      interactive: false,
      style: (f) => provinceFill(f, false),
    }).addTo(map);
    L.geoJSON(boundariesOf('confine-interno'), {
      interactive: false,
      style: { color: '#475569', weight: 1.3, opacity: 0.8, dashArray: '6 4' },
    }).addTo(map);
    L.geoJSON(boundariesOf('regione'), {
      interactive: false,
      style: { color: '#ffffff', weight: 6, opacity: 0.85, fill: false },
    }).addTo(map);
    L.geoJSON(boundariesOf('regione'), {
      interactive: false,
      attribution: BOUNDARY_ATTRIBUTION,
      style: { color: '#0f172a', weight: 2.5, opacity: 0.9, fill: false },
    }).addTo(map);

    // Nomi delle province, sotto i marcatori dei distributori
    const provinceLabels = L.layerGroup(
      boundariesOf('provincia').features.map((f) => {
        const p = f.properties as { prov_acr: string; labelLat: number; labelLng: number };
        const style = PROVINCE_STYLE[p.prov_acr];
        return L.marker([p.labelLat, p.labelLng], {
          icon: L.divIcon({
            className: 'province-label-icon',
            html: `<span class="province-label" style="color:${style?.text ?? '#334155'}">${style?.name ?? p.prov_acr}</span>`,
            iconSize: [140, 18],
            iconAnchor: [70, 9],
          }),
          interactive: false,
          keyboard: false,
          zIndexOffset: -1000,
        });
      })
    );

    const applyZoomStyle = () => {
      const detail = map.getZoom() >= DETAIL_ZOOM;
      provinces.setStyle((f) => provinceFill(f, detail));
      if (detail) provinceLabels.remove();
      else if (!map.hasLayer(provinceLabels)) provinceLabels.addTo(map);
    };
    map.on('zoomend', applyZoomStyle);
    applyZoomStyle();

    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: (z: number) => (z >= 15 ? 20 : 60),
      iconCreateFunction: clusterIcon,
    });
    cluster.addTo(map);

    // In modalità "imposta a mano" il tocco sulla mappa diventa la posizione dell'utente
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!pickingRef.current) return;
      pickingRef.current = false;
      setPicking(false);
      onPickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    map.on('rotate', () => setBearing(map.getBearing()));

    // Lo zoom indietro si ferma quando tutta la Campania sta nello schermo: più indietro si vedrebbero solo le regioni vicine
    const updateMinZoom = () => {
      const fit = Math.ceil(map.getBoundsZoom(CAMPANIA, false));
      if (!Number.isFinite(fit)) return;
      map.setMinZoom(fit);
      if (map.getZoom() < fit) map.setZoom(fit);
    };
    map.whenReady(updateMinZoom);
    map.on('resize', updateMinZoom);

    mapRef.current = map;
    clusterRef.current = cluster;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      userMarkerRef.current = null;
      accuracyRef.current = null;
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
    const area = AREA_BOUNDS[selectedProvince];
    if (area) {
      map.fitBounds(area, { padding: [12, 12] });
      return;
    }
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

  // 5. Posizione: punto blu, cerchio di precisione e vista centrata sull'utente (solo se è in Campania)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();
    accuracyRef.current?.remove();
    userMarkerRef.current = null;
    accuracyRef.current = null;
    if (!userLocation) return;

    const { lat, lng, accuracy } = userLocation;
    if (accuracy && accuracy <= MAX_ACCURACY_CIRCLE_M) {
      accuracyRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#0284c7',
        weight: 1,
        fillColor: '#0284c7',
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);
    }
    userMarkerRef.current = L.marker([lat, lng], {
      icon: userPinIcon,
      interactive: false,
      keyboard: false,
    }).addTo(map);

    if (CAMPANIA.contains([lat, lng])) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    }
  }, [userLocation]);

  // 6. Schermo intero: il browser avvisa quando lo si chiude (per esempio con Esc)
  useEffect(() => {
    const onChange = () => setNativeFull(document.fullscreenElement === wrapperRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!cssFull) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCssFull(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cssFull]);

  // Quando cambia la dimensione la mappa ricalcola lo spazio disponibile
  useEffect(() => {
    const timer = window.setTimeout(() => mapRef.current?.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [isFull]);

  const toggleFullscreen = () => {
    if (nativeFull && document.fullscreenElement) {
      document.exitFullscreen().catch(() => setNativeFull(false));
      return;
    }
    if (cssFull) {
      setCssFull(false);
      return;
    }
    const el = wrapperRef.current;
    if (el && typeof el.requestFullscreen === 'function') {
      el.requestFullscreen().catch(() => setCssFull(true));
      return;
    }
    setCssFull(true);
  };

  const rotateBy = (degrees: number) => {
    const map = mapRef.current;
    if (map) map.setBearing(map.getBearing() + degrees);
  };

  const resetBearing = () => mapRef.current?.setBearing(0);

  const fitResults = () => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;
    const bounds = cluster.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  };

  const rotated = bearing > 0.5 && bearing < 359.5;

  return (
    <div
      ref={wrapperRef}
      className={`${
        isFull
          ? 'fixed inset-0 z-[3000] h-[100svh] w-full bg-slate-100'
          : 'relative w-full h-[72svh] min-h-[420px] md:h-[460px] lg:h-[540px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100'
      } ${picking ? 'cursor-crosshair' : ''}`}
    >
      {/* La classe del contenitore è di Leaflet: non va cambiata da React, per il cursore si usa il wrapper */}
      <div ref={containerRef} className="w-full h-full" />

      {/* In alto a destra: tutti i risultati, schermo intero, rotazione e ritorno al nord */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={fitResults}
          aria-label="Inquadra tutti i distributori"
          title="Tutti i risultati"
          className={btnNormal}
        >
          <Focus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFull ? 'Esci dal pieno schermo' : 'Pieno schermo'}
          title={isFull ? 'Esci dal pieno schermo' : 'Pieno schermo'}
          className={btnNormal}
        >
          {isFull ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={() => rotateBy(45)}
          aria-label="Ruota la mappa di 45 gradi"
          title="Ruota"
          className={btnNormal}
        >
          <RotateCw className="w-5 h-5" />
        </button>
        {rotated && (
          <button
            type="button"
            onClick={resetBearing}
            aria-label="Riporta il nord in alto"
            title="Nord in alto"
            className={btnNormal}
          >
            <Navigation className="w-5 h-5" style={{ transform: `rotate(${bearing}deg)` }} />
          </button>
        )}
      </div>

      {/* In basso a destra: posizione GPS, disattivazione e posizione scelta a mano (servono anche a schermo intero) */}
      <div className="absolute bottom-10 right-3 z-[1000] flex flex-col gap-2">
        {onLocateMe && (
          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            aria-label="Centra la mappa sulla mia posizione"
            title="Dove sono"
            className={userLocation ? btnSkyActive : btnSky}
          >
            <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        )}
        {userLocation && onClearLocation && (
          <button
            type="button"
            onClick={onClearLocation}
            aria-label="Disattiva la posizione"
            title="Disattiva posizione"
            className={btnNormal}
          >
            <LocateOff className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setPicking((p) => !p)}
          aria-pressed={picking}
          aria-label="Imposta la mia posizione toccando la mappa"
          title="Imposta a mano"
          className={picking ? btnPicking : btnNormal}
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {picking && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-[1000] whitespace-nowrap rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-md">
          Tocca la mappa dove ti trovi
        </div>
      )}

      {/* Legenda: su smartphone va a capo, lascia libera la colonna dei pulsanti e sta sopra la riga dei crediti */}
      <div className="absolute bottom-7 sm:bottom-3 left-3 right-16 sm:right-auto z-[1000] flex flex-wrap items-center gap-x-3 gap-y-1 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-[11px] sm:text-xs text-slate-700 font-medium">
        <span className="whitespace-nowrap"><span className="font-bold text-emerald-700">Verde:</span> &lt; 2.00 €</span>
        <span className="whitespace-nowrap"><span className="font-bold text-amber-600">Giallo:</span> Eni</span>
        <span className="whitespace-nowrap"><span className="font-bold text-sky-600">Blu:</span> IP</span>
        <span className="whitespace-nowrap"><span className="font-bold text-rose-600">Rosso:</span> Q8</span>
      </div>
    </div>
  );
};
