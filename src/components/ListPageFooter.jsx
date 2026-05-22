import { formatCategory } from '../lib/categorize.js';

export function ListPageFooter({
  shown,
  total,
  dateLabel,
  categoryFilter,
  hasMore,
  onLoadMore,
}) {
  return (
    <>
      {total > 0 && (
        <p class="list-summary">
          Showing {shown} of {total} · <strong>{dateLabel}</strong>
          {categoryFilter && categoryFilter !== 'all'
            ? ` · ${formatCategory(categoryFilter)}`
            : ''}
        </p>
      )}
      {hasMore && (
        <button type="button" class="btn btn-ghost load-more" onClick={onLoadMore}>
          Load more ({total - shown} remaining)
        </button>
      )}
    </>
  );
}
