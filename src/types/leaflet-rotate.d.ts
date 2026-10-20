// Il plugin leaflet-rotate aggiunge opzioni e metodi a L.Map, ma non porta i tipi: li dichiariamo qui
import 'leaflet';

declare module 'leaflet' {
  interface MapOptions {
    rotate?: boolean;
    bearing?: number;
    touchRotate?: boolean;
    shiftKeyRotate?: boolean;
    rotateControl?: boolean | object;
  }

  interface Map {
    setBearing(theta: number): this;
    getBearing(): number;
  }
}

export {};
