'use client';

import React from 'react';
import { GasStation } from '../types/fuel';
import { Navigation, Tag, ShieldCheck, MapPin } from 'lucide-react';

interface StationTableProps {
  stations: GasStation[];
  selectedFuel: string;
}

// Su smartphone la classifica mostra solo le colonne essenziali, con larghezze fisse (niente scorrimento laterale);
// le altre colonne compaiono da tablet e desktop
export const StationTable: React.FC<StationTableProps> = ({ stations, selectedFuel }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm table-fixed md:table-auto">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="hidden sm:table-cell sm:w-12 md:w-auto px-2.5 sm:px-4 py-3">#</th>
              <th className="px-2.5 sm:px-4 py-3">Marchio / Impianto</th>
              <th className="hidden md:table-cell px-2.5 sm:px-4 py-3">Comune &amp; Prov</th>
              <th className="w-[96px] sm:w-[120px] md:w-auto px-2.5 sm:px-4 py-3 text-right">Prezzo Migliore</th>
              <th className="hidden md:table-cell px-2.5 sm:px-4 py-3">Carburanti &amp; Modalità</th>
              <th className="hidden md:table-cell px-2.5 sm:px-4 py-3 text-center">Price Cap</th>
              <th className="w-[72px] md:w-auto px-2.5 sm:px-4 py-3 text-right">Mappa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {stations.map((st, idx) => {
              const navUrl =
                st.latitude && st.longitude
                  ? `https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${st.name} ${st.address} ${st.city} ${st.province}`
                    )}`;

              return (
                <tr key={st.id} className="hover:bg-slate-50/80 transition">
                  {/* Position */}
                  <td className="hidden sm:table-cell px-2.5 sm:px-4 py-3 font-bold text-slate-400">
                    {idx + 1}
                  </td>

                  {/* Brand & Name */}
                  <td className="px-2.5 sm:px-4 py-3">
                    <div className="font-bold text-slate-900 line-clamp-1">{st.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="font-semibold text-slate-700">{st.brand}</span>
                      <span>•</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${st.brand} ${st.name}, ${st.address}, ${st.city}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[160px] sm:max-w-[200px] hover:text-emerald-700 hover:underline"
                        title="Vedi posizione esatta su Google Maps"
                      >
                        {st.address}
                      </a>
                    </div>
                    {/* Sotto il tablet comune e distanza non hanno una colonna propria */}
                    <div className="md:hidden flex items-center gap-1 text-[11px] text-slate-600 font-semibold mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {st.city} ({st.province})
                      </span>
                      {typeof st.distanceKm === 'number' && (
                        <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-bold ml-1">
                          {st.distanceKm < 1 ? `${Math.round(st.distanceKm * 1000)}m` : `${st.distanceKm.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* City & Prov */}
                  <td className="hidden md:table-cell px-2.5 sm:px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{st.city}</span>
                      {typeof st.distanceKm === 'number' && (
                        <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-bold ml-1">
                          {st.distanceKm < 1 ? `${Math.round(st.distanceKm * 1000)}m` : `${st.distanceKm.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold">
                      Provincia di {st.province}
                    </div>
                  </td>

                  {/* Best Price */}
                  <td className="px-2.5 sm:px-4 py-3 text-right whitespace-nowrap">
                    <span
                      className={`text-base font-black ${
                        st.minPrice < 2.0
                          ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200'
                          : 'text-slate-900'
                      }`}
                    >
                      {st.minPrice > 0 ? `${st.minPrice.toFixed(3)} €` : 'N/D'}
                    </span>
                  </td>

                  {/* Fuel badges */}
                  <td className="hidden md:table-cell px-2.5 sm:px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {st.prices.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                            p.fuelType === selectedFuel
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {p.rawFuelName} ({p.isSelf ? 'Self' : 'Serv'}): <strong>{p.price.toFixed(3)}€</strong>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Price Cap Badge */}
                  <td className="hidden md:table-cell px-2.5 sm:px-4 py-3 text-center whitespace-nowrap">
                    {st.hasUnder2Euro && st.isPriceCapBrand ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>PRICE CAP (&lt;2€)</span>
                      </span>
                    ) : st.hasUnder2Euro ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        <Tag className="w-3 h-3 text-teal-600" />
                        <span>PREZZO &lt;2€</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">—</span>
                    )}
                  </td>

                  {/* Action Nav */}
                  <td className="px-2.5 sm:px-4 py-3 text-right whitespace-nowrap">
                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-medium text-xs transition"
                      title="Apri indicazioni stradali in Google Maps"
                      aria-label="Apri indicazioni stradali in Google Maps"
                    >
                      <Navigation className="w-3 h-3" />
                      <span className="hidden sm:inline">Naviga</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
