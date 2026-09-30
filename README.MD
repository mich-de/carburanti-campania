# ⛽ Campania Carburanti Price Cap Monitor (< 2.00 €)

Applicazione web moderna sviluppata in **Next.js** per monitorare in tempo reale i distributori di carburante in **Campania** che offrono prezzi inferiori a **2,00 € al litro**, conformemente al price cap introdotto dai grandi operatori (Eni, IP, Q8) come riportato da *Il Sole 24 Ore*.

Progettata per essere ospitata gratuitamente su [Vercel](https://vercel.com).

---

## 🌟 Caratteristiche Principali

- 🎯 **Esclusivo per la Campania:** Copertura capillare delle 5 province: **Napoli (NA)**, **Salerno (SA)**, **Caserta (CE)**, **Avellino (AV)**, **Benevento (BN)**.
- 💰 **Monitor Price Cap (< 2.00 €):** Evidenzia immediatamente i distributori che rispettano il tetto al prezzo di Benzina e Gasolio, oltre a GPL e Metano ultra-convenienti.
- ⚡ **Dati Ufficiali MIMIT in Tempo Reale:** Ingestion diretta dei flussi aperti del Ministero delle Imprese e del Made in Italy (Osservaprezzi Carburanti).
- ⏱️ **Cache Intelligente (TTL 15 min):** Prestazioni istantanee conformi alle specifiche di rate limiting e risparmio banda.
- 🗺️ **Mappa Interattiva OpenStreetMap:** Visualizza tutti gli impianti geolocalizzati sulla mappa con Leaflet.
- 🔍 **Filtri Avanzati & Ricerca:** Filtra per provincia, marchio (Eni, IP, Q8, Pompe Bianche), tipo carburante e modalità Self/Servito.
- 📱 **Mobile First & PWA Ready:** Interfaccia fluida e reattiva ottimizzata per smartphone.

---

## 🚀 Come Installare ed Eseguire in Locale

### Prerequisiti
- **Node.js** v18+ (testato con v25.2.0)
- **npm** oppure **pnpm**

### Installazione
```bash
# Installa le dipendenze
npm install
```

### Avvio in Sviluppo
```bash
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:3000`.

### Build di Produzione
```bash
npm run build
npm run start
```

---

## ☁️ Come Pubblicare su Vercel

1. Fai il push del repository su GitHub:
   ```bash
   git add .
   git commit -m "feat: initial commit - campania fuel price cap monitor"
   git branch -M main
   git remote add origin https://github.com/<tuo-utente>/<tuo-repo>.git
   git push -u origin main
   ```
2. Vai su [vercel.com](https://vercel.com) e accedi con GitHub.
3. Clicca su **Add New...** -> **Project**.
4. Importa la repository `web-carburanti`.
5. Mantieni il Framework Preset come **Next.js** e clicca su **Deploy**.
6. In meno di 2 minuti il tuo sito sarà online su `https://<nome-progetto>.vercel.app`!

---

## 🏛️ Attribuzioni e Fonti Dati
- **Dati Carburanti:** [MIMIT Open Data](https://www.mimit.gov.it/it/open-data/dati-carburanti) - Ministero delle Imprese e del Made in Italy.
- **Cartografia:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **Riferimento Notizia:** [Il Sole 24 Ore - Price Cap Eni, IP e Q8](https://www.ilsole24ore.com/art/caro-carburante-eni-anche-ip-fa-scattare-sconti-ecco-quanto-si-puo-risparmiare-AJBhWzQB).
