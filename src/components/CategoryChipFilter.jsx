import { formatCategory } from '../lib/categorize.js';

export function CategoryChipFilter({ categories, filter, onFilter, children }) {
  return (
    <div class="filter-section">
      <span class="filter-label">Category</span>
      <div class="chip-row">
        <button
          type="button"
          class={`chip ${filter === 'all' ? 'chip-accent' : ''}`}
          onClick={() => onFilter('all')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            class={`chip ${filter === c ? 'chip-accent' : ''}`}
            onClick={() => onFilter(c)}
          >
            {formatCategory(c)}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
