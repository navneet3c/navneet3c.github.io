import { useMemo } from 'preact/hooks';
import { CATEGORIES, DINING_CATEGORIES, db, getSetting, setSetting } from '../db/schema.js';
import { useLiveQuery } from '../core/store.js';
import { formatCategory } from './categorize.js';

export { formatCategory };

export const SUPPLY_CATEGORIES_KEY = 'customSupplyCategories';
export const BILL_CATEGORIES_KEY = 'customBillCategories';
export const DINING_CATEGORIES_KEY = 'customDiningCategories';
export const SUPPLY_DELETED_CATEGORIES_KEY = 'deletedSupplyCategories';
export const BILL_DELETED_CATEGORIES_KEY = 'deletedBillCategories';
export const DINING_DELETED_CATEGORIES_KEY = 'deletedDiningCategories';

export const DEFAULT_BILL_CATEGORIES = [
  'utilities',
  'rent',
  'subscription',
  'insurance',
  'loan',
  'internet',
  'mobile',
  'other',
];

export function normalizeCategoryId(input) {
  const id = (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return id || null;
}

export function mergeCategoryLists(defaults, custom = [], inUse = [], deleted = []) {
  const hidden = new Set(deleted);
  const seen = new Set();
  const out = [];
  const push = (id) => {
    if (!id || id === 'other' || seen.has(id) || hidden.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  for (const d of defaults) push(d);
  for (const c of [...custom].sort()) push(c);
  for (const u of inUse) push(u);
  if (!seen.has('other')) out.push('other');
  return out;
}

async function readCustom(key) {
  const v = await getSetting(key, []);
  return Array.isArray(v) ? v : [];
}

export async function addCustomCategory(key, label, builtIn, deletedKey) {
  const id = normalizeCategoryId(label);
  if (!id) throw new Error('Enter a category name');
  if (id === 'other') throw new Error('That category already exists');
  const custom = await readCustom(key);
  if (custom.includes(id)) throw new Error('Category already exists');

  if (deletedKey) {
    const deleted = await readCustom(deletedKey);
    if (deleted.includes(id)) {
      await setSetting(
        deletedKey,
        deleted.filter((c) => c !== id),
      );
      return id;
    }
  }

  if (builtIn.includes(id)) throw new Error('That category already exists');
  await setSetting(key, [...custom, id]);
  return id;
}

/** Reassign rows to other, drop from custom list, hide from pickers (incl. built-ins). */
export async function deleteCategoryAndReassign(storeName, id, { settingsKey, deletedKey }) {
  if (!id || id === 'other') throw new Error('Cannot delete Other');

  await db[storeName].where('category').equals(id).modify({ category: 'other' });

  const custom = await readCustom(settingsKey);
  if (custom.includes(id)) {
    await setSetting(
      settingsKey,
      custom.filter((c) => c !== id),
    );
  }

  const deleted = await readCustom(deletedKey);
  if (!deleted.includes(id)) {
    await setSetting(deletedKey, [...deleted, id].sort());
  }
}

export function useSupplyCategories() {
  const { data: custom = [] } = useLiveQuery(
    () =>
      getSetting(SUPPLY_CATEGORIES_KEY, []).then((v) => (Array.isArray(v) ? v : [])),
    [],
  );

  const { data: deleted = [] } = useLiveQuery(
    () =>
      getSetting(SUPPLY_DELETED_CATEGORIES_KEY, []).then((v) => (Array.isArray(v) ? v : [])),
    [],
  );

  const { data: inUse = [] } = useLiveQuery(
    () => db.supplies.orderBy('category').uniqueKeys(),
    [],
  );

  const categories = useMemo(
    () => mergeCategoryLists(CATEGORIES, custom, inUse, deleted),
    [custom, inUse, deleted],
  );

  return {
    categories,
    custom,
    addCategory: (label) =>
      addCustomCategory(SUPPLY_CATEGORIES_KEY, label, CATEGORIES, SUPPLY_DELETED_CATEGORIES_KEY),
    removeCategory: (id) =>
      deleteCategoryAndReassign('supplies', id, {
        settingsKey: SUPPLY_CATEGORIES_KEY,
        deletedKey: SUPPLY_DELETED_CATEGORIES_KEY,
      }),
  };
}

export function useBillCategories(bills = []) {
  const { data: custom = [] } = useLiveQuery(
    () =>
      getSetting(BILL_CATEGORIES_KEY, []).then((v) => (Array.isArray(v) ? v : [])),
    [],
  );

  const { data: deleted = [] } = useLiveQuery(
    () =>
      getSetting(BILL_DELETED_CATEGORIES_KEY, []).then((v) => (Array.isArray(v) ? v : [])),
    [],
  );

  const categories = useMemo(() => {
    const inUse = bills.map((b) => b.category).filter(Boolean);
    return mergeCategoryLists(DEFAULT_BILL_CATEGORIES, custom, inUse, deleted);
  }, [custom, bills, deleted]);

  return {
    categories,
    custom,
    addCategory: (label) =>
      addCustomCategory(
        BILL_CATEGORIES_KEY,
        label,
        DEFAULT_BILL_CATEGORIES,
        BILL_DELETED_CATEGORIES_KEY,
      ),
    removeCategory: (id) =>
      deleteCategoryAndReassign('bills', id, {
        settingsKey: BILL_CATEGORIES_KEY,
        deletedKey: BILL_DELETED_CATEGORIES_KEY,
      }),
  };
}

export function useDiningCategories() {
  const { data: custom = [] } = useLiveQuery(
    () =>
      getSetting(DINING_CATEGORIES_KEY, []).then((v) => (Array.isArray(v) ? v : [])),
    [],
  );

  const { data: deleted = [] } = useLiveQuery(
    () =>
      getSetting(DINING_DELETED_CATEGORIES_KEY, []).then((v) => (Array.isArray(v) ? v : [])),
    [],
  );

  const { data: inUse = [] } = useLiveQuery(
    () => db.dining.orderBy('category').uniqueKeys(),
    [],
  );

  const categories = useMemo(
    () => mergeCategoryLists(DINING_CATEGORIES, custom, inUse, deleted),
    [custom, inUse, deleted],
  );

  return {
    categories,
    custom,
    addCategory: (label) =>
      addCustomCategory(
        DINING_CATEGORIES_KEY,
        label,
        DINING_CATEGORIES,
        DINING_DELETED_CATEGORIES_KEY,
      ),
    removeCategory: (id) =>
      deleteCategoryAndReassign('dining', id, {
        settingsKey: DINING_CATEGORIES_KEY,
        deletedKey: DINING_DELETED_CATEGORIES_KEY,
      }),
  };
}
