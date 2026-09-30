import { NextRequest, NextResponse } from 'next/server';
import { fetchCampaniaFuelData, isPenisolaSorrentina } from '@/lib/mimit-fetcher';
import { GasStation } from '@/types/fuel';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provincia = searchParams.get('provincia') || 'all';
    const carburante = searchParams.get('carburante') || 'all';
    const brand = searchParams.get('brand') || 'all';
    const onlyUnder2 = searchParams.get('onlyUnder2') !== 'false'; // default true to highlight price cap
    const onlySelf = searchParams.get('onlySelf') === 'true';
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Fetch live MIMIT data for Campania (15 min cache)
    const { stations, stats } = await fetchCampaniaFuelData(forceRefresh);

    let filtered: GasStation[] = stations;

    // Filter by Province or Penisola Sorrentina
    if (provincia === 'PENISOLA_SORRENTINA') {
      filtered = filtered.filter((s) => isPenisolaSorrentina(s.city));
    } else if (provincia !== 'all') {
      const pUpper = provincia.toUpperCase();
      filtered = filtered.filter((s) => s.province === pUpper);
    }

    // Filter by Brand
    if (brand !== 'all') {
      const bUpper = brand.toLowerCase();
      filtered = filtered.filter((s) => s.brand.toLowerCase().includes(bUpper));
    }

    // Filter by Search Query (name, address, city, operator, mimitId)
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.city.toLowerCase().includes(search) ||
          s.address.toLowerCase().includes(search) ||
          s.operator.toLowerCase().includes(search) ||
          (s.mimitId && s.mimitId.includes(search))
      );
    }

    // Filter by Fuel Type and Under 2 Euro condition
    filtered = filtered
      .map((station) => {
        let matchingPrices = station.prices;

        if (carburante !== 'all') {
          matchingPrices = matchingPrices.filter((p) => p.fuelType === carburante);
        }

        if (onlySelf) {
          matchingPrices = matchingPrices.filter((p) => p.isSelf);
        }

        if (onlyUnder2) {
          matchingPrices = matchingPrices.filter((p) => p.price < 2.00);
        }

        if (matchingPrices.length === 0) {
          return null;
        }

        // Recalculate minPrice for this filtered view
        const validMin = Math.min(...matchingPrices.map((p) => p.price));

        return {
          ...station,
          prices: matchingPrices,
          minPrice: validMin < 999 ? validMin : station.minPrice,
        };
      })
      .filter((s): s is GasStation => s !== null);

    // Sort by min price ascending
    filtered.sort((a, b) => a.minPrice - b.minPrice);

    return NextResponse.json(
      {
        success: true,
        data: filtered,
        stats,
        totalFiltered: filtered.length,
        meta: {
          region: 'Campania',
          provinces: ['NA', 'SA', 'CE', 'AV', 'BN'],
          source: 'MIMIT Open Data',
          ttlMinutes: 15,
        },
      },
      {
        headers: {
          'Cache-Control': 's-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
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
