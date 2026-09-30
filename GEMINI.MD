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

2. **Architettura Doppia Fonte (Primaria API + Secondaria CSV Fallback):**
   - **Fonte Primaria:** API Osservaprezzi Carburanti (`https://carburanti.mise.gov.it/ospzApi/search/area`). Richiede in parallelo le 5 province campane (NA, SA, CE, AV, BN) con timeout di 4 secondi.
   - **Fonte Secondaria (Fallback Automatico):** Open Data MIMIT CSV (`https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv` e `prezzo_alle_8.csv`).
   - **Persistenza & Resilienza:** Se entrambe le chiamate di rete falliscono, il sistema mantiene in memoria l'ultimo dato reale valido verificato (conformità stretta a `testo.txt`: *"Se falliscono entrambe, il DB non viene toccato: resta l'ultimo dato reale"*).
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

7. **Standardizzazione Province & Precisione Price Cap (< 2.00 €):**
   - Rimosso il selettore pseudo-provincia "Penisola Sorrentina" dai filtri provinciali: la ricerca per comuni (Sorrento, Massa Lubrense, Sant'Agnello, Piano di Sorrento, Meta, Vico Equense) avviene in modo immediato tramite la barra di ricerca rapida o selezionando la provincia reale di Napoli (`NA`).
   - Esclusione GPL e Metano dalla marcatura `isUnder2Euro`: l'accordo sul Price Cap riguarda specificamente Benzina (tetto 1.990 €/l) e Gasolio. GPL (~0.80 €) e Metano (~1.50 €) non innescano più ingannevolmente il badge `PRICE CAP < 2€` né falsano il conteggio delle stazioni con price cap.
   - Nella costiera le pompe con Benzina sotto i 2 euro sono esattamente 3:
     1. `48998` Esso - Via Reola (Massa Lubrense): Benzina Self 1.989 €
     2. `44201` Agip Eni 08011 (Massa Lubrense): Benzina Self 1.990 €
     3. `19655` Stazione Ranzo Mario (Sant'Agnello): Benzina Self 1.990 €
   - Perfezionata la ricerca "Meta": eliminati i falsi positivi da "METANAUTO" (Atena Lucana/Padula) su nome e operatore, isolando con precisione i 2 impianti di Meta (UNOIL Meta e Tiber).

8. **Separazione Prezzo < 2€ vs Accordo Price Cap & Selettore Territoriale Penisola Sorrentina:**
   - Introdotta la distinzione formale tra:
     a) **Prezzo < 2.00 €**: qualsiasi distributore (inclusi indipendenti e pompe bianche) con prezzo effettivo comunicato sotto 2 euro.
     b) **Accordo Price Cap**: distributori delle grandi compagnie aderenti al protocollo d'intesa (Eni, IP, Q8, Esso).
   - Badge dedicati: `PRICE CAP < 2€` per le grandi reti dell'accordo, `PREZZO < 2€` per i distributori no-logo / pompe bianche.
   - Filtro territoriale Penisola Sorrentina riprogettato esteticamente come **Ambito Territoriale In Evidenza** (segmented pill switcher `Tutta la Campania` vs `🌊 Penisola Sorrentina 22 Pompe`), con elenco dei 6 comuni costieri, disattivazione coerente della tendina provinciale e riposizionamento della mappa Leaflet a zoom 12.
   - **Stato di Default dell'Applicazione:** Attivati contemporaneamente all'avvio sia **Solo Self-Service** che **Accordo Price Cap** (Grandi Reti con prezzi < 2.00 €), permettendo all'utente di passare con un click a "Tutti sotto i 2.00 €" per includere anche le Pompe Bianche no-logo.

9. **Integrazione Endpoint Ufficiale MIMIT `/ospzApi/search/servicearea` & Principio Zero-AI:**
   - Riaffermato il principio fondante del progetto ("mai un dato inventato"): nessuna intelligenza artificiale o modello generativo è coinvolto nella pipeline dati dell'applicazione. Nessun prezzo o dato è mai stimato o inventato.
   - Fonte Primaria: `https://carburanti.mise.gov.it/ospzApi/search/servicearea`, chiamata in parallelo per le 5 province (`NA`, `SA`, `CE`, `AV`, `BN`) con payload `{ province: prov }`. Risponde in ~700ms restituendo l'intero parco distributori campano (1.863 impianti) con orari esatti di trasmissione al Ministero (`insertDate`), coordinate GPS e listini self/servito.
   - Aggiunto `parseApiAddress` per la scomposizione della stringa toponomastica MIMIT (`VIA ... [CAP] - COMUNE PROV`) e formattazione data/ora italiana `formatApiDate`.
   - Mantenuto il fallback su Open Data CSV (`prezzo_alle_8.csv`) e persistenza in-memory dell'ultimo dato reale valido qualora la rete sia temporaneamente irraggiungibile.

10. **Deployment Live su Vercel & GitHub Repository:**
   - **Repository GitHub:** `https://github.com/mich-de/web-carburanti` (creata e sincronizzata con `gh repo create`)
   - **Vercel Project & Team:** `micheles-projects-863019a6/web-carburanti`
   - **Production URL:** `https://web-carburanti.vercel.app`
   - **Direct Deployment URL:** `https://web-carburanti-1rclr0ovt-micheles-projects-863019a6.vercel.app`
   - **Verifica API in Produzione:** Risposta `200 OK` con 1.863 stazioni campane elaborate in tempo reale da `/ospzApi/search/servicearea`.


