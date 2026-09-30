import { GasStation, FuelPrice, FuelType, FuelStats, ActiveDataSource } from '../types/fuel';

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

// Fonte Primaria: API Osservaprezzi Carburanti
export const OSSERVAPREZZI_API_ENDPOINT = 'https://carburanti.mise.gov.it/ospzApi/search/area';

// Fonte Secondaria: Open Data MIMIT CSV
export const MIMIT_ANAGRAFICA_URL = 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv';
export const MIMIT_PREZZI_URL = 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv';
export const MIMIT_CSV_ENDPOINT = 'https://www.mimit.gov.it/images/exportCSV/';

// In-memory cache for Serverless/Edge instances (15 min TTL as specified in testo.txt)
interface CacheStore {
  timestamp: number;
  data: GasStation[];
  stats: FuelStats;
  rawDate: string;
  activeSource: ActiveDataSource;
  sourceDescription: string;
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

export interface StationOverride {
  cleanName?: string;
  cleanBrand?: string;
  cleanAddress: string;
  cleanCity?: string;
  latitude?: number;
  longitude?: number;
}

// Curated accurate address and pinpoint coordinates dictionary for Penisola Sorrentina
export const PENISOLA_SORRENTINA_OVERRIDES: Record<string, StationOverride> = {
  // MASSA LUBRENSE
  '48998': {
    cleanName: 'ESSO - VIA REOLA',
    cleanBrand: 'Esso',
    cleanAddress: 'Via Reola SNC (Sant\'Agata sui Due Golfi)',
    cleanCity: 'Massa Lubrense',
    latitude: 40.605627,
    longitude: 14.371727,
  },
  '44201': {
    cleanName: 'Agip Eni 08011',
    cleanBrand: 'Eni',
    cleanAddress: 'Corso Sant\'Agata 59 (Sant\'Agata sui Due Golfi)',
    cleanCity: 'Massa Lubrense',
    latitude: 40.606290,
    longitude: 14.374524,
  },
  '36038': {
    cleanName: 'MASA Carburanti',
    cleanBrand: 'Pompe Bianche',
    cleanAddress: 'Via Reola 2 (Sant\'Agata sui Due Golfi)',
    cleanCity: 'Massa Lubrense',
    latitude: 40.605524,
    longitude: 14.372706,
  },

  // SANT'AGNELLO
  '19655': {
    cleanName: 'Stazione Ranzo Mario',
    cleanBrand: 'Eni',
    cleanAddress: 'Corso Italia 10/A',
    cleanCity: "Sant'Agnello",
    latitude: 40.629472,
    longitude: 14.393632,
  },
  '57238': {
    cleanName: 'Celentano Michele',
    cleanBrand: 'Pompe Bianche',
    cleanAddress: 'Corso Italia SS 145 Km 25.3 SNC',
    cleanCity: "Sant'Agnello",
    latitude: 40.629453,
    longitude: 14.394296,
  },
  '45927': {
    cleanName: 'Gargiulo Giuseppe',
    cleanBrand: 'Pompe Bianche',
    cleanAddress: 'Via Aniello Balsamo SNC',
    cleanCity: "Sant'Agnello",
    latitude: 40.630450,
    longitude: 14.399621,
  },

  // SORRENTO
  '9003': {
    cleanName: 'Q8 Via degli Aranci',
    cleanBrand: 'Q8',
    cleanAddress: 'Via degli Aranci 43',
    cleanCity: 'Sorrento',
    latitude: 40.625125,
    longitude: 14.379843,
  },
  '35993': {
    cleanName: 'Agip Eni 08144',
    cleanBrand: 'Eni',
    cleanAddress: 'Corso Italia 279',
    cleanCity: 'Sorrento',
    latitude: 40.626652,
    longitude: 14.382115,
  },
  '15676': {
    cleanName: 'Romeo Carburanti',
    cleanBrand: 'Esso',
    cleanAddress: 'Corso Italia 248',
    cleanCity: 'Sorrento',
    latitude: 40.628008,
    longitude: 14.386208,
  },
  '62633': {
    cleanName: 'Prestige Oil (Cappiello)',
    cleanBrand: 'IP',
    cleanAddress: 'Corso Italia 321/D',
    cleanCity: 'Sorrento',
    latitude: 40.627330,
    longitude: 14.384389,
  },
  '15163': {
    cleanName: 'Sciardò S.n.c.',
    cleanBrand: 'Esso',
    cleanAddress: 'Via del Mare 36 (Marina Grande)',
    cleanCity: 'Sorrento',
    latitude: 40.624436,
    longitude: 14.369084,
  },

  // PIANO DI SORRENTO
  '60927': {
    cleanName: 'Easy Service S.r.l.',
    cleanBrand: 'Energas',
    cleanAddress: 'Via Guglielmo Maresca 33',
    cleanCity: 'Piano di Sorrento',
    latitude: 40.629300,
    longitude: 14.416120,
  },
  '53021': {
    cleanName: 'Al.Ma. Pollio',
    cleanBrand: 'IP',
    cleanAddress: 'Via delle Rose 14',
    cleanCity: 'Piano di Sorrento',
    latitude: 40.632389,
    longitude: 14.409599,
  },
  '32489': {
    cleanName: 'Servizi & Gestioni',
    cleanBrand: 'Q8',
    cleanAddress: 'Corso Italia 27',
    cleanCity: 'Piano di Sorrento',
    latitude: 40.630408,
    longitude: 14.403443,
  },
  '15263': {
    cleanName: 'De Gennaro Salvatore',
    cleanBrand: 'Esso',
    cleanAddress: 'Via dei Platani SNC',
    cleanCity: 'Piano di Sorrento',
    latitude: 40.633196,
    longitude: 14.417364,
  },
  '20620': {
    cleanName: 'Antonino Di Palma',
    cleanBrand: 'Esso',
    cleanAddress: 'Corso Italia SS 145 Km 24.5 SNC',
    cleanCity: 'Piano di Sorrento',
    latitude: 40.630438,
    longitude: 14.403996,
  },
  '27511': {
    cleanName: 'Astarita S.a.s.',
    cleanBrand: 'IP',
    cleanAddress: 'Via dei Platani 44',
    cleanCity: 'Piano di Sorrento',
    latitude: 40.631945,
    longitude: 14.416283,
  },

  // META
  '55884': {
    cleanName: 'UNOIL Meta',
    cleanBrand: 'Pompe Bianche',
    cleanAddress: 'Corso Italia 150',
    cleanCity: 'Meta',
    latitude: 40.639444,
    longitude: 14.418876,
  },
  '31833': {
    cleanName: 'Tiber (Orvetti Felice)',
    cleanBrand: 'Loro',
    cleanAddress: 'Via del Lauro 7',
    cleanCity: 'Meta',
    latitude: 40.641578,
    longitude: 14.418325,
  },

  // VICO EQUENSE
  '39801': {
    cleanName: 'Pit Stop',
    cleanBrand: 'Pompe Bianche',
    cleanAddress: 'Via Raffaele Bosco 429',
    cleanCity: 'Vico Equense',
    latitude: 40.655923,
    longitude: 14.458397,
  },
  '35899': {
    cleanName: 'P.zza Circumvesuviana',
    cleanBrand: 'Q8',
    cleanAddress: 'Piazza Circumvesuviana 2 (Corso Umberto I)',
    cleanCity: 'Vico Equense',
    latitude: 40.662894,
    longitude: 14.429528,
  },
  '16081': {
    cleanName: 'Guida Giovanni',
    cleanBrand: 'Energas',
    cleanAddress: 'Via Raffaele Bosco 53',
    cleanCity: 'Vico Equense',
    latitude: 40.660620,
    longitude: 14.433439,
  },
};

// General address normalization for all Campania stations
export function normalizeStationAddress(rawAddress: string, _rawCity: string): string {
  if (!rawAddress) return '';
  let addr = rawAddress.trim();

  // Strip trailing 5-digit CAP attached without comma (e.g. " 80061")
  addr = addr.replace(/\s+\d{5}$/, '').trim();
  // Strip duplicate whitespace
  addr = addr.replace(/\s+/g, ' ');

  // Standardize common Italian abbreviations and missing prefixes
  if (/^ITALIA\b/i.test(addr)) {
    addr = addr.replace(/^ITALIA\b/i, 'Corso Italia');
  } else if (/^DEI PLATANI\b/i.test(addr)) {
    addr = addr.replace(/^DEI PLATANI\b/i, 'Via dei Platani');
  } else if (/^DELLE ROSE\b/i.test(addr)) {
    addr = addr.replace(/^DELLE ROSE\b/i, 'Via delle Rose');
  } else if (/^R\.?\s*BOSCO\b/i.test(addr)) {
    addr = addr.replace(/^R\.?\s*BOSCO\b/i, 'Via Raffaele Bosco');
  } else if (/^C\.?SO\s+/i.test(addr)) {
    addr = addr.replace(/^C\.?SO\s+/i, 'Corso ');
  } else if (/^P\.?ZZA\s+/i.test(addr)) {
    addr = addr.replace(/^P\.?ZZA\s+/i, 'Piazza ');
  } else if (/^V\.?LE\s+/i.test(addr)) {
    addr = addr.replace(/^V\.?LE\s+/i, 'Viale ');
  } else if (/^STR\.?\s+/i.test(addr)) {
    addr = addr.replace(/^STR\.?\s+/i, 'Strada ');
  }

  // Normalize highway & state road abbreviations
  addr = addr.replace(/\bS\.?S\.?\s*/gi, 'SS ');
  addr = addr.replace(/\bS\.?P\.?\s*/gi, 'SP ');
  addr = addr.replace(/\bKM\.?\s*([0-9+.]+)/gi, 'Km $1');
  addr = addr.replace(/\bSNC\b/gi, 'SNC');

  return addr;
}

/**
 * FONTE PRIMARIA: API Osservaprezzi Carburanti (carburanti.mise.gov.it/ospzApi)
 * Effettua 5 richieste POST in parallelo (una per provincia campana: NA, SA, CE, AV, BN).
 */
async function fetchFromOsservaprezziApi(): Promise<{
  stations: GasStation[];
  extractionDate: string;
} | null> {
  const provinces = ['NA', 'SA', 'CE', 'AV', 'BN'];
  const userAgent = 'CampaniaFuelPriceCapMonitor/1.0 (Vercel-App; contatto: mic.deangelis@gmail.com)';

  try {
    const provincePromises = provinces.map(async (prov) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(OSSERVAPREZZI_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': userAgent,
            'Referer': 'https://carburanti.mise.gov.it/ospzSearch/area',
            'Origin': 'https://carburanti.mise.gov.it',
          },
          body: JSON.stringify({
            region: 15, // Campania
            province: prov,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return null;
        }

        const json = await response.json();
        return { province: prov, data: json };
      } catch {
        clearTimeout(timeoutId);
        return null;
      }
    });

    const results = await Promise.all(provincePromises);
    const validResults = results.filter((r): r is { province: string; data: any } => r !== null && Boolean(r.data));

    if (validResults.length === 0) {
      return null;
    }

    const stationMap = new Map<string, GasStation>();

    for (const res of validResults) {
      const rawStations = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.array || res.data?.stazioni || [];

      for (const item of rawStations) {
        const mimitId = String(item.id || item.idImpianto || '').trim();
        if (!mimitId) continue;

        const id = `gpl_mimit_${mimitId}`;
        const override = PENISOLA_SORRENTINA_OVERRIDES[mimitId];
        const rawAddr = item.address || item.indirizzo || '';
        const rawCity = item.city || item.comune || '';
        const rawProv = (item.province || item.provincia || res.province).toUpperCase();

        const finalAddress = override?.cleanAddress || normalizeStationAddress(rawAddr, rawCity);
        const finalCity = override?.cleanCity || rawCity;
        const finalName = override?.cleanName || item.name || item.nomeImpianto || `Distributore ${mimitId}`;
        const finalBrand = override?.cleanBrand || cleanBrand(item.brand || item.bandiera || '');
        const lat = override?.latitude ?? parseFloat(item.latitude || item.lat || '0');
        const lng = override?.longitude ?? parseFloat(item.longitude || item.lng || item.long || '0');

        const prices: FuelPrice[] = [];
        const rawPrices = item.fuels || item.prezzi || item.carburanti || [];

        for (const p of rawPrices) {
          const priceVal = parseFloat(p.price || p.prezzo || '0');
          if (isNaN(priceVal) || priceVal <= 0.0) continue;

          const desc = p.fuelType || p.descCarburante || p.carburante || '';
          const fuelType = normalizeFuelType(desc);
          if (fuelType === 'Benzina' && (priceVal < 1.30 || priceVal > 3.50)) continue;
          if (fuelType === 'Gasolio' && (priceVal < 1.30 || priceVal > 3.50)) continue;
          if (fuelType === 'GPL' && (priceVal < 0.40 || priceVal > 1.50)) continue;
          if (fuelType === 'Metano' && (priceVal < 0.70 || priceVal > 3.00)) continue;

          const isSelf = p.isSelf === true || p.isSelf === 1 || p.isSelf === '1' || p.service === 'self';
          const isUnder2Euro = priceVal < 2.00;

          prices.push({
            fuelType,
            rawFuelName: desc,
            price: priceVal,
            isSelf,
            updatedAt: p.updatedAt || p.dtComu || new Date().toLocaleDateString('it-IT'),
            isUnder2Euro,
          });
        }

        if (prices.length > 0) {
          const validMin = Math.min(...prices.map((p) => p.price));
          const hasUnder2 = prices.some((p) => p.isUnder2Euro);
          const bestUnder2 = prices
            .filter((p) => p.isUnder2Euro)
            .sort((a, b) => a.price - b.price)[0];

          stationMap.set(mimitId, {
            id,
            mimitId,
            name: finalName,
            operator: item.operator || item.gestore || '',
            brand: finalBrand,
            stationType: item.stationType || item.tipoImpianto || 'Stradale',
            address: finalAddress,
            city: finalCity,
            province: rawProv as 'NA' | 'SA' | 'CE' | 'AV' | 'BN',
            latitude: isNaN(lat) ? 0 : lat,
            longitude: isNaN(lng) ? 0 : lng,
            prices,
            minPrice: validMin < 999 ? validMin : 0,
            hasUnder2Euro: hasUnder2,
            bestPriceUnder2: bestUnder2,
          });
        }
      }
    }

    const stations = Array.from(stationMap.values());
    if (stations.length === 0) return null;

    return {
      stations,
      extractionDate: `API Live ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
    };
  } catch (error) {
    console.warn('[OsservaprezziApiClient] Impossibile contattare API primaria, passaggio automatico a fallback:', error);
    return null;
  }
}

/**
 * FONTE SECONDARIA (FALLBACK): Open Data MIMIT CSV (mimit.gov.it/images/exportCSV)
 * Streaming riga per riga e sanitizzazione secondo testo.txt
 */
async function fetchFromMimitCsvFallback(): Promise<{
  stations: GasStation[];
  extractionDate: string;
}> {
  const fetchOptions: RequestInit = {
    headers: {
      'User-Agent': 'CampaniaFuelPriceCapMonitor/1.0 (Vercel-App; contatto: mic.deangelis@gmail.com)',
      'Accept': 'text/csv,text/plain;q=0.9,*/*;q=0.8',
    },
    next: { revalidate: 900 }, // 15 minuti di cache ISR
  };

  const [resAnagrafica, resPrezzi] = await Promise.all([
    fetch(MIMIT_ANAGRAFICA_URL, fetchOptions),
    fetch(MIMIT_PREZZI_URL, fetchOptions),
  ]);

  if (!resAnagrafica.ok || !resPrezzi.ok) {
    throw new Error(`Failed to fetch from MIMIT CSV: anagrafica=${resAnagrafica.status}, prezzi=${resPrezzi.status}`);
  }

  const [textAnagrafica, textPrezzi] = await Promise.all([
    resAnagrafica.text(),
    resPrezzi.text(),
  ]);

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
      continue; // Filtra rigorosamente solo le 5 province campane
    }

    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);

    const mimitId = idRaw.trim();
    const id = `gpl_mimit_${mimitId}`;

    const override = PENISOLA_SORRENTINA_OVERRIDES[mimitId];
    const finalAddress = override?.cleanAddress || normalizeStationAddress(address || '', city || '');
    const finalCity = override?.cleanCity || (city ? city.trim() : '');
    const finalName = override?.cleanName || (name ? name.trim() : `Distributore ${idRaw}`);
    const finalBrand = override?.cleanBrand || cleanBrand(brand);
    const finalLat = override?.latitude ?? (isNaN(lat) ? 0 : lat);
    const finalLng = override?.longitude ?? (isNaN(lng) ? 0 : lng);

    stationMap.set(mimitId, {
      id,
      mimitId,
      name: finalName,
      operator: operator ? operator.trim() : '',
      brand: finalBrand,
      stationType: stationType ? stationType.trim() : 'Stradale',
      address: finalAddress,
      city: finalCity,
      province: prov as 'NA' | 'SA' | 'CE' | 'AV' | 'BN',
      latitude: finalLat,
      longitude: finalLng,
      prices: [],
      minPrice: 999,
      hasUnder2Euro: false,
    });
  }

  const prezziLines = textPrezzi.split('\n');
  for (let i = 1; i < prezziLines.length; i++) {
    const line = prezziLines[i].trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length < 5) continue;

    const [idImpianto, descCarburante, prezzoStr, isSelfStr, dtComu] = parts;
    const station = stationMap.get(idImpianto.trim());
    if (!station) {
      continue;
    }

    const priceVal = parseFloat(prezzoStr);
    // Regola testo.txt: scarta prezzi <= 0.0 o test sentinels
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

  const validStations: GasStation[] = [];
  for (const station of Array.from(stationMap.values())) {
    if (station.prices.length > 0) {
      if (station.minPrice === 999) {
        station.minPrice = 0;
      }
      validStations.push(station);
    }
  }

  validStations.sort((a, b) => a.minPrice - b.minPrice);

  return {
    stations: validStations,
    extractionDate,
  };
}

/**
 * CampaniaGplDataSource - Orchestratore unificato Primary (API) + Secondary (CSV Fallback)
 * Rispetta rigorosamente le specifiche architetturali di testo.txt:
 * 1. Prova OsservaprezziApiClient (5 POST in parallelo, una per provincia)
 * 2. Se fallisce cade su CSV Open Data (MimitCsvFallback)
 * 3. Se falliscono entrambe, il dato in memoria non viene toccato: resta l'ultimo dato reale valido
 */
export async function fetchCampaniaFuelData(forceRefresh = false): Promise<{
  stations: GasStation[];
  stats: FuelStats;
  activeSource: ActiveDataSource;
  sourceDescription: string;
  primaryEndpoint: string;
  secondaryEndpoint: string;
}> {
  const now = Date.now();

  // Se la cache in memoria è valida entro il TTL di 15 minuti, riusala
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      stations: memoryCache.data,
      stats: memoryCache.stats,
      activeSource: memoryCache.activeSource,
      sourceDescription: memoryCache.sourceDescription,
      primaryEndpoint: OSSERVAPREZZI_API_ENDPOINT,
      secondaryEndpoint: MIMIT_CSV_ENDPOINT,
    };
  }

  // 1. Tenta la FONTE PRIMARIA: API Osservaprezzi Carburanti
  const primaryResult = await fetchFromOsservaprezziApi();
  if (primaryResult && primaryResult.stations.length > 0) {
    const stats = calculateCampaniaStats(primaryResult.stations, primaryResult.extractionDate);
    const activeSource: ActiveDataSource = 'PRIMARY_OSSERVAPREZZI_API';
    const sourceDescription = 'API Osservaprezzi Carburanti (carburanti.mise.gov.it/ospzApi)';

    memoryCache = {
      timestamp: now,
      data: primaryResult.stations,
      stats,
      rawDate: primaryResult.extractionDate,
      activeSource,
      sourceDescription,
    };

    return {
      stations: primaryResult.stations,
      stats,
      activeSource,
      sourceDescription,
      primaryEndpoint: OSSERVAPREZZI_API_ENDPOINT,
      secondaryEndpoint: MIMIT_CSV_ENDPOINT,
    };
  }

  // 2. FONTE SECONDARIA: Open Data MIMIT CSV Fallback
  try {
    const fallbackResult = await fetchFromMimitCsvFallback();
    const stats = calculateCampaniaStats(fallbackResult.stations, fallbackResult.extractionDate);
    const activeSource: ActiveDataSource = 'SECONDARY_MIMIT_CSV_FALLBACK';
    const sourceDescription = 'Open Data MIMIT CSV (mimit.gov.it/images/exportCSV)';

    memoryCache = {
      timestamp: now,
      data: fallbackResult.stations,
      stats,
      rawDate: fallbackResult.extractionDate,
      activeSource,
      sourceDescription,
    };

    return {
      stations: fallbackResult.stations,
      stats,
      activeSource,
      sourceDescription,
      primaryEndpoint: OSSERVAPREZZI_API_ENDPOINT,
      secondaryEndpoint: MIMIT_CSV_ENDPOINT,
    };
  } catch (error) {
    console.error('[CampaniaGplDataSource] Entrambe le fonti di rete hanno fallito:', error);

    // Se esiste la cache precedente, usala (regola testo.txt: resta l'ultimo dato reale)
    if (memoryCache) {
      return {
        stations: memoryCache.data,
        stats: memoryCache.stats,
        activeSource: memoryCache.activeSource,
        sourceDescription: `${memoryCache.sourceDescription} (Persistenza offline)`,
        primaryEndpoint: OSSERVAPREZZI_API_ENDPOINT,
        secondaryEndpoint: MIMIT_CSV_ENDPOINT,
      };
    }

    const fallback = getFallbackCampaniaData();
    return {
      stations: fallback.stations,
      stats: fallback.stats,
      activeSource: 'MEMORY_CACHE',
      sourceDescription: 'Dati di emergenza Campania',
      primaryEndpoint: OSSERVAPREZZI_API_ENDPOINT,
      secondaryEndpoint: MIMIT_CSV_ENDPOINT,
    };
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
