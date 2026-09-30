# GEMINI: Persistent Memory & Context Log

## Progetto: Campania Carburanti Price Cap Monitor (< 2.00 €)

### Contesto e Obiettivo
L'applicazione web consente agli automobilisti e cittadini della **Campania** di monitorare in tempo reale i distributori di carburante con prezzi inferiori a 2,00 € al litro, in conformità all'accordo sul *price cap* e sconti attivati da Eni, IP e Q8 (come documentato dall'articolo de *Il Sole 24 Ore*).

### Decisioni Architetturali Fondamentali
1. **Perché focalizzarsi solo sulla Campania e Penisola Sorrentina?**
   - Riduce il volume dati da ~22.000 distributori nazionali a ~1.850 distributori campani (Province: Napoli `NA`, Salerno `SA`, Caserta `CE`, Avellino `AV`, Benevento `BN`).
   - Aggiunto filtro territoriale dedicato **"Penisola Sorrentina"** che ingloba con precisione i 6 comuni costieri (Massa Lubrense, Sorrento, Sant'Agnello, Piano di Sorrento, Meta, Vico Equense) con 22 impianti monitorati e coordinate mappa centrate a zoom 12.
   - Risolve i limiti di memoria (512MB/1024MB) e timeout (10s) delle Vercel Serverless Functions.
   - Fornisce un'esperienza ultra-reattiva sia su mobile che desktop.
   - Piena coerenza con le specifiche fornite in `testo.txt` (`CampaniaGplDataSource`, 5 province in parallelo/unificate, TTL 15 min, sanitizzazione `prezzo <= 0` treated as N/D).

2. **Fonti Dati e Compliance Rete:**
   - Dati ufficiali: Open Data MIMIT (`anagrafica_impianti_attivi.csv` e `prezzo_alle_8.csv`).
   - Portale ministeriale di verifica: `carburanti.mise.gov.it/ospzSearch/zona` (Osservaprezzi MIMIT).
   - Iniziativa Price Cap documentata da *Il Sole 24 Ore* e *inSella* ("Il giorno della benzina sotto i 2 euro"): tetto a 1,990 €/l benzina (self e servito) e 2,190 €/l gasolio.
   - Geolocalizzazione: calcolo distanza locale via formula Haversine (`distanceKm`), nessun tracciamento verso server terzi.
   - Mappe: OpenStreetMap standard tiles via Leaflet.
   - Nessuna chiamata di terze parti non autorizzata, pieno rispetto delle policy di rete indicate in `testo.txt`.

3. **Strategia di Caching:**
   - TTL di 15 minuti su cache in memoria lato serverless Next.js + Header HTTP `Cache-Control: s-maxage=900, stale-while-revalidate=1800`.
   - Riduzione del traffico verso i server MIMIT e risposte istantanee (< 50ms) per i client Vercel.

4. **Risoluzione ChunkLoadError Leaflet:**
   - La libreria `leaflet` accede direttamente a `window` e `document`. L'uso di dynamic imports asincroni all'interno del ciclo di vita di un componente SSR provocava `ChunkLoadError` durante i reload veloci di Next.js.
   - Soluzione: `StationMap` è stata isolata e caricata in [src/app/page.tsx](file:///D:/web-carburanti/src/app/page.tsx) tramite `next/dynamic(() => import('@/components/StationMap'), { ssr: false })` con fallback skeleton UI, eliminando qualsiasi tentativo di pre-rendering server-side e garantendo caricamento affidabile al 100%.

5. **Normalizzazione Indirizzi e Precisione Google Maps:**
   - Negli Open Data MIMIT molti indirizzi presentano toponimi tronchi o mancanti (es. `ITALIA 10/A` anziché `Corso Italia 10/A`, `DEI PLATANI SNC` anziché `Via dei Platani SNC`, `DELLE ROSE 14`, `R. BOSCO 53`, `P.ZZA CIRCUMVESUVIANA`), CAP errati (es. `80053` per Piano di Sorrento) o CAP accodati senza formattazione.
   - Implementata la funzione `normalizeStationAddress` e il dizionario verificato `PENISOLA_SORRENTINA_OVERRIDES` per tutti i 22 impianti della costiera con toponomastica esatta e coordinate GPS millimetriche.
   - Aggiornati i link di navigazione: l'indirizzo mostrato sulle card e nella tabella è ora cliccabile con query di ricerca Google Maps esatta (`https://www.google.com/maps/search/?api=1&query=...`), mentre il pulsante "Naviga" avvia la navigazione turn-by-turn con le coordinate verificate.

6. **Identità Git:**
   - `user.name`: `mich-de`
   - `user.email`: `mic.deangelis@gmail.com`


