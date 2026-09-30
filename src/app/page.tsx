'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GasStation, FuelStats, FuelApiResponse } from '@/types/fuel';
import { Header } from '@/components/Header';
import { NewsBanner } from '@/components/NewsBanner';
import { StatsBanner } from '@/components/StatsBanner';
import { Filters, ViewMode } from '@/components/Filters';
import { StationCard } from '@/components/StationCard';
import { StationTable } from '@/components/StationTable';
import { StationMap } from '@/components/StationMap';
import { Footer } from '@/components/Footer';
import { AlertCircle, Loader2, Sparkles, FilterX } from 'lucide-react';

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
  const [onlySelf, setOnlySelf] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 1. Header */}
      <Header
        lastUpdated={stats?.lastDataExtraction}
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
        totalUnder2={stats?.stationsUnder2Euro || 0}
      />

      {/* 2. News Banner referring to Il Sole 24 Ore */}
      <NewsBanner />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* 3. KPI Statistics Banner */}
        <StatsBanner stats={stats} selectedProvince={selectedProvince} />

        {/* 4. Filters & Controls */}
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
          totalResults={stations.length}
        />

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
        {isLoading && stations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Scaricamento e analisi dati MIMIT per la Campania...</p>
          </div>
        )}

        {/* No Results Fallback */}
        {!isLoading && stations.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FilterX className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Nessun distributore trovato con questi filtri
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              Prova a rimuovere il vincolo &ldquo;Solo &lt; 2.00 €&rdquo; o a selezionare &ldquo;Tutta la Campania&rdquo;.
            </p>
            <button
              onClick={() => {
                setSelectedProvince('all');
                setSelectedFuel('all');
                setSelectedBrand('all');
                setSearchQuery('');
                setOnlyUnder2(false);
                setOnlySelf(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs transition hover:bg-emerald-700"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Azzera tutti i filtri</span>
            </button>
          </div>
        )}

        {/* Display Content according to viewMode */}
        {stations.length > 0 && (
          <>
            {viewMode === 'grid' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stations.slice(0, visibleCount).map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      selectedFuel={selectedFuel}
                    />
                  ))}
                </div>

                {visibleCount < stations.length && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 36)}
                      className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 font-bold text-xs sm:text-sm text-slate-700 shadow-xs hover:shadow transition"
                    >
                      Mostra altri 36 impianti (rimanenti {stations.length - visibleCount})
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <StationTable stations={stations} selectedFuel={selectedFuel} />
            )}

            {viewMode === 'map' && (
              <StationMap stations={stations} selectedProvince={selectedProvince} />
            )}
          </>
        )}
      </main>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
}
