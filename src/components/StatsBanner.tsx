'use client';

import React from 'react';
import { FuelStats } from '../types/fuel';
import { Flame, ShieldCheck, Zap, Gauge, MapPin } from 'lucide-react';

interface StatsBannerProps {
  stats: FuelStats | null;
  selectedProvince: string;
  selectedTerritory?: 'all' | 'penisola';
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats, selectedProvince, selectedTerritory }) => {
  if (!stats) return null;

  const isPen = selectedTerritory === 'penisola';
  const currentProvStats = isPen
    ? stats.byProvince['PENISOLA_SORRENTINA']
    : selectedProvince !== 'all' && stats.byProvince[selectedProvince]
    ? stats.byProvince[selectedProvince]
    : null;

  const total = currentProvStats ? currentProvStats.total : stats.totalStationsCampania;
  const under2 = currentProvStats ? currentProvStats.under2Euro : stats.stationsUnder2Euro;
  const under2Percent = total > 0 ? Math.round((under2 / total) * 100) : 0;

  const getDisplayName = () => {
    if (isPen) return 'Penisola Sorrentina';
    if (selectedProvince === 'all') return 'Campania';
    return `Provincia ${selectedProvince}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-3 sm:my-4">
      {/* Metric 1: Impianti Sotto i 2 Euro */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {getDisplayName()} &lt; 2.00 €
          </span>
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{under2}</span>
            <span className="text-xs text-slate-500 font-medium">/ {total} impianti</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            <span className="text-emerald-700 font-bold">{under2Percent}%</span> della rete regionale con sconti attivi
          </p>
        </div>
      </div>

      {/* Metric 2: Minimo Benzina */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Benzina Minima Self
          </span>
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Flame className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.minPriceBenzinaSelf ? `${stats.minPriceBenzinaSelf.toFixed(3)}` : 'N/D'}
            </span>
            <span className="text-xs text-slate-500 font-medium">€/L</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Media Campania:{' '}
            <strong className="text-slate-700">
              {stats.avgPriceBenzinaSelf > 0 ? `${stats.avgPriceBenzinaSelf.toFixed(3)} €` : 'N/D'}
            </strong>
          </p>
        </div>
      </div>

      {/* Metric 3: Minimo Gasolio/Diesel */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gasolio Minimo Self
          </span>
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <Zap className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.minPriceGasolioSelf ? `${stats.minPriceGasolioSelf.toFixed(3)}` : 'N/D'}
            </span>
            <span className="text-xs text-slate-500 font-medium">€/L</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Media Campania:{' '}
            <strong className="text-slate-700">
              {stats.avgPriceGasolioSelf > 0 ? `${stats.avgPriceGasolioSelf.toFixed(3)} €` : 'N/D'}
            </strong>
          </p>
        </div>
      </div>

      {/* Metric 4: GPL & Metano */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            GPL &amp; Metano Record
          </span>
          <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
            <Gauge className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center text-xs text-slate-700 font-medium">
            <span>GPL Min:</span>
            <span className="text-base font-bold text-sky-700">
              {stats.minPriceGpl ? `${stats.minPriceGpl.toFixed(3)} €` : 'N/D'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-700 font-medium mt-1">
            <span>Metano Min:</span>
            <span className="text-base font-bold text-teal-700">
              {stats.minPriceMetano ? `${stats.minPriceMetano.toFixed(3)} €` : 'N/D'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
