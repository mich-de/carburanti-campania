'use client';

import React from 'react';
import { GasStation, FuelPrice } from '../types/fuel';
import { MapPin, Navigation, Clock, ShieldCheck, Tag } from 'lucide-react';

interface StationCardProps {
  station: GasStation;
  selectedFuel: string;
}

export const StationCard: React.FC<StationCardProps> = ({ station, selectedFuel }) => {
  const getBrandBadge = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes('eni') || b.includes('agip')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-900 border border-amber-500 shadow-xs">
          ENI / AGIP
        </span>
      );
    }
    if (b.includes('ip') || b.includes('api')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-600 text-white border border-sky-700 shadow-xs">
          IP
        </span>
      );
    }
    if (b.includes('q8')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white border border-rose-700 shadow-xs">
          Q8
        </span>
      );
    }
    if (b.includes('esso')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-700 text-white border border-red-800 shadow-xs">
          ESSO
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        {brand || 'Pompe Bianche'}
      </span>
    );
  };

  const getProvinceColor = (prov: string) => {
    switch (prov) {
      case 'NA':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'SA':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'AV':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'BN':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Google Maps navigation link
  const navUrl =
    station.latitude && station.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${station.name} ${station.address} ${station.city} ${station.province}`
        )}`;

  // Find most recent price update date
  const lastUpdate = station.prices.length > 0 ? station.prices[0].updatedAt : '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {getBrandBadge(station.brand)}
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border ${getProvinceColor(
                station.province
              )}`}
            >
              {station.province}
            </span>
          </div>

          {station.hasUnder2Euro && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>PRICE CAP &lt; 2€</span>
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
          {station.name}
        </h3>

        <div className="flex items-center justify-between gap-1 text-xs text-slate-500 mt-1">
          <div className="flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${station.brand} ${station.name}, ${station.address}, ${station.city}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-emerald-700 hover:underline"
              title="Vedi posizione esatta su Google Maps"
            >
              {station.address ? `${station.address}, ` : ''}
              <strong>{station.city}</strong> ({station.province})
            </a>
          </div>

          {typeof station.distanceKm === 'number' && (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              📍 {station.distanceKm < 1 ? `${Math.round(station.distanceKm * 1000)}m` : `${station.distanceKm.toFixed(1)} km`}
            </span>
          )}
        </div>
      </div>

      {/* Fuel Price Grid */}
      <div className="p-4 bg-slate-50/50 flex-1">
        <div className="grid grid-cols-2 gap-2">
          {station.prices.map((p, idx) => {
            // Strictly adhere to rule in testo.txt: price <= 0.0 is treated as N/D, never a bargain
            const isInvalidPrice = !p.price || p.price <= 0.0;
            const isHighlighted = selectedFuel !== 'all' && p.fuelType === selectedFuel;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-left transition ${
                  isHighlighted
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/60 border-emerald-300'
                    : p.isUnder2Euro
                    ? 'bg-white border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate" title={p.rawFuelName}>
                    {p.rawFuelName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      p.isSelf
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.isSelf ? 'SELF' : 'SERV'}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`text-lg font-black tracking-tight ${
                      isInvalidPrice
                        ? 'text-slate-400 text-sm'
                        : p.isUnder2Euro
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {isInvalidPrice ? 'N/D' : `${p.price.toFixed(3)} €`}
                  </span>

                  {p.isUnder2Euro && !isInvalidPrice && (
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />
                      &lt;2€
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Footer: Metadata and GPS link */}
      <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-col text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{lastUpdate ? `MIMIT: ${lastUpdate}` : 'Aggiornato'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            MIMIT ID: {station.mimitId}
          </span>
        </div>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition active:scale-95 shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Naviga</span>
        </a>
      </div>
    </div>
  );
};
