'use client';

import React from 'react';
import { Fuel, RefreshCw, Sparkles, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  lastUpdated?: string;
  sourceBadge?: string;
  activeSource?: string;
  onRefresh: () => void;
  isLoading: boolean;
  totalUnder2: number;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  sourceBadge,
  activeSource,
  onRefresh,
  isLoading,
  totalUnder2,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-md shadow-emerald-700/20">
              <Fuel className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  Campania Carburanti
                  <span className="text-emerald-700 bg-emerald-50 text-xs sm:text-sm px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    &lt; 2.00 €
                  </span>
                </h1>
              </div>
              {/* Sottotitolo nascosto su smartphone per lasciare spazio ai contenuti */}
              <p className="hidden sm:flex text-sm text-slate-500 items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Monitoraggio Price Cap Eni, IP &amp; Q8 nelle 5 province campane
              </p>
            </div>
          </div>

          {/* Action Bar & Live Badges */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1 sm:pt-0">
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {activeSource === 'PRIMARY_OSSERVAPREZZI_API'
                    ? 'API Osservaprezzi'
                    : 'Open Data MIMIT (Fallback)'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {lastUpdated ? `Agg. ${lastUpdated}` : 'Live'}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{totalUnder2} Impianti &lt; 2€</span>
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Aggiorna i prezzi dal MIMIT"
              aria-label="Aggiorna i prezzi dal MIMIT"
              className="inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">Aggiorna</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
