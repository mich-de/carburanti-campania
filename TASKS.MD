# TASKS: Monitoraggio Prezzi Carburanti Campania (< 2.00 €)

## Roadmap & Attività Correnti

### [DEVOPS] Setup Ambiente e Configurazione
- [x] Inizializzazione Git con identity (`mich-de`, `mic.deangelis@gmail.com`)
- [x] Creazione `package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`
- [x] Installazione dipendenze Next.js, React, Tailwind, Lucide, Leaflet
- [x] Configurazione Vercel (`vercel.json`, Next config)
- [x] Verifica build di produzione (`npm run build`) superata con successo

### [BACKEND] Data Ingestion & API Serverless
- [x] Sviluppo parser streaming CSV MIMIT per anagrafica e prezzi
- [x] Filtro geolocalizzato esclusivo per le 5 province campane (NA, SA, CE, AV, BN)
- [x] Regola di sanitizzazione: scarto o flag `N/D` per prezzi <= 0.0 e sentinelle test (conformità a `testo.txt`)
- [x] Cache serverless e HTTP header con TTL 15 minuti (`s-maxage=900`)
- [x] Endpoint `/api/fuel` con supporto a query params (`provincia`, `carburante`, `onlyUnder2`, `brand`, `onlySelf`, `search`)
- [x] Calcolo statistiche di riepilogo regionali e provinciali

### [FRONTEND] Dashboard & Interfaccia Utente
- [x] Header moderno con badge live status, notizia Price Cap e ultimo aggiornamento MIMIT
- [x] Summary KPI Cards (Distributori < 2€, Prezzo Min Benzina/Diesel, Medie e minimi regionali)
- [x] Barra di ricerca rapida (comune, indirizzo, gestore) e filtri avanzati
- [x] Vista Card Impianto (dettaglio prezzi, bandiera, indicatore distanza, navigatore Google Maps)
- [x] Vista Tabellare comparativa / classifica
- [x] Mappa interattiva Leaflet con pin personalizzati per brand e badge prezzo sotto 2€
- [x] Banner informativo con approfondimento sull'articolo de *Il Sole 24 Ore* (Price Cap Eni, IP, Q8)
- [x] Responsive layout completo per smartphone e desktop
