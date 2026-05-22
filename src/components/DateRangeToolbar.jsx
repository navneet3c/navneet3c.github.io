import { DATE_FILTER_PRESETS } from '../lib/dateRange.js';

export function DateRangeToolbar({
  datePreset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}) {
  return (
    <div class="filter-section">
      <span class="filter-label">Period</span>
      <div class="chip-row">
        {DATE_FILTER_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            class={`chip ${datePreset === p.id ? 'chip-accent' : ''}`}
            onClick={() => onPresetChange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {datePreset === 'custom' && (
        <div class="date-range-row">
          <label>
            <span class="date-range-label">From</span>
            <input type="date" value={customFrom} onInput={(e) => onCustomFromChange(e.target.value)} />
          </label>
          <label>
            <span class="date-range-label">To</span>
            <input type="date" value={customTo} onInput={(e) => onCustomToChange(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}
