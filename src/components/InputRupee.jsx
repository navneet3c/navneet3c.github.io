export function InputRupee({
  value,
  defaultValue,
  onInput,
  onBlur,
  placeholder = '0',
  className = '',
  ...rest
}) {
  const controlled = value !== undefined;
  const inputProps = controlled ? { value } : { defaultValue };

  return (
    <div class={`input-rupee ${className}`.trim()}>
      <span class="input-rupee-symbol" aria-hidden="true">
        ₹
      </span>
      <input
        type="number"
        step="0.01"
        min="0"
        placeholder={placeholder}
        onInput={onInput}
        onBlur={onBlur}
        {...inputProps}
        {...rest}
      />
    </div>
  );
}
