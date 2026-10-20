import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Campania Carburanti Sotto i 2 Euro | Price Cap Eni, IP, Q8',
  description:
    'Monitoraggio in tempo reale dei prezzi carburanti sotto i 2 euro in Campania (Napoli, Salerno, Caserta, Avellino, Benevento). Dati ufficiali MIMIT conformi all\'accordo sul price cap.',
  keywords: [
    'prezzi carburanti campania',
    'benzina sotto 2 euro',
    'diesel campania sconti',
    'price cap eni ip q8',
    'osservaprezzi campania',
    'distributori napoli salerno caserta',
  ],
};

// Zoom lasciato attivo (niente maximumScale): chi ha bisogno di ingrandire il testo può farlo
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="antialiased text-slate-800 bg-slate-50 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
