import { db } from './schema.js';
import { fetchDatedCategoryPage, countDatedCategory } from './queryHelpers.js';

const DINING_QUERY = {
  compoundIndex: '[category+spentAt]',
  dateField: 'spentAt',
};

export function toDiningLite(row) {
  return row;
}

export async function fetchDiningPage(opts = {}) {
  return fetchDatedCategoryPage(db.dining, DINING_QUERY, opts, toDiningLite);
}

export async function countDining(opts = {}) {
  return countDatedCategory(db.dining, DINING_QUERY, opts);
}

export async function fetchAllDiningLite() {
  return db.dining.toArray();
}
