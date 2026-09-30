'use client';

import React from 'react';
import { Search, LayoutGrid, Table as TableIcon, Map as MapIcon, Locate, Compass, ShieldCheck, Tag } from 'lucide-react';

export type ViewMode = 'grid' | 'table' | 'map';
export type TerritoryMode = 'all' | 'penisola';

interface FiltersProps {
  selectedTerritory: TerritoryMode;
  onTerritoryChange: (t: TerritoryMode) => void;
  selectedProvince: string;
  onProvinceChange: (p: string) => void;
  selectedFuel: string;
  onFuelChange: (f: string) => void;
  selectedBrand: string;
  onBrandChange: (b: string) => void;
  onlyUnder2: boolean;
  onToggleUnder2: (val: boolean) => void;
  onlyPriceCap: boolean;
  onTogglePriceCap: (val: boolean) => void;
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
  { code: 'all', label: 'Tutte le Province' },
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
  selectedTerritory,
  onTerritoryChange,
  selectedProvince,
  onProvinceChange,
  selectedFuel,
  onFuelChange,
  selectedBrand,
  onBrandChange,
  onlyUnder2,
  onToggleUnder2,
  onlyPriceCap,
  onTogglePriceCap,
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
      {/* 1. Ambito Territoriale In Evidenza (Filtro Penisola Sorrentina Estetico & Moderno) */}
      <div className="bg-gradient-to-r from-slate-50 via-sky-50/50 to-emerald-50/40 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs text-sky-700 shrink-0">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Ambito Territoriale
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                — Seleziona rapidamente l&apos;area geografica
              </span>
            </div>
            {selectedTerritory === 'penisola' ? (
              <p className="text-[11px] text-sky-900 font-medium mt-0.5">
                🌊 <strong>Penisola Sorrentina attiva:</strong> Massa Lubrense · Sorrento · Sant&apos;Agnello · Piano di Sorrento · Meta · Vico Equense
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                🏛️ Monitoraggio regionale attivo su tutte le 5 province campane
              </p>
            )}
          </div>
        </div>

        {/* Territory Switcher Segmented Control */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200/90 shadow-xs self-start sm:self-auto shrink-0 gap-1">
          <button
            onClick={() => onTerritoryChange('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
              selectedTerritory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🏛️ Tutta la Campania</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedTerritory === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              5 Prov.
            </span>
          </button>

          <button
            onClick={() => {
              onTerritoryChange('penisola');
              onProvinceChange('all');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 select-none ${
              selectedTerritory === 'penisola'
                ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md ring-2 ring-sky-300'
                : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
            }`}
            title="Visualizza i 22 distributori dei 6 comuni della Penisola Sorrentina"
          >
            <span>🌊 Penisola Sorrentina</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedTerritory === 'penisola' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
              }`}
            >
              22 Pompe
            </span>
          </button>
        </div>
      </div>

      {/* 2. Search input + GPS button + View Mode switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca comune (es. Sorrento, Napoli, Salerno...), via o gestore..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* GPS Geolocation Button */}
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 shrink-0 ${
            userLocation && sortByDistance
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Attiva GPS per trovare i distributori più vicini alla tua posizione attuale (guida inSella)"
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

      {/* 3. Selectors & Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Province Selector (disabled when Penisola Sorrentina is active) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Provincia della Campania
          </label>
          <select
            value={selectedProvince}
            disabled={selectedTerritory === 'penisola'}
            onChange={(e) => {
              onProvinceChange(e.target.value);
              if (selectedTerritory === 'penisola') {
                onTerritoryChange('all');
              }
            }}
            className={`w-full text-xs sm:text-sm border border-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              selectedTerritory === 'penisola'
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50 text-slate-800 focus:bg-white'
            }`}
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

        {/* 3 Dedicated Key Toggles: Accordo Price Cap (Default), Tutti < 2€, Self-Service (Default) */}
        <div className="flex flex-col justify-center gap-1.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/70">
          {/* Toggle 1: Aderenti Price Cap (Eni, IP, Q8, Esso) - DEFAULT ATTIVO */}
          <label className="relative flex items-center justify-between gap-2 cursor-pointer select-none">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Accordo Price Cap</span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-1 rounded font-semibold">Grandi Reti &lt;2€</span>
            </span>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={onlyPriceCap}
                onChange={(e) => {
                  const val = e.target.checked;
                  onTogglePriceCap(val);
                  if (val && onlyUnder2) {
                    onToggleUnder2(false);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
            </div>
          </label>

          {/* Toggle 2: Prezzo < 2.00 € Tutti i gestori (inclusi No Logo / Pompe Bianche) */}
          <label className="relative flex items-center justify-between gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Tutti sotto i 2.00 €</span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 rounded font-semibold">+ No Logo</span>
            </span>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={onlyUnder2}
                onChange={(e) => {
                  const val = e.target.checked;
                  onToggleUnder2(val);
                  if (val && onlyPriceCap) {
                    onTogglePriceCap(false);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
            </div>
          </label>

          {/* Toggle 3: Solo Self-Service - DEFAULT ATTIVO */}
          <label className="relative flex items-center justify-between gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <span>Solo Self-Service</span>
              <span className="text-[10px] text-slate-600 bg-slate-200 px-1 rounded font-mono">SELF</span>
            </span>
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={onlySelf}
                onChange={(e) => onToggleSelf(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-800"></div>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Active Filters & Results Counter */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Mostrando <strong className="text-slate-900">{totalResults}</strong> impianti
            {selectedTerritory === 'penisola' ? (
              <span className="text-sky-800 font-bold"> in Penisola Sorrentina</span>
            ) : selectedProvince !== 'all' ? (
              <span> in provincia di <strong>{selectedProvince}</strong></span>
            ) : (
              <span> in tutta la Campania</span>
            )}
            {onlyPriceCap && <span className="text-amber-700 font-semibold"> (Accordo Price Cap Grandi Reti &lt;2€)</span>}
            {onlyUnder2 && <span className="text-emerald-700 font-semibold"> (Tutti i marchi &lt;2€)</span>}
            {onlySelf && <span className="text-slate-600 font-medium"> [Self]</span>}
          </span>

          {userLocation && (
            <span className="text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              📍 Ordinamento per vicinanza GPS attivo
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {(selectedTerritory !== 'all' ||
            selectedProvince !== 'all' ||
            selectedFuel !== 'all' ||
            selectedBrand !== 'all' ||
            searchQuery !== '' ||
            !onlyPriceCap ||
            !onlySelf ||
            onlyUnder2 ||
            userLocation) && (
            <button
              onClick={() => {
                onTerritoryChange('all');
                onProvinceChange('all');
                onFuelChange('all');
                onBrandChange('all');
                onSearchChange('');
                onTogglePriceCap(true);
                onToggleSelf(true);
                onToggleUnder2(false);
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
