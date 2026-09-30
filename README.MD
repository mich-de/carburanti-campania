# ⛽ Campania Carburanti Price Cap Monitor (< 2.00 €)

Applicazione web moderna sviluppata in **Next.js** per monitorare in tempo reale i distributori di carburante in **Campania** che offrono prezzi inferiori a **2,00 € al litro**, conformemente al price cap introdotto dai grandi operatori (Eni, IP, Q8) come riportato da *Il Sole 24 Ore*.

Progettata per essere ospitata gratuitamente su [Vercel](https://vercel.com).

---

## 🌟 Caratteristiche Principali

- 🎯 **Esclusivo per la Campania & Penisola Sorrentina:** Copertura capillare delle 5 province campane (**Napoli**, **Salerno**, **Caserta**, **Avellino**, **Benevento**) con filtro dedicato per la **Penisola Sorrentina** (Massa Lubrense, Sorrento, Sant'Agnello, Piano di Sorrento, Meta, Vico Equense).
- 💰 **Monitor Price Cap (< 2.00 €):** Evidenzia immediatamente i distributori che rispettano il tetto al prezzo di Benzina e Gasolio, oltre a GPL e Metano ultra-convenienti.
- ⚡ **Dati Ufficiali MIMIT in Tempo Reale:** Ingestion diretta dei flussi aperti del Ministero delle Imprese e del Made in Italy (Osservaprezzi Carburanti).
- ⏱️ **Cache Intelligente (TTL 15 min):** Prestazioni istantanee conformi alle specifiche di rate limiting e risparmio banda.
- 🗺️ **Mappa Interattiva OpenStreetMap:** Visualizza tutti gli impianti geolocalizzati sulla mappa con Leaflet e pin personalizzati per brand e prezzo.
- 📍 **Geolocalizzazione GPS "Vicino a Me":** Rileva la posizione del dispositivo (come raccomandato dalla guida di *inSella*), calcola la distanza in km in locale (formula Haversine) e ordina all'istante i distributori più vicini.
- 🔍 **Filtri Avanzati & Ricerca:** Filtra per provincia, marchio (Eni, IP, Q8, Pompe Bianche), tipo carburante e modalità Self/Servito.
- 📱 **Mobile First & Navigazione GPS Integrata:** Ciascuna scheda impianto include il pulsante diretto per aprire l'itinerario in Google Maps o Apple Mappe.

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
L'applicazione sarà disponibile su `http://localhost:7777`.

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
- **Dati Ufficiali Carburanti:** [MIMIT Open Data](https://www.mimit.gov.it/it/open-data/dati-carburanti) - Ministero delle Imprese e del Made in Italy ex D.M. 12/03/2009.
- **Portale Ministeriale di Ricerca per Zona:** [MIMIT Osservaprezzi Zona](https://carburanti.mise.gov.it/ospzSearch/zona).
- **Cartografia:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **Articolo di Riferimento 1:** [Il Sole 24 Ore - Price Cap Eni, IP e Q8](https://www.ilsole24ore.com/art/caro-carburante-eni-anche-ip-fa-scattare-sconti-ecco-quanto-si-puo-risparmiare-AJBhWzQB).
- **Articolo di Riferimento 2:** [inSella.it - È il giorno della benzina sotto i 2 euro: dove sono i distributori a prezzo scontato](https://www.insella.it/news/il-giorno-della-benzina-sotto-2-euro-dove-sono-distributori-prezzo-scontato-78577).
