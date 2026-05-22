import { useState, useMemo } from 'preact/hooks';
import { rangeFromPreset, rangeFromCustom, describeDateRange } from './dateRange.js';

export function useDateRangeFilter(initialPreset = '7') {
  const [datePreset, setDatePreset] = useState(initialPreset);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') return rangeFromCustom(customFrom, customTo);
    return rangeFromPreset(datePreset);
  }, [datePreset, customFrom, customTo]);

  const dateLabel = useMemo(
    () =>
      describeDateRange({
        preset: datePreset,
        customFrom,
        customTo,
        ...dateRange,
      }),
    [datePreset, customFrom, customTo, dateRange],
  );

  return {
    datePreset,
    setDatePreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateRange,
    dateLabel,
  };
}
