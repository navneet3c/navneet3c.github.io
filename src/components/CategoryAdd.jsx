import { useState } from 'preact/hooks';
import { formatCategory } from '../lib/categorize.js';
import { ActionButton } from './ActionButton.jsx';

export function CategoryAdd({ categories = [], onRemove }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const manageable = categories.filter((c) => c !== 'other');

  const handleRemove = async (id) => {
    if (
      !confirm(
        `Delete "${formatCategory(id)}"? All entries in this category will move to Other.`,
      )
    ) {
      return;
    }
    setError('');
    try {
      await onRemove(id);
    } catch (e) {
      setError(e.message);
    }
  };

  if (manageable.length === 0) return null;

  return (
    <div class={`category-add${editing ? ' category-add-editing' : ''}`}>
      <div class="category-add-toolbar">
        <button
          type="button"
          class="btn btn-ghost"
          style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
          onClick={() => {
            setEditing(!editing);
            setError('');
          }}
        >
          {editing ? 'Done' : 'Edit Categories'}
        </button>
      </div>
      {error && <p class="category-add-error">{error}</p>}
      {editing && (
        <div class="category-custom-list">
          {manageable.map((c) => (
            <span key={c} class="chip">
              {formatCategory(c)}
              <ActionButton
                class="chip-remove action-btn-chip"
                label={`Delete ${formatCategory(c)}`}
                onClick={() => handleRemove(c)}
              >
                ×
              </ActionButton>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
