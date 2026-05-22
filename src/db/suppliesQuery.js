import { db } from './schema.js';
import { analyzeSupplyPatterns } from '../lib/patterns.js';
import { fetchDatedCategoryPage, countDatedCategory } from './queryHelpers.js';

const SUPPLY_QUERY = {
  compoundIndex: '[category+purchasedAt]',
  dateField: 'purchasedAt',
};

/** Strip image blobs from memory — list/analytics should use this. */
export function toSupplyLite(row) {
  if (!row) return row;
  const { imageBlob, ...lite } = row;
  return { ...lite, hasImage: Boolean(imageBlob) };
}

export async function fetchSuppliesPage(opts = {}) {
  return fetchDatedCategoryPage(db.supplies, SUPPLY_QUERY, opts, toSupplyLite);
}

export async function countSupplies(opts = {}) {
  return countDatedCategory(db.supplies, SUPPLY_QUERY, opts);
}

/** All rows without blobs in memory — for autocomplete / pattern index. */
export async function fetchAllSuppliesLite() {
  const lite = [];
  await db.supplies.each((row) => lite.push(toSupplyLite(row)));
  return lite;
}

/** Single pass stats for dashboard (no blob load into aggregate state). */
export async function fetchSupplyDashboardStats(horizonDays = 7) {
  const lite = [];
  let totalSpend = 0;

  await db.supplies.each((row) => {
    const item = toSupplyLite(row);
    lite.push(item);
    if (item.price != null && item.price > 0) totalSpend += Number(item.price);
  });

  const dueSoon = analyzeSupplyPatterns(lite, { horizonDays });
  return {
    count: lite.length,
    totalSpend,
    dueSoon: dueSoon.slice(0, 5),
  };
}
