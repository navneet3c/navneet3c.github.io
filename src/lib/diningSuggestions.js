import { pairGroupKey } from './patterns.js';
import { normalizeText } from './text.js';

const MAX_HISTORY = 8;

const CATEGORY_EMOJI = {
  breakfast: '🥐',
  dine_in: '🍽️',
  snacks: '🍿',
  travel: '✈️',
  other: '🍴',
};

const KEYWORD_RULES = [
  {
    category: 'breakfast',
    keywords: ['breakfast', 'coffee', 'cafe', 'tea', 'cereal', 'toast', 'pancake', 'omelette', 'bagel'],
  },
  {
    category: 'dine_in',
    keywords: ['restaurant', 'dine', 'lunch', 'dinner', 'biryani', 'pizza', 'burger', 'thali', 'buffet'],
  },
  {
    category: 'snacks',
    keywords: ['snack', 'chips', 'cookie', 'biscuit', 'ice cream', 'soda', 'juice', 'samosa', 'chai'],
  },
  {
    category: 'travel',
    keywords: ['airport', 'flight', 'train', 'station', 'highway', 'road trip', 'travel', 'hotel meal'],
  },
];

function diningGroupKey(item) {
  return pairGroupKey(item.name, item.location);
}

export function guessDiningCategory(name, location = '') {
  const text = `${name} ${location}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.category;
  }
  return 'other';
}

export function guessDiningEmoji(name, location, category) {
  const cat = category || guessDiningCategory(name, location);
  return CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.other;
}

export function buildDiningSuggestionIndex(entries) {
  const byKey = new Map();
  const prefixBuckets = new Map();
  const locations = new Map();

  for (const row of entries) {
    const key = diningGroupKey(row);
    if (!key) continue;

    if (!byKey.has(key)) {
      byKey.set(key, { latest: row, latestTime: 0, purchases: [] });
    }
    const profile = byKey.get(key);
    const t = new Date(row.spentAt).getTime();
    if (t >= profile.latestTime) {
      profile.latest = row;
      profile.latestTime = t;
    }
    if (profile.purchases.length < MAX_HISTORY) profile.purchases.push(row);

    const prefix = normalizeText(row.name).slice(0, 2);
    if (prefix) {
      if (!prefixBuckets.has(prefix)) prefixBuckets.set(prefix, new Set());
      prefixBuckets.get(prefix).add(key);
    }

    const loc = row.location?.trim();
    if (loc) {
      const locNorm = normalizeText(loc);
      const existing = locations.get(locNorm);
      if (!existing || t > existing.sortTime) {
        locations.set(locNorm, { location: loc, sortTime: t, lastName: row.name });
      }
    }
  }

  const items = [...byKey.entries()]
    .map(([key, profile]) => ({
      key,
      label: profile.latest.location
        ? `${profile.latest.name} · ${profile.latest.location}`
        : profile.latest.name,
      name: profile.latest.name,
      location: profile.latest.location || '',
      profile,
      sortTime: profile.latestTime,
    }))
    .sort((a, b) => b.sortTime - a.sortTime);

  const locationItems = [...locations.values()].sort((a, b) => b.sortTime - a.sortTime);

  return { byKey, items, prefixBuckets, locationItems };
}

function profileToItem(key, profile) {
  const latest = profile.latest;
  return {
    key,
    label: latest.location ? `${latest.name} · ${latest.location}` : latest.name,
    name: latest.name,
    location: latest.location || '',
    profile,
    sortTime: profile.latestTime,
  };
}

function candidateItems(index, query) {
  const q = normalizeText(query);
  if (!q) return index.items.slice(0, 48);
  const prefix = q.slice(0, 2);
  const keys = index.prefixBuckets?.get(prefix);
  if (keys?.size) {
    const out = [];
    for (const key of keys) {
      const profile = index.byKey.get(key);
      if (profile) out.push(profileToItem(key, profile));
    }
    return out;
  }
  return index.items;
}

export function searchDiningNameSuggestions(index, query, limit = 8) {
  const q = normalizeText(query);
  if (!index) return [];

  const pool = q ? candidateItems(index, q) : index.items;
  const scored = [];

  for (const item of pool) {
    const nameNorm = normalizeText(item.name);
    const labelNorm = normalizeText(item.label);
    let score = 0;
    if (!q) score = 1;
    else if (nameNorm === q) score = 100;
    else if (nameNorm.startsWith(q)) score = 80 - (nameNorm.length - q.length);
    else if (labelNorm.includes(q)) score = 50;
    else if (nameNorm.includes(q)) score = 40;
    if (score > 0) scored.push({ ...item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.sortTime - a.sortTime)
    .slice(0, limit);
}

export function searchLocationSuggestions(index, query, limit = 8) {
  const q = normalizeText(query);
  if (!index?.locationItems) return [];

  const out = [];
  for (const row of index.locationItems) {
    const locNorm = normalizeText(row.location);
    let score = 40;
    if (!q) score = 50;
    else if (locNorm === q) score = 100;
    else if (locNorm.startsWith(q)) score = 85;
    else if (locNorm.includes(q)) score = 60;
    else continue;
    out.push({ ...row, score });
  }

  return out
    .sort((a, b) => b.score - a.score || b.sortTime - a.sortTime)
    .slice(0, limit);
}

function findProfile(index, name, location) {
  if (!index || !normalizeText(name)) return null;

  const n = normalizeText(name);
  const loc = normalizeText(location);
  const exactKey = loc ? `${n}|${loc}` : n;

  if (index.byKey.has(exactKey)) return index.byKey.get(exactKey);

  if (!loc) {
    let best = null;
    for (const [key, profile] of index.byKey) {
      const keyName = key.split('|')[0];
      if (keyName !== n) continue;
      if (!best || profile.latestTime > best.latestTime) best = profile;
    }
    if (best) return best;
  }

  return null;
}

export function getDiningHints(index, name, location = '') {
  const profile = findProfile(index, name, location);
  const keywordCategory = guessDiningCategory(name, location);

  const historyCategory = profile?.latest?.category;
  const historyLocation = profile?.latest?.location;
  const historyEmoji = profile?.latest?.emoji;
  const historyCost =
    profile?.latest?.cost != null && profile.latest.cost > 0
      ? Number(profile.latest.cost)
      : null;

  const category = historyCategory || keywordCategory;
  const emoji = historyEmoji || guessDiningEmoji(name, location, category);

  return {
    category,
    location: historyLocation || '',
    emoji,
    cost: historyCost,
    fromHistory: Boolean(profile),
    keywordCategory,
    profile,
  };
}

export function emojiChoicesForDining(name, location, category) {
  const seen = new Set();
  const out = [];
  const add = (e) => {
    if (e && !seen.has(e)) {
      seen.add(e);
      out.push(e);
    }
  };
  add(guessDiningEmoji(name, location, category));
  add('🍽️');
  add('☕');
  add('🥡');
  add('✨');
  return out.slice(0, 5);
}
