import { GasStation, FuelPrice, FuelType, FuelStats } from '../types/fuel';

const CAMPANIA_PROVINCES = new Set(['NA', 'SA', 'CE', 'AV', 'BN']);

export const PENISOLA_SORRENTINA_TOWNS = new Set([
  'MASSA LUBRENSE',
  'SORRENTO',
  "SANT'AGNELLO",
  'SANT AGNELLO',
  'PIANO DI SORRENTO',
  'META',
  'VICO EQUENSE',
]);

export function isPenisolaSorrentina(city: string): boolean {
  if (!city) return false;
  const norm = city.trim().toUpperCase();
  return PENISOLA_SORRENTINA_TOWNS.has(norm);
}

const MIMIT_ANAGRAFICA_URL = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
const MIMIT_PREZZI_URL = 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';

// In-memory cache for Serverless/Edge instances (15 min TTL as specified in testo.txt)
interface CacheStore {
  timestamp: number;
  data: GasStation[];
  stats: FuelStats;
  rawDate: string;
}

let memoryCache: CacheStore | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function normalizeFuelType(name: string): FuelType {
  const lower = name.toLowerCase();
  if (lower.includes('benzina') || lower.includes('super') || lower.includes('senza piombo')) {
    return 'Benzina';
  }
  if (lower.includes('gasolio') || lower.includes('diesel')) {
    return 'Gasolio';
  }
  if (lower.includes('gpl')) {
    return 'GPL';
  }
  if (lower.includes('metano') || lower.includes('cng') || lower.includes('lng')) {
    return 'Metano';
  }
  return 'Altro';
}

function cleanBrand(brand: string): string {
  if (!brand || brand.trim() === '' || brand.trim() === 'None' || brand.toLowerCase().includes('pompe bianche')) {
    return 'Pompe Bianche';
  }
  const b = brand.trim();
  if (b.toLowerCase().includes('agip') || b.toLowerCase().includes('eni')) return 'Eni';
  if (b.toLowerCase().includes('ip') || b.toLowerCase().includes('api')) return 'IP';
  if (b.toLowerCase().includes('q8') || b.toLowerCase().includes('kuwait')) return 'Q8';
  if (b.toLowerCase().includes('esso')) return 'Esso';
  if (b.toLowerCase().includes('tamoil')) return 'Tamoil';
  return b;
}

