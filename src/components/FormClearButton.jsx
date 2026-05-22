export function FormClearButton({ onClick, disabled = false }) {
  return (
    <button type="button" class="btn btn-ghost btn-form-clear" onClick={onClick} disabled={disabled}>
      Clear
    </button>
  );
}
