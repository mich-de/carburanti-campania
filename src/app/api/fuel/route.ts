import { NextRequest, NextResponse } from 'next/server';
import { fetchCampaniaFuelData, isPenisolaSorrentina } from '@/lib/mimit-fetcher';
import { GasStation, FuelApiResponse } from '@/types/fuel';

export const dynamic = 'force-dynamic';

function matchesSearchQuery(s: GasStation, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const city = s.city.toLowerCase().trim();
  // Exact city match (e.g. "meta", "sorrento", "napoli")
  if (city === q) return true;

  // City word or prefix match (e.g. "meta" in "meta" or "piano di sorrento")
  const cityWords = city.split(/[\s'-]+/);
  if (cityWords.some((w) => w === q || (q.length >= 3 && w.startsWith(q)))) {
    return true;
  }

  // MIMIT ID match
  if (s.mimitId && s.mimitId.includes(q)) return true;

  // Address match
  if (s.address.toLowerCase().includes(q)) return true;

  // Operator match
  // If query is short (<= 4 chars like "meta"), do word boundary match
  const op = s.operator.toLowerCase();
  if (q.length <= 4 && q !== 'gpl' && q !== 'cng') {
    const opWords = op.split(/[\s\-_/.,'"]+/);
    if (opWords.some((w) => w === q || (w.startsWith(q) && !w.startsWith('metan')))) {
      return true;
    }
  } else {
    if (op.includes(q)) return true;
  }

  // Name match:
  // If query is short (<= 4 chars like "meta"), do word boundary match
  // so "meta" doesn't accidentally match "metano" or "metanauto"!
  const name = s.name.toLowerCase();
  if (q.length <= 4 && q !== 'gpl' && q !== 'cng') {
    const nameWords = name.split(/[\s\-_/.,'"]+/);
    if (nameWords.some((w) => w === q || (w.startsWith(q) && !w.startsWith('metan')))) {
      return true;
    }
  } else {
    if (name.includes(q)) return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provincia = searchParams.get('provincia') || 'all';
    const territorio = searchParams.get('territorio') || 'all'; // 'all' | 'penisola'
    const carburante = searchParams.get('carburante') || 'all';
    const brand = searchParams.get('brand') || 'all';
    const onlyUnder2 = searchParams.get('onlyUnder2') === 'true'; // Tutti i marchi < 2.00 € (incluse Pompe Bianche)
    // Default to true as requested: "di default tieni attivo Solo Self Service e Accordo Price Cap"
    const onlyPriceCap = searchParams.get('onlyPriceCap') !== 'false'; // Accordo Price Cap Grandi Reti (Eni, IP, Q8, Esso)
    // Default to true as explicitly requested by user ("di default metti solo Self-service")
    const onlySelf = searchParams.get('onlySelf') !== 'false';
    const search = (searchParams.get('search') || '').trim();
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Fetch live Campania fuel data via CampaniaGplDataSource (Primary API + Secondary CSV Fallback)
    const {
      stations,
      stats,
      activeSource,
      sourceDescription,
      primaryEndpoint,
      secondaryEndpoint,
    } = await fetchCampaniaFuelData(forceRefresh);

    let filtered: GasStation[] = stations;

    // Filter by Territorio (Penisola Sorrentina) or Province
    if (territorio === 'penisola' || provincia === 'PENISOLA_SORRENTINA') {
      filtered = filtered.filter((s) => isPenisolaSorrentina(s.city));
    } else if (provincia !== 'all') {
      const pUpper = provincia.toUpperCase();
      filtered = filtered.filter((s) => s.province === pUpper);
    }

    // Filter by Grandi Reti Aderenti Price Cap (Eni, IP, Q8, Esso) se non è selezionato "Tutti i marchi < 2€"
    if (onlyPriceCap && !onlyUnder2) {
      filtered = filtered.filter((s) => s.isPriceCapBrand);
    }

    // Filter by Brand
    if (brand !== 'all') {
      const bUpper = brand.toLowerCase();
      filtered = filtered.filter((s) => s.brand.toLowerCase().includes(bUpper));
    }

    // Filter by Smart Search Query (name, address, city, operator, mimitId)
    let searchMatchingAllStations: GasStation[] = [];
    if (search) {
      filtered = filtered.filter((s) => matchesSearchQuery(s, search));
      searchMatchingAllStations = [...filtered];
    }

    // Filter by Fuel Type, Self-Service and Under 2 Euro condition
    const mappedStations: GasStation[] = [];
    for (const station of filtered) {
      let matchingPrices = station.prices;

      if (carburante !== 'all') {
        matchingPrices = matchingPrices.filter((p) => p.fuelType === carburante);
      }

      if (onlySelf) {
        matchingPrices = matchingPrices.filter((p) => p.isSelf);
      }

      // Se è attivo Accordo Price Cap o Prezzo < 2.00 €, filtra solo i prezzi inferiori a 2.00 €
      if (onlyPriceCap || onlyUnder2) {
        matchingPrices = matchingPrices.filter((p) => p.price < 2.00);
      }

      if (matchingPrices.length === 0) {
        continue;
      }

      const validMin = Math.min(...matchingPrices.map((p) => p.price));
      const hasUnder2 = matchingPrices.some((p) => p.isUnder2Euro);
      const bestUnder2 = matchingPrices
        .filter((p) => p.isUnder2Euro)
        .sort((a, b) => a.price - b.price)[0];

      mappedStations.push({
        ...station,
        prices: matchingPrices,
        minPrice: validMin < 999 ? validMin : station.minPrice,
        hasUnder2Euro: hasUnder2,
        bestPriceUnder2: bestUnder2 || undefined,
      });
    }
    filtered = mappedStations;

    // Calculate feedback for search if results are empty because of price / self filter
    let searchFeedback: { matchingWithoutPriceCapCount: number; minPriceFound?: number } | undefined = undefined;
    if (search && filtered.length === 0 && searchMatchingAllStations.length > 0) {
      const allPrices = searchMatchingAllStations.flatMap((s) => s.prices.map((p) => p.price));
      const minAvailable = allPrices.length > 0 ? Math.min(...allPrices) : undefined;
      searchFeedback = {
        matchingWithoutPriceCapCount: searchMatchingAllStations.length,
        minPriceFound: minAvailable,
      };
    }

    // Sort by min price ascending
    filtered.sort((a, b) => a.minPrice - b.minPrice);

    const responsePayload: FuelApiResponse = {
      success: true,
      data: filtered,
      stats,
      totalFiltered: filtered.length,
      searchFeedback,
      meta: {
        region: 'Campania',
        provinces: ['NA', 'SA', 'CE', 'AV', 'BN'],
        source: sourceDescription,
        activeSource,
        primarySource: 'API Osservaprezzi Carburanti',
        secondarySource: 'Open Data MIMIT CSV',
        primaryEndpoint,
        secondaryEndpoint,
        ttlMinutes: 15,
      },
    };

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('API /api/fuel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Impossibile recuperare i dati dei carburanti per la Campania.',
      },
      { status: 500 }
    );
  }
}
