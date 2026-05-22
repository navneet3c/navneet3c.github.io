import { useState, useEffect } from 'preact/hooks';
import { LIST_PAGE_SIZE } from './constants.js';

export function useListPagination(resetDeps = [], pageSize = LIST_PAGE_SIZE) {
  const [listLimit, setListLimit] = useState(pageSize);

  useEffect(() => {
    setListLimit(pageSize);
  }, resetDeps);

  return {
    listLimit,
    loadMore: () => setListLimit((n) => n + pageSize),
  };
}
