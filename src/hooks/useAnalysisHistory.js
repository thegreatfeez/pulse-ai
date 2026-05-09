import { useState, useEffect, useCallback, useRef } from 'react';
const HISTORY_KEY = 'pulse_ai_analysis_history';

export default function useAnalysisHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef({ data: null, ts: 0 });

  const fetchHistory = useCallback(async () => {
    const now = Date.now();
    if (cacheRef.current.data && now - cacheRef.current.ts < 30000) {
      setHistory(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const data = raw ? JSON.parse(raw) : [];
      cacheRef.current = { data, ts: now };
      setHistory(data);
    } catch (error) {
      console.warn('[useAnalysisHistory]', error?.message || error);
      setHistory([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refresh: fetchHistory };
}
