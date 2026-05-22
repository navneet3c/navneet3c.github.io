export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function joinSubline(parts) {
  return parts.filter(Boolean).join(' · ');
}
