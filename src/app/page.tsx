'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GasStation, FuelStats, FuelApiResponse } from '@/types/fuel';
import { Header } from '@/components/Header';
import { NewsBanner } from '@/components/NewsBanner';
import { StatsBanner } from '@/components/StatsBanner';
import { Legenda } from '@/components/Legenda';
import { Filters, ViewMode } from '@/components/Filters';
import { StationCard } from '@/components/StationCard';
import { StationTable } from '@/components/StationTable';
import { Footer } from '@/components/Footer';
import { AlertCircle, Loader2, Sparkles, FilterX, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

const StationMap = dynamic(
  () => import('@/components/StationMap').then((mod) => mod.StationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
        <span>Caricamento mappa OpenStreetMap...</span>
      </div>
    ),
  }
);

function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomePage() {
  const [stations, setStations] = useState<GasStation[]>([]);
  const [stats, setStats] = useState<FuelStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedFuel, setSelectedFuel] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [onlyUnder2, setOnlyUnder2] = useState<boolean>(true); // default true for price cap focus
  // User explicitly requested: "di default metti solo Self-service"
  const [onlySelf, setOnlySelf] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Search Feedback when price cap or self excludes searched town
  const [searchFeedback, setSearchFeedback] = useState<{
    matchingWithoutPriceCapCount: number;
    minPriceFound?: number;
  } | null>(null);

  // GPS Geolocation States (Recommended by inSella article)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [sortByDistance, setSortByDistance] = useState<boolean>(false);

  // Pagination for grid
  const [visibleCount, setVisibleCount] = useState<number>(36);

  const loadData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        provincia: selectedProvince,
        carburante: selectedFuel,
        brand: selectedBrand,
        onlyUnder2: onlyUnder2 ? 'true' : 'false',
        onlySelf: onlySelf ? 'true' : 'false',
        search: searchQuery,
      });

      if (forceRefresh) {
        params.append('refresh', 'true');
      }

      const res = await fetch(`/api/fuel?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Errore HTTP ${res.status}`);
      }

      const json: FuelApiResponse = await res.json();
      if (json.success) {
        setStations(json.data);
        setStats(json.stats);
        setSearchFeedback(json.searchFeedback || null);
      } else {
        throw new Error('Dati non validi restituiti dal server.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Impossibile caricare i prezzi aggiornati. Riprova tra poco.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvince, selectedFuel, selectedBrand, onlyUnder2, onlySelf, searchQuery]);

  // Load data when filters change (debounced for search)
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(handler);
  }, [loadData]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(36);
  }, [selectedProvince, selectedFuel, selectedBrand, onlyUnder2, onlySelf, searchQuery]);

  // Handle GPS location request
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setSortByDistance(true);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Impossibile rilevare la posizione GPS. Verifica i permessi del browser.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Enhance stations with distance and sort accordingly
  const processedStations = useMemo(() => {
    let list = [...stations];

    if (userLocation) {
      list = list.map((st) => {
        if (st.latitude && st.longitude) {
          const dist = computeHaversineKm(
            userLocation.lat,
            userLocation.lng,
            st.latitude,
            st.longitude
          );
          return { ...st, distanceKm: dist };
        }
        return st;
      });

      if (sortByDistance) {
        list.sort((a, b) => {
          const distA = typeof a.distanceKm === 'number' ? a.distanceKm : 9999;
          const distB = typeof b.distanceKm === 'number' ? b.distanceKm : 9999;
          return distA - distB;
        });
      }
    }

    return list;
  }, [stations, userLocation, sortByDistance]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 1. Header */}
      <Header
        lastUpdated={stats?.lastDataExtraction}
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        totalUnder2={stats?.stationsUnder2Euro || 0}
      />

      {/* 2. News Banner referring to Il Sole 24 Ore, inSella and MIMIT */}
      <NewsBanner />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* 3. KPI Statistics Banner */}
        <StatsBanner stats={stats} selectedProvince={selectedProvince} />

        {/* 4. Legenda & Symbol Guide */}
        <Legenda />

        {/* 5. Filters & Controls */}
        <Filters
          selectedProvince={selectedProvince}
          onProvinceChange={setSelectedProvince}
          selectedFuel={selectedFuel}
          onFuelChange={setSelectedFuel}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          onlyUnder2={onlyUnder2}
          onToggleUnder2={setOnlyUnder2}
          onlySelf={onlySelf}
          onToggleSelf={setOnlySelf}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={processedStations.length}
          userLocation={userLocation}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          sortByDistance={sortByDistance}
          onToggleSortByDistance={setSortByDistance}
        />

        {/* Smart Search Notice (e.g. Meta has stations > 2€ or only Servito) */}
        {searchFeedback && searchFeedback.matchingWithoutPriceCapCount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-200 text-amber-900 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </span>
              <div className="text-xs sm:text-sm">
                <p className="font-bold text-amber-900">
                  Trovati {searchFeedback.matchingWithoutPriceCapCount} distributori per &ldquo;{searchQuery}&rdquo;, ma superano la soglia dei 2.00 € o sono solo Servito
                </p>
                <p className="text-amber-800 text-xs mt-0.5">
                  I prezzi rilevati partono da{' '}
                  <strong>{searchFeedback.minPriceFound ? `${searchFeedback.minPriceFound.toFixed(3)} €/L` : 'oltre 2.00 €'}</strong>.
                  Puoi visualizzarli rimuovendo i vincoli di prezzo e self-service.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setOnlyUnder2(false);
                setOnlySelf(false);
              }}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition active:scale-95 shadow-xs"
            >
              Mostra tutti i distributori di &ldquo;{searchQuery}&rdquo;
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="text-xs font-semibold text-rose-900 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition"
            >
              Riprova
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && processedStations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Scaricamento e analisi dati MIMIT per la Campania...</p>
          </div>
        )}

        {/* No Results Fallback */}
        {!isLoading && processedStations.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FilterX className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Nessun distributore trovato con questi filtri
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              {searchQuery ? (
                <>
                  Nessun distributore per &ldquo;<strong>{searchQuery}</strong>&rdquo; rispetta tutti i filtri attivi (&lt; 2.00 € e Self-service).
                </>
              ) : (
                <>Prova a rimuovere il vincolo &ldquo;Solo &lt; 2.00 €&rdquo; o &ldquo;Solo Self-Service&rdquo;.</>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => {
                    setOnlyUnder2(false);
                    setOnlySelf(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold text-xs transition hover:bg-amber-700"
                >
                  <span>Mostra tutti per &ldquo;{searchQuery}&rdquo;</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedProvince('all');
                  setSelectedFuel('all');
                  setSelectedBrand('all');
                  setSearchQuery('');
                  setOnlyUnder2(false);
                  setOnlySelf(false);
                  setSortByDistance(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs transition hover:bg-emerald-700"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Azzera tutti i filtri</span>
              </button>
            </div>
          </div>
        )}

        {/* Display Content according to viewMode */}
        {processedStations.length > 0 && (
          <>
            {viewMode === 'grid' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {processedStations.slice(0, visibleCount).map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      selectedFuel={selectedFuel}
                    />
                  ))}
                </div>

                {visibleCount < processedStations.length && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 36)}
                      className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 font-bold text-xs sm:text-sm text-slate-700 shadow-xs hover:shadow transition"
                    >
                      Mostra altri 36 impianti (rimanenti {processedStations.length - visibleCount})
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <StationTable stations={processedStations} selectedFuel={selectedFuel} />
            )}

            {viewMode === 'map' && (
              <StationMap
                stations={processedStations}
                selectedProvince={selectedProvince}
                userLocation={userLocation}
              />
            )}
          </>
        )}
      </main>

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
