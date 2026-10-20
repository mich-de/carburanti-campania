'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Tag, ShieldCheck, Fuel, Navigation, Clock } from 'lucide-react';

export const Legenda: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm mb-4 sm:mb-6 overflow-hidden transition-all">
      {/* Clickable Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left transition select-none"
      >
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
            <HelpCircle className="w-4 h-4" />
          </span>
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              Legenda<span className="hidden sm:inline"> &amp; Guida ai Simboli</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-500 ml-2">
              (Significato di SELF/SERV, Price Cap, Colori Brand e Carburanti Speciali)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
          <span>{isOpen ? 'Nascondi' : 'Mostra legenda'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
          {/* Column 1: Modalità & Price Cap */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              Modalità &amp; Tetto Calmierato
            </h4>

            <div className="space-y-2 text-slate-600">
              <div className="flex items-start gap-2">
                <span className="font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] shrink-0">
                  SELF
                </span>
                <p>
                  <strong>Self-Service:</strong> Rifornimento autonomo alla pompa. È la modalità principale su cui si applica il <strong>Price Cap Eni (1,990€ benzina e 2,190€ gasolio)</strong> e gli sconti IP/Q8.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] shrink-0">
                  SERV
                </span>
                <p>
                  <strong>Servito:</strong> Rifornimento con assistenza dell&apos;operatore. Solitamente prevede una maggiorazione tariffaria.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  PRICE CAP &lt; 2€
                </span>
                <p>
                  <strong>Accordo Grandi Reti:</strong> Distributore aderente al protocollo Price Cap (Eni, IP, Q8, Esso) con sconti su Benzina (tetto 1,990€) o Gasolio.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-300 shrink-0">
                  <Tag className="w-3 h-3 text-teal-600" />
                  PREZZO &lt; 2€
                </span>
                <p>
                  <strong>Prezzo Effettivo &lt; 2€:</strong> Distributore indipendente (Pompe Bianche) che comunica un prezzo sotto 2,00 €/litro.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Carburanti Standard vs Speciali */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              Carburanti &amp; Prodotti Speciali
            </h4>

            <div className="space-y-2 text-slate-600">
              <div>
                <strong className="text-slate-800">Benzina &amp; Gasolio Standard:</strong>
                <p>I carburanti tradizionali previsti dal listino base nazionale.</p>
              </div>

              <div>
                <strong className="text-slate-800">Blue Super / Supreme / HiQ / V-Power:</strong>
                <p>
                  Benzine speciali premium (es. 100 ottani Eni con additivi). Alcune stazioni le offrono in promozione a prezzi inferiori al tetto di 2€.
                </p>
              </div>

              <div>
                <strong className="text-slate-800">GPL &amp; Metano:</strong>
                <p>Carburanti gassosi a basso impatto ambientale e tariffe già ampiamente inferiori a 1.00 € (GPL) e 1.80 € (Metano).</p>
              </div>
            </div>
          </div>

          {/* Column 3: Colori Marchi & Dati Ufficiali */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              Marchi, GPS &amp; Trasparenza
            </h4>

            <div className="space-y-2 text-slate-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-900">Eni</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-600 text-white">IP</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">Q8</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border">Pompe Bianche</span>
              </div>

              <div className="flex items-start gap-1.5 pt-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Navigatore GPS:</strong> Cliccando su &ldquo;Naviga&rdquo; si apre direttamente l&apos;itinerario stradale in Google Maps o Apple Mappe.
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>MIMIT ID:</strong> Codice identificativo unico assegnato dal Ministero dello Sviluppo Economico / MIMIT ex D.M. 12/03/2009.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
