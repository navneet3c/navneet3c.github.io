/**
 * Lightweight fuzzy match (subsequence + prefix/contains bonuses).
 * Returns 0 when query chars are not all found in order in text.
 */
export function fuzzyScore(query, text) {
  const q = (query || '').trim().toLowerCase();
  const t = (text || '').toLowerCase();
  if (!q) return 1;
  if (!t) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 850 - (t.length - q.length);
  if (t.includes(q)) return 650 - t.indexOf(q) * 3;

  let qi = 0;
  let score = 0;
  let streak = 0;

  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) {
      score += 12 + streak * 4;
      if (qi === 0 && i === 0) score += 8;
      streak++;
      qi++;
    } else {
      streak = 0;
    }
  }

  if (qi < q.length) return 0;
  return Math.max(1, score - (t.length - q.length) * 2);
}

/** Score a query against multiple fields; uses the best field score per token. */
export function fuzzyScoreQuery(query, fields) {
  const tokens = (query || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return 1;

  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of fields) {
      best = Math.max(best, fuzzyScore(token, field));
    }
    if (!best) return 0;
    total += best;
  }
  return total;
}
