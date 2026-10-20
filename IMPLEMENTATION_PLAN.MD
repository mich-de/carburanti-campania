# IMPLEMENTATION PLAN: Web App Monitoraggio Prezzi Carburanti Campania (< 2.00 €)

## 1. Visione del Progetto & Architettura
Realizzazione di un'applicazione web moderna ad alte prestazioni per monitorare in tempo reale i prezzi dei carburanti sotto i 2 euro in **Campania** (Province: Napoli, Salerno, Caserta, Avellino, Benevento).
L'applicazione risponde direttamente all'iniziativa di price cap / sconti promossa dai principali operatori (Eni, IP, Q8) come riportato da *Il Sole 24 Ore*, integrando le specifiche e i vincoli definiti in `testo.txt`.

### Stack Tecnologico
- **Framework:** Next.js (App Router, Serverless API Routes)
- **Linguaggio:** TypeScript
- **Styling & UI:** Tailwind CSS, Lucide Icons, Mobile-first responsive layout
- **Mappe & Geolocalizzazione:** Leaflet + OpenStreetMap (no tracking esterno, conforme a `testo.txt`)
- **Data Source Ufficiale:** MIMIT (Ministero delle Imprese e del Made in Italy) Open Data CSV
- **Deployment Target:** Vercel (`vercel.app`)

---

## 2. Multi-Agent Responsibilities
- **[BACKEND-AGENT]**:
  - Implementazione endpoint API `/api/fuel` con caching HTTP (TTL 15 minuti, `stale-while-revalidate`).
  - Parsing ottimizzato in streaming dei CSV MIMIT (`anagrafica_impianti_attivi.csv` e `prezzo_alle_8.csv`).
  - Filtraggio rigoroso per le 5 province campane (`NA`, `SA`, `CE`, `AV`, `BN`).
  - Sanitizzazione prezzi: `prezzo <= 0.0` trattato come "N/D" (mai considerato tra i più economici, conformità a `testo.txt`).
  - Calcolo metriche aggregate: prezzo medio per carburante, conteggio distributori < 2.00 €, distributore più economico per provincia.
- **[FRONTEND-AGENT]**:
  - Dashboard interattiva con statistiche aggregate (KPIs), grafici e indicatori live.
  - Filtri dinamici: per Provincia, Carburante (Benzina, Gasolio, GPL, Metano), Marchio (Eni, IP, Q8, Pompe Bianche), Prezzo (< 2.00 € toggle), Modalità (Self / Servito).
  - Viste multiple: Schede informative dettagliate, Tabella comparativa, Mappa geografica interattiva (Leaflet OSM).
  - Badge visivi "Price Cap Attivo (< 2€)", indicatore "Self" / "Servito", data e ora ultimo aggiornamento MIMIT.
  - Ricerca istantanea per comune o indirizzo.
- **[DEVOPS-AGENT]**:
  - Configurazione Vercel (`vercel.json`, headers di caching, build settings).
  - Setup TypeScript, Tailwind CSS, Git repository (`mich-de`, `mic.deangelis@gmail.com`).
  - Validazione build e testing end-to-end.

---

## 3. Fasi di Implementazione
1. **Fase 1: Setup Progetto & Documentazione**
   - Configurazione Next.js, Tailwind, TypeScript e documentazione dinamica (`IMPLEMENTATION_PLAN.MD`, `TASKS.MD`, `GEMINI.MD`, `README.MD`).
2. **Fase 2: Backend API & MIMIT Fetcher**
   - Creazione del serverless route handler `/api/fuel` che scarica e fonde i dati MIMIT filtrati per la Campania con cache TTL 15 min.
3. **Fase 3: Frontend UI & Componenti**
   - Implementazione Header, Stats Banner, Filtri, Card Distributore, Mappa Leaflet.
4. **Fase 4: Integrazione Notizia Sole 24 Ore & Ottimizzazioni UX**
   - Sezione informativa sul price cap (Eni, IP, Q8), navigazione GPS verso il distributore.
5. **Fase 5: Build, Test e Istruzioni per Vercel**
   - Verifica `npm run build` locale e predisposizione deploy su Vercel.
