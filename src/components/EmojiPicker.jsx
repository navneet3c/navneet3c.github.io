import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { searchEmojiCatalog } from '../lib/emojiCatalog.js';
import { ActionButton } from './ActionButton.jsx';

export function EmojiPicker({
  selected,
  quickPicks = [],
  onSelect,
  onClose,
  placeholder = 'Search emoji (e.g. milk, soap, box)',
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const quickList = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const e of quickPicks) {
      if (e && !seen.has(e)) {
        seen.add(e);
        out.push(e);
      }
    }
    return out;
  }, [quickPicks]);

  const trimmedQuery = query.trim();

  const matchEmojis = useMemo(
    () => (trimmedQuery ? searchEmojiCatalog(trimmedQuery) : []),
    [trimmedQuery],
  );

  const browseEmojis = useMemo(() => {
    if (trimmedQuery) return [];
    const quickSet = new Set(quickList);
    return searchEmojiCatalog('', { limit: 72 }).filter((e) => !quickSet.has(e));
  }, [trimmedQuery, quickList]);

  const handlePick = (emoji) => {
    onSelect(emoji);
    onClose?.();
  };

  return (
    <div class="emoji-picker-panel" onMouseDown={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="search"
        class="emoji-picker-search"
        placeholder={placeholder}
        value={query}
        autocomplete="off"
        autocorrect="off"
        spellcheck={false}
        onInput={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose?.();
          }
        }}
      />
      {!trimmedQuery && quickList.length > 0 && (
        <div class="emoji-picker-section">
          <span class="emoji-picker-label">Suggested</span>
          <div class="emoji-picker-grid">
            {quickList.map((e) => (
              <ActionButton
                key={`q-${e}`}
                class={`emoji-pick${selected === e ? ' emoji-pick-active' : ''}`}
                label={`Select ${e}`}
                onClick={() => handlePick(e)}
              >
                {e}
              </ActionButton>
            ))}
          </div>
        </div>
      )}
      <div class="emoji-picker-section">
        {trimmedQuery ? (
          <span class="emoji-picker-label">{matchEmojis.length ? 'Matches' : 'No matches'}</span>
        ) : (
          <span class="emoji-picker-label">Browse</span>
        )}
        {trimmedQuery ? (
          matchEmojis.length > 0 ? (
            <div class="emoji-picker-grid emoji-picker-grid-scroll">
              {matchEmojis.map((e) => (
                <ActionButton
                  key={`m-${e}`}
                  class={`emoji-pick${selected === e ? ' emoji-pick-active' : ''}`}
                  label={`Select ${e}`}
                  onClick={() => handlePick(e)}
                >
                  {e}
                </ActionButton>
              ))}
            </div>
          ) : (
            <p class="emoji-picker-empty">Try shorter words like &quot;milk&quot; or &quot;soap&quot;</p>
          )
        ) : browseEmojis.length > 0 ? (
          <div class="emoji-picker-grid emoji-picker-grid-scroll">
            {browseEmojis.map((e) => (
              <ActionButton
                key={`b-${e}`}
                class={`emoji-pick${selected === e ? ' emoji-pick-active' : ''}`}
                label={`Select ${e}`}
                onClick={() => handlePick(e)}
              >
                {e}
              </ActionButton>
            ))}
          </div>
        ) : null}
      </div>
      <div class="emoji-picker-footer">
        <ActionButton
          class="emoji-pick emoji-pick-auto"
          label="Use automatic emoji"
          onClick={() => {
            onSelect(null);
            onClose?.();
          }}
        >
          Auto
        </ActionButton>
        <ActionButton
          class="btn btn-ghost"
          style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
          label="Close picker"
          onClick={onClose}
        >
          Close
        </ActionButton>
      </div>
    </div>
  );
}
