import { useState } from 'preact/hooks';
import { formatCategory } from '../lib/categorize.js';
import { ActionButton } from './ActionButton.jsx';

const NEW_CATEGORY = '__new__';

export function CategorySelect({
  categories,
  value,
  onChange,
  onAddCategory,
  className = 'inline-field',
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const commitNew = async () => {
    setError('');
    try {
      const id = await onAddCategory(label);
      onChange(id);
      setLabel('');
      setAdding(false);
    } catch (e) {
      setError(e.message);
    }
  };

  if (adding) {
    return (
      <div class="category-inline-new">
        <input
          class={className}
          type="text"
          placeholder="Category name"
          value={label}
          onInput={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitNew();
            }
            if (e.key === 'Escape') {
              setAdding(false);
              setLabel('');
              setError('');
            }
          }}
          autoFocus
          autocomplete="off"
        />
        <ActionButton class="btn btn-ghost btn-icon" label="Save category" onClick={commitNew}>
          ✓
        </ActionButton>
        <ActionButton
          class="btn btn-ghost btn-icon"
          label="Cancel"
          onClick={() => {
            setAdding(false);
            setLabel('');
            setError('');
          }}
        >
          ✕
        </ActionButton>
        {error && <span class="category-inline-error">{error}</span>}
      </div>
    );
  }

  return (
    <select
      class={className}
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW_CATEGORY) {
          setAdding(true);
          return;
        }
        onChange(e.target.value);
      }}
      title="Category"
    >
      {categories.map((c) => (
        <option key={c} value={c}>
          {formatCategory(c)}
        </option>
      ))}
      <option value={NEW_CATEGORY}>+ New category…</option>
    </select>
  );
}