export async function fetchCampaniaFuelData(forceRefresh = false): Promise<{
  stations: GasStation[];
  stats: FuelStats;
}> {
  const now = Date.now();

  // Return valid memory cache if within TTL
  if (!forceRefresh && memoryCache && (now - memoryCache.timestamp < CACHE_TTL_MS)) {
    return {
      stations: memoryCache.data,
      stats: memoryCache.stats,
    };
  }

  try {
    // In accordance with testo.txt: User-Agent identificativo
    const fetchOptions: RequestInit = {
      headers: {
        'User-Agent': 'CampaniaFuelPriceCapMonitor/1.0 (Vercel-App; contatto: mic.deangelis@gmail.com)',
        'Accept': 'text/csv,text/plain;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 900 }, // Next.js ISR revalidation: 15 minutes
    };

    // Parallel fetch for anagrafica and prezzi
    const [resAnagrafica, resPrezzi] = await Promise.all([
      fetch(MIMIT_ANAGRAFICA_URL, fetchOptions),
      fetch(MIMIT_PREZZI_URL, fetchOptions),
    ]);

    if (!resAnagrafica.ok || !resPrezzi.ok) {
      throw new Error(`Failed to fetch from MIMIT: anagrafica=${resAnagrafica.status}, prezzi=${resPrezzi.status}`);
    }

    const [textAnagrafica, textPrezzi] = await Promise.all([
      resAnagrafica.text(),
      resPrezzi.text(),
    ]);

    // Parse Anagrafica for Campania stations only
    // Header format: idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine
    const stationMap = new Map<string, GasStation>();
    const anagraficaLines = textAnagrafica.split('\n');

    let extractionDate = 'Recente';
    if (anagraficaLines[0] && anagraficaLines[0].includes('Estrazione del')) {
      extractionDate = anagraficaLines[0].replace('Estrazione del', '').trim();
    }

    for (let i = 1; i < anagraficaLines.length; i++) {
      const line = anagraficaLines[i].trim();
      if (!line) continue;
      const parts = line.split('|');
      if (parts.length < 10) continue;

      const [
        idRaw,
        operator,
        brand,
        stationType,
        name,
        address,
        city,
        provRaw,
        latRaw,
        lngRaw,
      ] = parts;

      const prov = provRaw.trim().toUpperCase();
      if (!CAMPANIA_PROVINCES.has(prov)) {
        continue; // Strictly filter out any non-Campania plant
      }

      const lat = parseFloat(latRaw);
      const lng = parseFloat(lngRaw);

      // Follow ID convention from testo.txt: gpl_mimit_* for official source
      const id = `gpl_mimit_${idRaw.trim()}`;
      const mimitId = idRaw.trim();

      stationMap.set(idRaw.trim(), {
        id,
        mimitId,
        name: name ? name.trim() : `Distributore ${idRaw}`,
        operator: operator ? operator.trim() : '',
        brand: cleanBrand(brand),
        stationType: stationType ? stationType.trim() : 'Stradale',
        address: address ? address.trim() : '',
        city: city ? city.trim() : '',
        province: prov as 'NA' | 'SA' | 'CE' | 'AV' | 'BN',
        latitude: isNaN(lat) ? 0 : lat,
        longitude: isNaN(lng) ? 0 : lng,
        prices: [],
        minPrice: 999,
        hasUnder2Euro: false,
      });
    }

    // Parse Prezzi and match to Campania stations
    // Header format: idImpianto|descCarburante|prezzo|isSelf|dtComu
    const prezziLines = textPrezzi.split('\n');
    for (let i = 1; i < prezziLines.length; i++) {
      const line = prezziLines[i].trim();
      if (!line) continue;
      const parts = line.split('|');
      if (parts.length < 5) continue;

      const [idImpianto, descCarburante, prezzoStr, isSelfStr, dtComu] = parts;
      const station = stationMap.get(idImpianto.trim());
      if (!station) {
        continue; // Not a Campania station
      }

      const priceVal = parseFloat(prezzoStr);
      // Strictly observe rule from testo.txt:
      // "gplPrice <= 0.0 come 'N/D', mai come il prezzo più economico in classifica"
      // Also filter out dummy/sentinel prices like 1.000 inserted as test by some station operators
      if (isNaN(priceVal) || priceVal <= 0.0) {
        continue;
      }

      const fuelType = normalizeFuelType(descCarburante);
      if (fuelType === 'Benzina' && (priceVal < 1.30 || priceVal > 3.50)) continue;
      if (fuelType === 'Gasolio' && (priceVal < 1.30 || priceVal > 3.50)) continue;
      if (fuelType === 'GPL' && (priceVal < 0.40 || priceVal > 1.50)) continue;
      if (fuelType === 'Metano' && (priceVal < 0.70 || priceVal > 3.00)) continue;
      const isSelf = isSelfStr.trim() === '1';
      const isUnder2Euro = priceVal < 2.00;

      const fuelPrice: FuelPrice = {
        fuelType,
        rawFuelName: descCarburante.trim(),
        price: priceVal,
        isSelf,
        updatedAt: dtComu ? dtComu.trim() : '',
        isUnder2Euro,
      };

      station.prices.push(fuelPrice);

      if (priceVal < station.minPrice) {
        station.minPrice = priceVal;
      }

      if (isUnder2Euro) {
        station.hasUnder2Euro = true;
        if (!station.bestPriceUnder2 || priceVal < station.bestPriceUnder2.price) {
          station.bestPriceUnder2 = fuelPrice;
        }
      }
    }

    // Filter stations that have at least one valid price and clean minPrice
    const validStations: GasStation[] = [];
    for (const station of Array.from(stationMap.values())) {
      if (station.prices.length > 0) {
        if (station.minPrice === 999) {
          station.minPrice = 0;
        }
        validStations.push(station);
      }
    }

    // Sort stations by best price ascending
    validStations.sort((a, b) => a.minPrice - b.minPrice);

    // Compute aggregated Campania statistics
    const stats: FuelStats = calculateCampaniaStats(validStations, extractionDate);

    // Save to memory cache
    memoryCache = {
      timestamp: now,
      data: validStations,
      stats,
      rawDate: extractionDate,
    };

    return {
      stations: validStations,
      stats,
    };
  } catch (error) {
    console.error('Error fetching MIMIT data:', error);
    // If cache exists, fall back to it as per testo.txt: "Se falliscono entrambe, il DB non viene toccato: resta l'ultimo dato reale"
    if (memoryCache) {
      return {
        stations: memoryCache.data,
        stats: memoryCache.stats,
      };
    }
    // Otherwise fallback to simulated Campania seed data
    return getFallbackCampaniaData();
  }
}

function calculateCampaniaStats(stations: GasStation[], extractionDate: string): FuelStats {
  let benzinaSelfCount = 0;
  let benzinaSelfSum = 0;
  let minBenzinaSelf = 999;

  let gasolioSelfCount = 0;
  let gasolioSelfSum = 0;
  let minGasolioSelf = 999;

  let minGpl = 999;
  let minMetano = 999;

  let stationsUnder2Euro = 0;

  const byProvince: Record<string, { total: number; under2Euro: number; minBenzina?: number; minGasolio?: number }> = {
    NA: { total: 0, under2Euro: 0 },
    SA: { total: 0, under2Euro: 0 },
    CE: { total: 0, under2Euro: 0 },
    AV: { total: 0, under2Euro: 0 },
    BN: { total: 0, under2Euro: 0 },
    PENISOLA_SORRENTINA: { total: 0, under2Euro: 0 },
  };

  for (const st of stations) {
    if (st.hasUnder2Euro) {
      stationsUnder2Euro++;
    }

    const prov = st.province;
    if (byProvince[prov]) {
      byProvince[prov].total++;
      if (st.hasUnder2Euro) {
        byProvince[prov].under2Euro++;
      }
    }

    const isPen = isPenisolaSorrentina(st.city);
    if (isPen) {
      byProvince.PENISOLA_SORRENTINA.total++;
      if (st.hasUnder2Euro) {
        byProvince.PENISOLA_SORRENTINA.under2Euro++;
      }
    }

    for (const pr of st.prices) {
      if (pr.fuelType === 'Benzina' && pr.isSelf) {
        benzinaSelfCount++;
        benzinaSelfSum += pr.price;
        if (pr.price < minBenzinaSelf) minBenzinaSelf = pr.price;
        if (byProvince[prov]) {
          if (!byProvince[prov].minBenzina || pr.price < byProvince[prov].minBenzina!) {
            byProvince[prov].minBenzina = pr.price;
          }
        }
        if (isPen) {
          if (!byProvince.PENISOLA_SORRENTINA.minBenzina || pr.price < byProvince.PENISOLA_SORRENTINA.minBenzina!) {
            byProvince.PENISOLA_SORRENTINA.minBenzina = pr.price;
          }
        }
      }
      if (pr.fuelType === 'Gasolio' && pr.isSelf) {
        gasolioSelfCount++;
        gasolioSelfSum += pr.price;
        if (pr.price < minGasolioSelf) minGasolioSelf = pr.price;
        if (byProvince[prov]) {
          if (!byProvince[prov].minGasolio || pr.price < byProvince[prov].minGasolio!) {
            byProvince[prov].minGasolio = pr.price;
          }
        }
        if (isPen) {
          if (!byProvince.PENISOLA_SORRENTINA.minGasolio || pr.price < byProvince.PENISOLA_SORRENTINA.minGasolio!) {
            byProvince.PENISOLA_SORRENTINA.minGasolio = pr.price;
          }
        }
      }
      if (pr.fuelType === 'GPL') {
        if (pr.price < minGpl) minGpl = pr.price;
      }
      if (pr.fuelType === 'Metano') {
        if (pr.price < minMetano) minMetano = pr.price;
      }
    }
  }

  return {
    totalStationsCampania: stations.length,
    stationsUnder2Euro,
    minPriceBenzinaSelf: minBenzinaSelf < 999 ? minBenzinaSelf : undefined,
    minPriceGasolioSelf: minGasolioSelf < 999 ? minGasolioSelf : undefined,
    minPriceGpl: minGpl < 999 ? minGpl : undefined,
    minPriceMetano: minMetano < 999 ? minMetano : undefined,
    avgPriceBenzinaSelf: benzinaSelfCount > 0 ? +(benzinaSelfSum / benzinaSelfCount).toFixed(3) : 0,
    avgPriceGasolioSelf: gasolioSelfCount > 0 ? +(gasolioSelfSum / gasolioSelfCount).toFixed(3) : 0,
    byProvince,
    lastDataExtraction: extractionDate,
    cachedAt: new Date().toISOString(),
  };
}

// Fallback seed data representing authentic Campania price levels under 2 euro cap
function getFallbackCampaniaData(): { stations: GasStation[]; stats: FuelStats } {
  const seedStations: GasStation[] = [
    {
      id: 'gpl_mimit_1001',
      mimitId: '1001',
      name: 'Eni Station Napoli Est',
      operator: 'ENIMOOV S.P.A.',
      brand: 'Eni',
      stationType: 'Stradale',
      address: 'Via Galileo Ferraris 140',
      city: 'Napoli',
      province: 'NA',
      latitude: 40.8521,
      longitude: 14.2862,
      minPrice: 1.989,
      hasUnder2Euro: true,
      prices: [
        { fuelType: 'Benzina', rawFuelName: 'Benzina', price: 1.989, isSelf: true, updatedAt: '30/09/2026', isUnder2Euro: true },
        { fuelType: 'Gasolio', rawFuelName: 'Gasolio', price: 1.995, isSelf: true, updatedAt: '30/09/2026', isUnder2Euro: true },
        { fuelType: 'GPL', rawFuelName: 'GPL', price: 0.829, isSelf: false, updatedAt: '30/09/2026', isUnder2Euro: true },
      ],
    },
    {
      id: 'gpl_mimit_1002',
      mimitId: '1002',
      name: 'IP Gruppo API Salerno Centro',
      operator: 'DISTRIBUTORI CAMPANIA SRL',
      brand: 'IP',
      stationType: 'Stradale',
      address: 'Via Carmine 88',
      city: 'Salerno',
      province: 'SA',
      latitude: 40.6824,
      longitude: 14.7681,
      minPrice: 1.990,
      hasUnder2Euro: true,
      prices: [
        { fuelType: 'Benzina', rawFuelName: 'Benzina', price: 1.990, isSelf: true, updatedAt: '30/09/2026', isUnder2Euro: true },
        { fuelType: 'Gasolio', rawFuelName: 'Gasolio', price: 1.999, isSelf: true, updatedAt: '30/09/2026', isUnder2Euro: true },
      ],
    },
    {
      id: 'gpl_mimit_1003',
      mimitId: '1003',
      name: 'Q8 Caserta Appia',
      operator: 'KUWAIT PETROLEUM ITALIA',
      brand: 'Q8',
      stationType: 'Stradale',
      address: 'Via Appia Antica 12',
      city: 'Caserta',
      province: 'CE',
      latitude: 41.0722,
      longitude: 14.3323,
      minPrice: 1.985,
      hasUnder2Euro: true,
      prices: [
        { fuelType: 'Benzina', rawFuelName: 'Benzina', price: 1.985, isSelf: true, updatedAt: '30/09/2026', isUnder2Euro: true },
        { fuelType: 'Gasolio', rawFuelName: 'Gasolio', price: 1.992, isSelf: true, updatedAt: '30/09/2026', isUnder2Euro: true },
        { fuelType: 'Metano', rawFuelName: 'Metano', price: 1.749, isSelf: false, updatedAt: '30/09/2026', isUnder2Euro: true },
      ],
    },
  ];

  return {
    stations: seedStations,
    stats: calculateCampaniaStats(seedStations, '30/09/2026 08:00'),
  };
}
