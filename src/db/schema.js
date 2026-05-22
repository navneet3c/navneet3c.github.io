import Dexie from 'dexie';

export const CATEGORIES = [
  'grocery',
  'food',
  'cosmetics',
  'health',
  'household',
  'electronics',
  'other',
];

export const BILL_FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

export const DINING_CATEGORIES = ['breakfast', 'dine_in', 'snacks', 'travel', 'other'];

export const db = new Dexie('HomeRowDB');

db.version(1).stores({
  supplies: '++id, name, brand, category, purchasedAt, createdAt',
  bills: '++id, name, category, nextDue, active, createdAt',
  settings: 'key',
  meta: 'key',
});

db.version(2).stores({
  supplies: '++id, name, brand, category, purchasedAt, createdAt, [category+purchasedAt]',
  bills: '++id, name, category, nextDue, active, createdAt',
  settings: 'key',
  meta: 'key',
});

db.version(3).stores({
  supplies: '++id, name, brand, category, purchasedAt, createdAt, [category+purchasedAt]',
  bills: '++id, name, category, nextDue, active, createdAt',
  dining: '++id, name, location, category, spentAt, createdAt, [category+spentAt]',
  settings: 'key',
  meta: 'key',
});

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key);
  return row?.value ?? fallback;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
