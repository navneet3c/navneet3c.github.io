import { groupKey } from './patterns.js';
import { suggestCategoryAndEmoji, guessEmoji } from './categorize.js';
import { normalizeText } from './text.js';

const MAX_PRICE_HISTORY = 8;

export function buildSuggestionIndex(supplies) {
  const byKey = new Map();
  const prefixBuckets = new Map();

  for (const s of supplies) {
    const key = groupKey(s);
    if (!key) continue;

    if (!byKey.has(key)) {
      byKey.set(key, { latest: s, latestTime: 0, purchases: [], priceBySize: new Map() });
    }
    const profile = byKey.get(key);
    const t = new Date(s.purchasedAt).getTime();
    if (t >= profile.latestTime) {
      profile.latest = s;
      profile.latestTime = t;
    }

    if (profile.purchases.length < MAX_PRICE_HISTORY) {
      profile.purchases.push(s);
    }

    const sizeNorm = normalizeText(s.size);
    if (sizeNorm && s.price != null && s.price > 0) {
      profile.priceBySize.set(sizeNorm, Number(s.price));
    }

    const prefix = normalizeText(s.name).slice(0, 2);
    if (prefix) {
      if (!prefixBuckets.has(prefix)) prefixBuckets.set(prefix, new Set());
      prefixBuckets.get(prefix).add(key);
    }
  }

  const items = [...byKey.entries()]
    .map(([key, profile]) => ({
      key,
      label: profile.latest.brand
        ? `${profile.latest.name} · ${profile.latest.brand}`
        : profile.latest.name,
      name: profile.latest.name,
      brand: profile.latest.brand || '',
      profile,
      sortTime: profile.latestTime,
    }))
    .sort((a, b) => b.sortTime - a.sortTime);

  return { byKey, items, prefixBuckets };
}

function profileToItem(key, profile) {
  return {
    key,
    label: profile.latest.brand
      ? `${profile.latest.name} · ${profile.latest.brand}`
      : profile.latest.name,
    name: profile.latest.name,
    brand: profile.latest.brand || '',
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

export function searchItemSuggestions(index, query, limit = 8) {
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

/** Brands used on any item (not limited to the current product name). */
export function searchAllBrandSuggestions(index, query, limit = 8) {
  const q = normalizeText(query);
  if (!index) return [];

  const byBrand = new Map();
  for (const [, profile] of index.byKey) {
    const brand = profile.latest.brand?.trim();
    if (!brand) continue;
    const brandNorm = normalizeText(brand);
    const existing = byBrand.get(brandNorm);
    if (!existing || profile.latestTime > existing.sortTime) {
      byBrand.set(brandNorm, {
        brand,
        sortTime: profile.latestTime,
        lastItemName: profile.latest.name,
        profile,
      });
    }
  }

  const out = [];
  for (const row of byBrand.values()) {
    const brandNorm = normalizeText(row.brand);
    let score = 40;
    if (!q) score = 50;
    else if (brandNorm === q) score = 100;
    else if (brandNorm.startsWith(q)) score = 85;
    else if (brandNorm.includes(q)) score = 60;
    else continue;
    out.push({ ...row, score });
  }

  return out
    .sort((a, b) => b.score - a.score || b.sortTime - a.sortTime)
    .slice(0, limit);
}

function findProfile(index, name, brand) {
  if (!index || !normalizeText(name)) return null;

  const n = normalizeText(name);
  const b = normalizeText(brand);
  const exactKey = b ? `${n}|${b}` : n;

  if (index.byKey.has(exactKey)) return index.byKey.get(exactKey);

  if (!b) {
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

export function priceForSize(profile, size) {
  if (!profile) return null;
  const sizeNorm = normalizeText(size);
  if (sizeNorm && profile.priceBySize?.has(sizeNorm)) {
    return profile.priceBySize.get(sizeNorm);
  }
  const latest = profile.latest;
  if (latest?.price != null && latest.price > 0) return Number(latest.price);
  return null;
}

export function getSupplyHints(index, name, brand, size = '') {
  const keyword = suggestCategoryAndEmoji(name, brand);
  const profile = findProfile(index, name, brand);

  const historyCategory = profile?.latest?.category;
  const historyEmoji = profile?.latest?.emoji;
  const historySize = profile?.latest?.size;
  const historyPrice = priceForSize(profile, size || historySize || '');

  const category = historyCategory || keyword.category;
  const emoji = historyEmoji || guessEmoji(name, brand, category);

  return {
    category,
    emoji,
    size: historySize || '',
    price: historyPrice,
    fromHistory: Boolean(profile),
    keywordCategory: keyword.category,
    keywordEmoji: keyword.emoji,
    profile,
  };
}

export function emojiChoicesForItem(name, brand, category) {
  const seen = new Set();
  const out = [];
  const add = (e) => {
    if (e && !seen.has(e)) {
      seen.add(e);
      out.push(e);
    }
  };
  add(guessEmoji(name, brand, category));
  add('📦');
  add('🛒');
  add('🏷️');
  add('✨');
  return out.slice(0, 5);
}
