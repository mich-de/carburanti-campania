import React from 'react';
import { ShieldCheck, Heart, ExternalLink, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200 text-xs text-slate-500 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="font-semibold text-slate-700">
              Campania Carburanti Price Cap Monitor
            </span>
            <span>—</span>
            <span>Edizione Speciale Prezzi &lt; 2.00 €</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <a
              href="https://www.mimit.gov.it/it/open-data/dati-carburanti"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-700 transition flex items-center gap-1"
            >
              <span>MIMIT Open Data</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-700 transition flex items-center gap-1"
            >
              <span>OpenStreetMap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://www.ilsole24ore.com/art/caro-carburante-eni-anche-ip-fa-scattare-sconti-ecco-quanto-si-puo-risparmiare-AJBhWzQB"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-700 transition flex items-center gap-1"
            >
              <span>Il Sole 24 ORE</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Copertura regionale: <strong>Napoli (NA)</strong>, <strong>Salerno (SA)</strong>, <strong>Caserta (CE)</strong>, <strong>Avellino (AV)</strong>, <strong>Benevento (BN)</strong>.
            </span>
          </div>

          <p>
            Dati estratti e aggiornati secondo le comunicazioni ufficiali ex D.M. 12/03/2009. Caching edge 15 minuti.
          </p>
        </div>
      </div>
    </footer>
  );
};
