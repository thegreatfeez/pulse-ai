import { useState, useEffect, useRef } from 'react';
import { PROXY_API } from '../config';

export default function useSolPrice() {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef({ price: null, ts: 0 });

  useEffect(() => {
    let cancelled = false;

    const fetchPrice = async () => {
      const now = Date.now();
      if (cacheRef.current.price && now - cacheRef.current.ts < 30000) {
        setPrice(cacheRef.current.price);
        setLoading(false);
        return;
      }

      try {
        const url = PROXY_API('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true');
        const res = await fetch(url);
        if (!res.ok) throw new Error('Price fetch failed');
        const data = await res.json();

        if (!cancelled && data.solana) {
          const p = {
            usd: data.solana.usd,
            change24h: data.solana.usd_24h_change || 0,
          };
          cacheRef.current = { price: p, ts: now };
          setPrice(p);
        }
      } catch (err) {
        console.warn('[useSolPrice]', err.message);
      }
      if (!cancelled) setLoading(false);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { price, loading };
}
