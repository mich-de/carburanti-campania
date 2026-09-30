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
- [x] Normalizzazione avanzata indirizzi MIMIT (rimozione CAP attaccati, espansione prefissi stradali come Corso Italia, Via delle Rose, Via dei Platani, Via Raffaele Bosco)
- [x] Tabella di override geolocalizzata e verificata per tutti i 22 distributori della Penisola Sorrentina (coordinate esatte e toponomastica corretta)
- [x] Cache serverless e HTTP header con TTL 15 minuti (`s-maxage=900`)
- [x] Endpoint `/api/fuel` con supporto a query params (`provincia`, `carburante`, `onlyUnder2`, `brand`, `onlySelf`, `search`)
- [x] Calcolo statistiche di riepilogo regionali e provinciali

### [FRONTEND] Dashboard & Interfaccia Utente
- [x] Header moderno con badge live status, notizia Price Cap e ultimo aggiornamento MIMIT
- [x] Summary KPI Cards (Distributori < 2€, Prezzo Min Benzina/Diesel, Medie e minimi regionali)
- [x] Filtro territoriale dedicato **Penisola Sorrentina** (Massa Lubrense, Sorrento, Sant'Agnello, Piano di Sorrento, Meta, Vico Equense)
- [x] Default "Solo Self-service" attivato all'avvio
- [x] Componente **Legenda** interattiva per simboli, listini multipli e colori brand
- [x] Ricerca intelligente (boundary match per "Meta", feedback esplicito con pulsante di reset filtri)
- [x] Vista Card Impianto (dettaglio prezzi, bandiera, indicatore distanza, navigatore Google Maps)
- [x] Vista Tabellare comparativa / classifica
- [x] Mappa interattiva Leaflet con pin personalizzati per brand e badge prezzo sotto 2€
- [x] Risoluzione `ChunkLoadError` di Leaflet tramite `next/dynamic` client-only SSR false e strict typing
- [x] Banner informativo con approfondimento sull'articolo de *Il Sole 24 Ore* (Price Cap Eni, IP, Q8)
- [x] Responsive layout completo per smartphone e desktop
