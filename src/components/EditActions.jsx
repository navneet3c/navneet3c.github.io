export function EditActions({ onSave, onCancel }) {
  return (
    <div class="supply-edit-actions">
      <button type="button" class="btn btn-primary" onClick={onSave}>
        Save
      </button>
      <button type="button" class="btn btn-ghost" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
