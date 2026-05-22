export function QuickAddHintsPreview({ children, onApply }) {
  return (
    <div class="quick-add-preview">
      <span>{children}</span>
      <button type="button" class="btn btn-ghost btn-hint-apply" onClick={onApply}>
        Apply
      </button>
    </div>
  );
}
