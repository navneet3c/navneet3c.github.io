import { useEffect, useState } from 'preact/hooks';
import { liveQuery } from 'dexie';

export function useLiveQuery(querier, deps = []) {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const sub = liveQuery(querier).subscribe({
      next: (value) => {
        setData(value);
        setLoading(false);
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, deps);

  // Default only applies for undefined, not null — normalize here for safety.
  return { data: data ?? [], loading, error };
}
