import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
    const { data, error } = await supabase
      .from('token_analysis')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('[useAnalysisHistory]', error.message);
    } else {
      cacheRef.current = { data: data || [], ts: now };
      setHistory(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refresh: fetchHistory };
}
