import { useEffect, useState } from 'preact/hooks';
import { liveQuery } from 'dexie';

export function useLiveQuery(querier, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = liveQuery(querier).subscribe({
      next: (value) => {
        setData(value);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => sub.unsubscribe();
  }, deps);

  return { data, loading };
}
