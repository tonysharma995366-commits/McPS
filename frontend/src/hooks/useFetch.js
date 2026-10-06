import { useState, useEffect, useCallback, useRef } from "react";
import { API_URL } from "../lib/config.js";

export function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasData = useRef(false);

  const refetch = useCallback(async () => {
    if (!hasData.current) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      hasData.current = true;
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export default useFetch;
