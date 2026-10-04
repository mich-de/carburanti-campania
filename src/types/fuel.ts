export type FuelType = 'Benzina' | 'Gasolio' | 'GPL' | 'Metano' | 'Altro';

export interface FuelPrice {
  fuelType: FuelType;
  rawFuelName: string;
  price: number;
  isSelf: boolean;
  updatedAt: string;
  isUnder2Euro: boolean;
}

export interface GasStation {
  id: string; // e.g. "gpl_mimit_12345"
  mimitId: string; // Official numeric ID e.g. "12345"
  name: string;
  operator: string;
  brand: string;
  stationType: string;
  address: string;
  city: string;
  province: 'NA' | 'SA' | 'CE' | 'AV' | 'BN' | string;
  latitude: number;
  longitude: number;
  prices: FuelPrice[];
  minPrice: number;
  hasUnder2Euro: boolean;
  bestPriceUnder2?: FuelPrice;
  isPriceCapBrand?: boolean;
  distanceKm?: number;
  // true se le coordinate MIMIT erano lontane dalla provincia dichiarata e sono state scartate
  coordsRejected?: boolean;
}

export interface FuelStats {
  totalStationsCampania: number;
  stationsUnder2Euro: number;
  minPriceBenzinaSelf?: number;
  minPriceGasolioSelf?: number;
  minPriceGpl?: number;
  minPriceMetano?: number;
  avgPriceBenzinaSelf: number;
  avgPriceGasolioSelf: number;
  byProvince: {
    [key: string]: {
      total: number;
      under2Euro: number;
      minBenzina?: number;
      minGasolio?: number;
    };
  };
  lastDataExtraction: string;
  cachedAt: string;
}

export type ActiveDataSource =
  | 'PRIMARY_OSSERVAPREZZI_API'
  | 'SECONDARY_MIMIT_CSV_FALLBACK'
  | 'MEMORY_CACHE';

export interface FuelApiResponse {
  success: boolean;
  data: GasStation[];
  stats: FuelStats;
  totalFiltered: number;
  searchFeedback?: {
    matchingWithoutPriceCapCount: number;
    minPriceFound?: number;
  };
  meta: {
    region: 'Campania';
    provinces: string[];
    source: string;
    activeSource: ActiveDataSource;
    primarySource: string;
    secondarySource: string;
    primaryEndpoint: string;
    secondaryEndpoint: string;
    ttlMinutes: number;
  };
}
