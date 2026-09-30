'use client';

import React from 'react';
import { Search, MapPin, Sparkles, LayoutGrid, Table as TableIcon, Map as MapIcon, Locate, Compass } from 'lucide-react';

export type ViewMode = 'grid' | 'table' | 'map';

interface FiltersProps {
  selectedProvince: string;
  onProvinceChange: (p: string) => void;
  selectedFuel: string;
  onFuelChange: (f: string) => void;
  selectedBrand: string;
  onBrandChange: (b: string) => void;
  onlyUnder2: boolean;
  onToggleUnder2: (val: boolean) => void;
  onlySelf: boolean;
  onToggleSelf: (val: boolean) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  totalResults: number;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe: () => void;
  isLocating: boolean;
  sortByDistance: boolean;
  onToggleSortByDistance: (val: boolean) => void;
}

const PROVINCES = [
  { code: 'all', label: 'Tutta la Campania' },
  { code: 'NA', label: 'Napoli (NA)' },
  { code: 'SA', label: 'Salerno (SA)' },
  { code: 'CE', label: 'Caserta (CE)' },
  { code: 'AV', label: 'Avellino (AV)' },
  { code: 'BN', label: 'Benevento (BN)' },
];

const FUEL_TYPES: { type: string; label: string }[] = [
  { type: 'all', label: 'Tutti i carburanti' },
  { type: 'Benzina', label: 'Benzina' },
  { type: 'Gasolio', label: 'Gasolio / Diesel' },
  { type: 'GPL', label: 'GPL' },
  { type: 'Metano', label: 'Metano' },
];

const BRANDS = [
  { code: 'all', label: 'Tutti i Marchi' },
  { code: 'Eni', label: 'Eni / Agip' },
  { code: 'IP', label: 'IP / Api' },
  { code: 'Q8', label: 'Q8' },
  { code: 'Esso', label: 'Esso' },
  { code: 'Pompe Bianche', label: 'Pompe Bianche / No Logo' },
];

export const Filters: React.FC<FiltersProps> = ({
  selectedProvince,
  onProvinceChange,
  selectedFuel,
  onFuelChange,
  selectedBrand,
  onBrandChange,
  onlyUnder2,
  onToggleUnder2,
  onlySelf,
  onToggleSelf,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  totalResults,
  userLocation,
  onLocateMe,
  isLocating,
  sortByDistance,
  onToggleSortByDistance,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs mb-6 space-y-4">
      {/* Top row: Search input + GPS button + View Mode switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca comune (es. Napoli, Salerno, Giugliano...), via o gestore..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* GPS Geolocation Button (Inspired by inSella guide) */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 shrink-0 ${
            userLocation && sortByDistance
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Attiva GPS per trovare i distributori più vicini alla tua posizione attuale (come suggerito da inSella)"
        >
          <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-400' : ''}`} />
          <span>{isLocating ? 'Rilevamento...' : userLocation ? '📍 GPS Attivo (Vicini)' : '📍 Più vicini (GPS)'}</span>
        </button>

        {/* View Mode Toggle */}
        <div className="inline-flex self-start sm:self-auto p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Schede</span>
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Classifica</span>
          </button>
          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              viewMode === 'map'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Mappa OSM</span>
          </button>
        </div>
      </div>

      {/* Row 2: Selectors & Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Province Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Provincia della Campania
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fuel Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Tipo Carburante
          </label>
          <select
            value={selectedFuel}
            onChange={(e) => onFuelChange(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            {FUEL_TYPES.map((f) => (
              <option key={f.type} value={f.type}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Marchio / Operatore
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          >
            {BRANDS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle switches container */}
        <div className="flex flex-col justify-end gap-1.5">
          <label className="relative flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyUnder2}
              onChange={(e) => onToggleUnder2(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Solo &lt; 2.00 €</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded">Price Cap</span>
            </span>
          </label>

          <label className="relative flex items-center gap-2 cursor-pointer select-none mt-1">
            <input
              type="checkbox"
              checked={onlySelf}
              onChange={(e) => onToggleSelf(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-800"></div>
            <span className="text-xs font-medium text-slate-700">
              Solo Self-Service
            </span>
          </label>
        </div>
      </div>

      {/* Row 3: Active Filters & Results Counter */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Mostrando <strong className="text-slate-900">{totalResults}</strong> impianti trovati
            {selectedProvince !== 'all' && <span> in provincia di <strong>{selectedProvince}</strong></span>}
            {onlyUnder2 && <span className="text-emerald-700 font-semibold"> (con sconti sotto 2.00 €)</span>}
          </span>

          {userLocation && (
            <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Ordinamento per vicinanza GPS attivo
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://carburanti.mise.gov.it/ospzSearch/zona"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 font-medium"
            title="Confronta su carburanti.mise.gov.it/ospzSearch/zona"
          >
            <Compass className="w-3 h-3 text-emerald-600" />
            <span>MIMIT Zona</span>
          </a>

          {(selectedProvince !== 'all' || selectedFuel !== 'all' || selectedBrand !== 'all' || searchQuery !== '' || !onlyUnder2 || userLocation) && (
            <button
              onClick={() => {
                onProvinceChange('all');
                onFuelChange('all');
                onBrandChange('all');
                onSearchChange('');
                onToggleUnder2(true);
                onToggleSelf(false);
                onToggleSortByDistance(false);
              }}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2"
            >
              Ripristina filtri
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
