'use client';

import React, { useState } from 'react';
import { Newspaper, ChevronDown, ChevronUp, ExternalLink, ShieldCheck, CheckCircle2, TrendingDown, Compass } from 'lucide-react';

interface NewsBannerProps {
  onLocateMe?: () => void;
  onClearLocation?: () => void;
  isLocating?: boolean;
  locationActive?: boolean;
}

export const NewsBanner: React.FC<NewsBannerProps> = ({
  onLocateMe,
  onClearLocation,
  isLocating = false,
  locationActive = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-b border-amber-200/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Summary preview */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 shrink-0">
              <Newspaper className="w-4 h-4" />
            </span>
            <div className="text-xs sm:text-sm text-slate-800">
              <span className="font-bold text-amber-900 mr-1.5 uppercase tracking-wide text-[11px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                Notizia &amp; Approfondimento
              </span>
              <span className="font-semibold text-slate-900">È il giorno della benzina sotto 2 euro:</span>{' '}
              <span className="text-slate-700">
                Tetto Eni a <strong>1,99€</strong> (Self &amp; Servito), sconti IP e Q8. Dati ufficiali MIMIT.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 min-h-9 text-xs font-semibold text-amber-900 hover:text-amber-700 transition px-3 py-1.5 rounded bg-amber-100/70 hover:bg-amber-200/70"
            >
              <span>{isExpanded ? 'Chiudi dettagli' : 'Dettagli & Fonti'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <a
              href="https://carburanti.mise.gov.it/ospzSearch/zona"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 min-h-9 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition px-2.5 py-1.5 rounded bg-emerald-100/80 border border-emerald-300"
              title="Portale ufficiale Osservaprezzi MIMIT per zona"
            >
              <Compass className="w-3 h-3" />
              <span>Portale MIMIT</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Suggerimento GPS: dai la posizione e ti mostriamo le stazioni più vicine */}
        {onLocateMe && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-800">
            <span className="font-semibold text-sky-900">
              📍{' '}
              {locationActive
                ? 'Stazioni ordinate per distanza da te.'
                : 'Dai la posizione e ti troviamo le stazioni più vicine a te.'}
            </span>
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              className="inline-flex items-center min-h-9 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              {isLocating ? 'Rilevamento…' : locationActive ? 'Aggiorna posizione' : 'Attiva GPS'}
            </button>
            {locationActive && onClearLocation && (
              <button
                type="button"
                onClick={onClearLocation}
                className="inline-flex items-center min-h-9 px-3 py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-sky-900 text-xs font-bold shadow-sm transition active:scale-95"
              >
                Disattiva GPS
              </button>
            )}
          </div>
        )}

        {/* Collapsible Article & Sources Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/50 text-xs sm:text-sm text-slate-700 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: inSella report */}
              <div className="bg-white/90 p-3 rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Report inSella: Tetto a 1,99€</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Come documentato da <em>inSella</em>, l&apos;iniziativa calmierata fissa un tetto massimo di <strong>1,990 €/litro sulla benzina</strong> e <strong>2,190 €/litro sul gasolio</strong> su tutta la rete (inclusa autostrada), sia per la modalità Self sia Servito per 30 giorni.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <a
                    href="https://www.insella.it/news/il-giorno-della-benzina-sotto-2-euro-dove-sono-distributori-prezzo-scontato-78577"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    <span>Leggi articolo su inSella.it</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Card 2: Il Sole 24 Ore */}
              <div className="bg-white/90 p-3 rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Sole 24 Ore: Eni, IP e Q8</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dopo Eni ed IP (gruppo Socar/Api), anche Q8 aderisce al price cap. Risparmio stimato fino a <strong>8,45€</strong> a pieno per la benzina e <strong>9,35€</strong> per il gasolio per famiglie e imprese.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <a
                    href="https://www.ilsole24ore.com/art/caro-carburante-eni-anche-ip-fa-scattare-sconti-ecco-quanto-si-puo-risparmiare-AJBhWzQB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
                  >
                    <span>Leggi articolo su Il Sole 24 Ore</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Card 3: Doppia Fonte Integrata */}
              <div className="bg-white/90 p-3 rounded-lg border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                    <Compass className="w-4 h-4 text-teal-600" />
                    <span>Doppia Fonte Ufficiale Integrata</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Fonte Primaria:</strong> API Osservaprezzi (<code>carburanti.mise.gov.it/ospzApi</code>).<br />
                    <strong>Fonte Secondaria:</strong> Open Data MIMIT CSV (<code>mimit.gov.it/images/exportCSV</code>) in fallback automatico con caching 15 min.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                  <a
                    href="https://carburanti.mise.gov.it/ospzSearch/zona"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:text-teal-950 underline"
                  >
                    <span>1. API Portale Osservaprezzi MIMIT</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    <span>2. Open Data MIMIT CSV (Export)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
