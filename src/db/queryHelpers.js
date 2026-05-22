import Dexie from 'dexie';

export function boundsKeys(from, to) {
  return {
    fromKey: from || Dexie.minKey,
    toKey: to || Dexie.maxKey,
  };
}

/** Dexie page fetch: optional category+date compound index, else date-only or full table. */
export async function fetchDatedCategoryPage(
  table,
  { compoundIndex, dateField },
  { category = 'all', limit = 100, offset = 0, from = null, to = null } = {},
  mapRow = (row) => row,
) {
  const { fromKey, toKey } = boundsKeys(from, to);
  let rows;

  if (category && category !== 'all') {
    rows = await table
      .where(compoundIndex)
      .between([category, fromKey], [category, toKey])
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  } else if (from || to) {
    rows = await table
      .where(dateField)
      .between(fromKey, toKey)
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  } else {
    rows = await table.orderBy(dateField).reverse().offset(offset).limit(limit).toArray();
  }

  return rows.map(mapRow);
}

export async function countDatedCategory(
  table,
  { compoundIndex, dateField },
  { category = 'all', from = null, to = null } = {},
) {
  const { fromKey, toKey } = boundsKeys(from, to);

  if (category && category !== 'all') {
    return table
      .where(compoundIndex)
      .between([category, fromKey], [category, toKey])
      .count();
  }
  if (from || to) {
    return table.where(dateField).between(fromKey, toKey).count();
  }
  return table.count();
}
