/** Icon control with a hover label (replaces native title tooltips). */
export function ActionButton({
  label,
  children,
  className = 'btn btn-ghost btn-icon',
  danger = false,
  tight = false,
  ...rest
}) {
  return (
    <button
      type="button"
      class={`action-btn ${className}${tight ? ' btn-icon-tight' : ''}${danger ? ' btn-icon-danger' : ''}`}
      aria-label={label}
      {...rest}
    >
      {children}
      <span class="action-btn-tip">{label}</span>
    </button>
  );
}
