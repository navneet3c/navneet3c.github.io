import { useState, useRef, useEffect } from 'preact/hooks';

export function AutocompleteField({
  value,
  onInput,
  onSelect,
  suggestions = [],
  placeholder,
  onKeyDown,
  autocomplete = 'off',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const showList = open && suggestions.length > 0;

  return (
    <div class="autocomplete-wrap" ref={wrapRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onInput={(e) => {
          onInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          onKeyDown?.(e);
        }}
        autocomplete={autocomplete}
      />
      {showList && (
        <ul class="autocomplete-list" role="listbox">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(s);
                  setOpen(false);
                }}
              >
                {s.label}
                {s.meta ? <span class="autocomplete-meta">{s.meta}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
