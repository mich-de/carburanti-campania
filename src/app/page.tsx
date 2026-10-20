'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GasStation, FuelStats, FuelApiResponse } from '@/types/fuel';
import { UserLocation, isInCampania } from '@/lib/geo';
import { Header } from '@/components/Header';
import { NewsBanner } from '@/components/NewsBanner';
import { StatsBanner } from '@/components/StatsBanner';
import { Legenda } from '@/components/Legenda';
import { Filters, ViewMode, TerritoryMode } from '@/components/Filters';
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
      <div className="w-full h-[72svh] min-h-[420px] md:h-[460px] lg:h-[540px] rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
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
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryMode>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedFuel, setSelectedFuel] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  // User explicitly requested: "di default tieni attivo Solo Self Service e Accordo Price Cap"
  const [onlyPriceCap, setOnlyPriceCap] = useState<boolean>(true); // default true: Accordo Price Cap Grandi Reti
  const [onlySelf, setOnlySelf] = useState<boolean>(true); // default true: Solo Self-service
  const [onlyUnder2, setOnlyUnder2] = useState<boolean>(false); // default false: Tutti i marchi < 2.00 € (incluse no-logo)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Il tetto Accordo Price Cap riguarda solo la benzina: con gasolio, GPL o metano il filtro non si applica
  const priceCapApplies = selectedFuel === 'all' || selectedFuel === 'Benzina';
  const effectiveOnlyPriceCap = onlyPriceCap && priceCapApplies;
  // Il GPL in Italia non è self-service: con il GPL il filtro Solo Self-Service non si applica
  const selfApplies = selectedFuel !== 'GPL';
  const effectiveOnlySelf = onlySelf && selfApplies;

  // Search Feedback when price cap or self excludes searched town
  const [searchFeedback, setSearchFeedback] = useState<{
    matchingWithoutPriceCapCount: number;
    minPriceFound?: number;
  } | null>(null);

  // Dual Source API Metadata
  const [apiMeta, setApiMeta] = useState<FuelApiResponse['meta'] | null>(null);

  // GPS Geolocation States (Recommended by inSella article)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
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
        territorio: selectedTerritory,
        carburante: selectedFuel,
        brand: selectedBrand,
        onlyUnder2: onlyUnder2 ? 'true' : 'false',
        onlyPriceCap: effectiveOnlyPriceCap ? 'true' : 'false',
        onlySelf: effectiveOnlySelf ? 'true' : 'false',
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
        setApiMeta(json.meta || null);
      } else {
        throw new Error('Dati non validi restituiti dal server.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Impossibile caricare i prezzi aggiornati. Riprova tra poco.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProvince, selectedTerritory, selectedFuel, selectedBrand, onlyUnder2, effectiveOnlyPriceCap, effectiveOnlySelf, searchQuery]);

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
  }, [selectedTerritory, selectedProvince, selectedFuel, selectedBrand, onlyUnder2, onlySelf, searchQuery]);

  // Ogni richiesta GPS ha un numero: se nel frattempo il GPS è stato disattivato, la risposta in ritardo si ignora
  const locateRequestRef = useRef(0);

  // Handle GPS location request
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser.');
      return;
    }

    const requestId = ++locateRequestRef.current;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (requestId !== locateRequestRef.current) return;
        const coords: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setSortByDistance(true);
        setIsLocating(false);
      },
      (err) => {
        if (requestId !== locateRequestRef.current) return;
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        alert('Impossibile rilevare la posizione GPS. Verifica i permessi del browser.');
      },
      // maximumAge: 0 evita di riusare una posizione vecchia, magari di un altro luogo
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Posizione scelta a mano toccando la mappa: serve quando il GPS del dispositivo sbaglia
  const handlePickLocation = (lat: number, lng: number) => {
    locateRequestRef.current++;
    setIsLocating(false);
    setUserLocation({ lat, lng, manual: true });
    setSortByDistance(true);
  };

  // Disattiva la posizione (GPS o scelta a mano): spariscono distanze e ordinamento per vicinanza
  const handleClearLocation = () => {
    locateRequestRef.current++;
    setIsLocating(false);
    setUserLocation(null);
    setSortByDistance(false);
  };

  // Posizione sospetta: fuori dalla Campania oppure con precisione bassa (quella scelta a mano non si controlla)
  const locationIssue: 'outside' | 'imprecise' | null =
    !userLocation || userLocation.manual
      ? null
      : !isInCampania(userLocation.lat, userLocation.lng)
      ? 'outside'
      : userLocation.accuracy && userLocation.accuracy > 2000
      ? 'imprecise'
      : null;

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
      {/* 1. Header with live status and dual-source indicator */}
      <Header
        lastUpdated={stats?.lastDataExtraction}
        sourceBadge={apiMeta?.source}
        activeSource={apiMeta?.activeSource}
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        totalUnder2={stats?.stationsUnder2Euro || 0}
      />

      {/* 2. News Banner referring to Il Sole 24 Ore, inSella and MIMIT */}
      <NewsBanner
        onLocateMe={handleLocateMe}
        onClearLocation={handleClearLocation}
        isLocating={isLocating}
        locationActive={userLocation !== null}
      />

      {/* 2b. Dual Source Architecture Status Bar: dettagli da tablet in su; su smartphone resta la fonte attiva */}
      <div className="bg-slate-100/90 border-b border-slate-200/80 py-2 px-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizzazione Dati:
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
              <strong className="text-slate-800">1. Primaria:</strong> API Osservaprezzi (<code>carburanti.mise.gov.it/ospzApi</code>)
            </span>
            <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
              <strong className="text-slate-800">2. Secondaria:</strong> Open Data MIMIT CSV (<code>mimit.gov.it/images/exportCSV</code>)
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-1.5 md:self-auto">
            <span className="text-slate-500">Fonte attiva:</span>
            <span className="font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-lg md:rounded-full border border-emerald-300 shadow-sm break-words">
              {apiMeta?.source || 'Open Data MIMIT CSV (Fallback)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full flex flex-col">
        {/* 3. KPI Statistics Banner */}
        <StatsBanner
          stats={stats}
          selectedProvince={selectedProvince}
          selectedTerritory={selectedTerritory}
        />

        {/* 4. Legenda & Symbol Guide */}
        <Legenda />

        {/* 5. Filters & Controls */}
        <Filters
          selectedTerritory={selectedTerritory}
          onTerritoryChange={setSelectedTerritory}
          territoryCounts={{
            penisola: stats?.byProvince['PENISOLA_SORRENTINA']?.total,
            amalfitana: stats?.byProvince['COSTIERA_AMALFITANA']?.total,
          }}
          selectedProvince={selectedProvince}
          onProvinceChange={setSelectedProvince}
          selectedFuel={selectedFuel}
          onFuelChange={setSelectedFuel}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
          onlyUnder2={onlyUnder2}
          onToggleUnder2={setOnlyUnder2}
          onlyPriceCap={effectiveOnlyPriceCap}
          priceCapAvailable={priceCapApplies}
          onTogglePriceCap={setOnlyPriceCap}
          onlySelf={effectiveOnlySelf}
          selfAvailable={selfApplies}
          className="order-first sm:order-none"
          onToggleSelf={setOnlySelf}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={processedStations.length}
          userLocation={userLocation}
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          locationIssue={locationIssue}
          onClearLocation={handleClearLocation}
          sortByDistance={sortByDistance}
          onToggleSortByDistance={setSortByDistance}
        />

        {/* Smart Search Notice (e.g. Meta has stations > 2€ or only Servito) */}
        {searchFeedback && searchFeedback.matchingWithoutPriceCapCount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
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
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition active:scale-95 shadow-sm"
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-12 text-center max-w-lg mx-auto my-6 sm:my-8">
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
                  setSelectedTerritory('all');
                  setSelectedProvince('all');
                  setSelectedFuel('all');
                  setSelectedBrand('all');
                  setSearchQuery('');
                  setOnlyUnder2(true);
                  setOnlyPriceCap(false);
                  setOnlySelf(true);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                      className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 font-bold text-xs sm:text-sm text-slate-700 shadow-sm hover:shadow transition"
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
                selectedProvince={
                  selectedTerritory === 'penisola'
                    ? 'PENISOLA_SORRENTINA'
                    : selectedTerritory === 'amalfitana'
                    ? 'COSTIERA_AMALFITANA'
                    : selectedProvince
                }
                userLocation={userLocation}
                searchQuery={searchQuery}
                isLocating={isLocating}
                onLocateMe={handleLocateMe}
                onClearLocation={handleClearLocation}
                onPickLocation={handlePickLocation}
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
