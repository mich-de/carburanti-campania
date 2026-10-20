// Confini di regione e province (ISTAT, 1 gennaio 2026, via geojson-italy, CC BY 4.0), semplificati a 100 m.
// Il file è nel repository: nessuna chiamata di rete in più (regola di testo.txt)
import confini from '@/data/campania-confini.json';

type Ring = number[][];
type PolygonCoords = Ring[];

interface BoundaryFeature {
  properties: { livello: string; prov_acr?: string };
  geometry: { type: string; coordinates: unknown };
}

const toPolygons = (geometry: BoundaryFeature['geometry']): PolygonCoords[] =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates as PolygonCoords]
    : geometry.type === 'MultiPolygon'
    ? (geometry.coordinates as PolygonCoords[])
    : [];

const PROVINCE_POLYGONS: Record<string, PolygonCoords[]> = {};
for (const f of (confini as { features: BoundaryFeature[] }).features) {
  if (f.properties.livello === 'provincia' && f.properties.prov_acr) {
    PROVINCE_POLYGONS[f.properties.prov_acr] = toPolygons(f.geometry);
  }
}

const inRing = (x: number, y: number, ring: Ring): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const inPolygons = (x: number, y: number, polygons: PolygonCoords[]): boolean =>
  polygons.some(([outer, ...holes]) => inRing(x, y, outer) && !holes.some((h) => inRing(x, y, h)));

// Distanza approssimata in km dal punto al segmento (proiezione equirettangolare: va bene per pochi km)
const segmentDistanceKm = (x: number, y: number, ax: number, ay: number, bx: number, by: number): number => {
  const k = Math.cos((y * Math.PI) / 180);
  const px = (x - ax) * k;
  const py = y - ay;
  const dx = (bx - ax) * k;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - t * dx, py - t * dy) * 111.32;
};

// Distanza in km del punto dalla provincia indicata: 0 se è dentro, null se la provincia non è campana
export const distanceFromProvinceKm = (lat: number, lng: number, provAcr: string): number | null => {
  const polygons = PROVINCE_POLYGONS[provAcr];
  if (!polygons) return null;
  if (inPolygons(lng, lat, polygons)) return 0;
  let best = Infinity;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 1; i < ring.length; i++) {
        const d = segmentDistanceKm(lng, lat, ring[i - 1][0], ring[i - 1][1], ring[i][0], ring[i][1]);
        if (d < best) best = d;
      }
    }
  }
  return best;
};
