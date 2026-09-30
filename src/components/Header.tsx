'use client';

import React from 'react';
import { Fuel, RefreshCw, Sparkles, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  lastUpdated?: string;
  onRefresh: () => void;
  isLoading: boolean;
  totalUnder2: number;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  onRefresh,
  isLoading,
  totalUnder2,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-md shadow-emerald-700/20">
              <Fuel className="w-6 h-6" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  Campania Carburanti
                  <span className="text-emerald-700 bg-emerald-50 text-xs sm:text-sm px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    &lt; 2.00 €
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Monitoraggio Price Cap Eni, IP & Q8 nelle 5 province campane
              </p>
            </div>
          </div>

          {/* Action Bar & Live Badges */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1 sm:pt-0">
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-500">Dati Ufficiali MIMIT</span>
                <span className="text-xs font-semibold text-slate-700">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 disabled:opacity-50"
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
