'use client';

import React, { useState } from 'react';
import { Newspaper, ChevronDown, ChevronUp, ExternalLink, Info, CheckCircle2, TrendingDown } from 'lucide-react';

export const NewsBanner: React.FC = () => {
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
                Notizia Sole 24 Ore
              </span>
              <span className="font-semibold text-slate-900">Price Cap Carburanti:</span>{' '}
              <span className="text-slate-700">
                Dopo Eni e IP, anche Q8 blocca i prezzi. Sconti e tetto sotto 2,00 €/litro alla pompa.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 transition px-2 py-1 rounded bg-amber-100/70 hover:bg-amber-200/70"
            >
              <span>{isExpanded ? 'Chiudi dettagli' : 'Approfondisci notizia'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <a
              href="https://www.ilsole24ore.com/art/caro-carburante-eni-anche-ip-fa-scattare-sconti-ecco-quanto-si-puo-risparmiare-AJBhWzQB"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition underline underline-offset-2 ml-1"
            >
              <span>Articolo originale</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Collapsible Article Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/50 text-xs sm:text-sm text-slate-700 space-y-2.5 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Eni & IP: Tetto & Risparmi</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Eni ha introdotto un tetto calmierato a <strong>1,990 €/litro per la benzina</strong> e 2,190 € per il gasolio (self), a cui si è aggiunta IP (gruppo Socar/Api). Risparmio stimato di <strong>8,45€ a pieno</strong> di benzina e <strong>9,35€</strong> sul gasolio.
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Q8: Terzo Grande Operatore</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Anche Q8 Italia ha aderito all&apos;appello con un <strong>price cap della durata di 30 giorni</strong> con approccio modulare per supportare famiglie e gestori della rete distributiva.
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-lg border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                  <TrendingDown className="w-4 h-4 text-teal-600" />
                  <span>Perché la Campania?</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  La rete campana vanta oltre 1.850 distributori. Con questa dashboard filtriamo all&apos;istante solo i distributori delle 5 province campane (NA, SA, CE, AV, BN) con prezzi <strong>sotto la soglia psicologica dei 2 euro</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
