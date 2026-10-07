import { useCallback, useEffect, useRef, useState } from 'react';

// Loads data with fn(); gives { data, error, loading, reload }. deps re-run the load.
export function useApiData(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const reqId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current();
      if (id === reqId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === reqId.current) setState({ data: null, error, loading: false });
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}
