export const DATE_FILTER_PRESETS = [
  { id: 'all', label: 'All' },
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: '60', label: '60d' },
  { id: '90', label: '90d' },
  { id: 'custom', label: 'Range' },
];

/** ISO bounds for date filters (strings compare lexicographically). */
export function endOfDayIso(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function startOfDayIso(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function rangeFromPreset(preset) {
  if (!preset || preset === 'all') return { from: null, to: null };
  const days = parseInt(preset, 10);
  if (!days || days <= 0) return { from: null, to: null };

  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function rangeFromCustom(fromDate, toDate) {
  return {
    from: fromDate ? startOfDayIso(fromDate) : null,
    to: toDate ? endOfDayIso(toDate) : null,
  };
}

export function describeDateRange({ from, to, preset, customFrom, customTo }) {
  if (preset === 'all' && !from && !to) return 'All time';
  if (preset === 'custom') {
    if (customFrom && customTo) return `${formatShort(customFrom)} – ${formatShort(customTo)}`;
    if (customFrom) return `From ${formatShort(customFrom)}`;
    if (customTo) return `Until ${formatShort(customTo)}`;
    return 'Custom range';
  }
  if (preset) return `Last ${preset} days`;
  return 'Filtered';
}

function formatShort(isoOrDate) {
  const d = new Date(isoOrDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDueLabel(dueDate, daysUntil) {
  let days = daysUntil;
  if (days == null && dueDate) {
    const d = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    days = Math.round((d - today) / 86400000);
  }
  if (days == null) return '';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
