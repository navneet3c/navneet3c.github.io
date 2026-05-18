import { useState, useMemo } from 'preact/hooks';
import { db, CATEGORIES } from '../../db/schema.js';
import { useLiveQuery } from '../../core/store.js';
import { suggestCategoryAndEmoji, formatCategory } from '../../lib/categorize.js';

async function blobFromFile(file) {
  return file;
}

export function SuppliesView() {
  const { data: supplies = [] } = useLiveQuery(() =>
    db.supplies.orderBy('purchasedAt').reverse().toArray(),
  );

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const suggestion = useMemo(
    () => (name.trim() ? suggestCategoryAndEmoji(name, brand) : null),
    [name, brand],
  );

  const effectiveCategory = category || suggestion?.category || 'other';
  const effectiveEmoji = emoji !== '📦' && emoji ? emoji : suggestion?.emoji || '📦';

  const filtered = useMemo(() => {
    if (filter === 'all') return supplies;
    return supplies.filter((s) => s.category === filter);
  }, [supplies, filter]);

  const resetForm = () => {
    setName('');
    setBrand('');
    setPrice('');
    setSize('');
    setNotes('');
    setCategory('');
    setEmoji('📦');
    setImageFile(null);
    setShowDetails(false);
  };

  const handleQuickAdd = async (e) => {
    e?.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      let imageBlob = null;
      if (imageFile) imageBlob = await blobFromFile(imageFile);

      await db.supplies.add({
        name: name.trim(),
        brand: brand.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        size: size.trim() || undefined,
        notes: notes.trim() || undefined,
        category: effectiveCategory,
        emoji: effectiveEmoji,
        imageBlob,
        purchasedAt: now,
        createdAt: now,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !showDetails) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setCategory(suggestion.category);
      setEmoji(suggestion.emoji);
    }
  };

  const deleteItem = async (id) => {
    if (confirm('Remove this supply entry?')) {
      await db.supplies.delete(id);
    }
  };

  const imageUrlFor = (item) => {
    if (item.imageBlob) return URL.createObjectURL(item.imageBlob);
    return null;
  };

  return (
    <div>
      <form class="quick-add" onSubmit={handleQuickAdd}>
        <div class="quick-add-row">
          <input
            type="text"
            placeholder="Item name — press Enter to save"
            value={name}
            onInput={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autocomplete="off"
          />
          <button type="submit" class="btn btn-primary" disabled={!name.trim() || saving}>
            {saving ? '…' : '+'}
          </button>
        </div>
        <div class="quick-add-row" style="margin-top: 0.5rem;">
          <input
            type="text"
            placeholder="Brand (optional)"
            value={brand}
            onInput={(e) => setBrand(e.target.value)}
            onKeyDown={handleKeyDown}
            autocomplete="off"
          />
        </div>
        {name.trim() && suggestion && (
          <div class="quick-add-preview">
            <span class="preview-emoji">{effectiveEmoji}</span>
            <span>
              Suggested: <strong>{formatCategory(effectiveCategory)}</strong>
            </span>
            <button type="button" class="btn btn-ghost" style="margin-left: auto; padding: 0.3rem 0.6rem; font-size: 0.75rem;" onClick={applySuggestion}>
              Apply
            </button>
          </div>
        )}
        <button
          type="button"
          class="btn btn-ghost"
          style="width: 100%; margin-top: 0.5rem; font-size: 0.8rem;"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Hide details' : '▼ Price, size, image, notes'}
        </button>
        {showDetails && (
          <div class="details-panel">
            <div class="form-row form-row-2">
              <div class="field">
                <label>Price (₹)</label>
                <input type="number" step="0.01" min="0" value={price} onInput={(e) => setPrice(e.target.value)} />
              </div>
              <div class="field">
                <label>Weight / size</label>
                <input type="text" placeholder="e.g. 1L, 500g" value={size} onInput={(e) => setSize(e.target.value)} />
              </div>
            </div>
            <div class="form-row form-row-2">
              <div class="field">
                <label>Category</label>
                <select value={effectiveCategory} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {formatCategory(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div class="field">
                <label>Emoji</label>
                <input type="text" maxlength="4" value={effectiveEmoji} onInput={(e) => setEmoji(e.target.value)} />
              </div>
            </div>
            <div class="field">
              <label>Photo</label>
              <input type="file" accept="image/*" capture="environment" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <div class="field">
              <label>Notes</label>
              <textarea rows={2} value={notes} onInput={(e) => setNotes(e.target.value)} placeholder="Store, expiry, etc." />
            </div>
          </div>
        )}
      </form>

      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
        <button type="button" class={`chip ${filter === 'all' ? 'chip-accent' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            class={`chip ${filter === c ? 'chip-accent' : ''}`}
            onClick={() => setFilter(c)}
          >
            {formatCategory(c)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div class="empty-state">
          <div class="emoji">📦</div>
          <p>No supplies yet. Type an item name above and press Enter.</p>
        </div>
      ) : (
        <div class="list">
          {filtered.map((item) => {
            const img = imageUrlFor(item);
            return (
              <div key={item.id} class="list-item">
                <span class="item-emoji">{item.emoji || '📦'}</span>
                <div class="item-body">
                  <div class="item-title">
                    {item.name}
                    {item.brand ? ` · ${item.brand}` : ''}
                  </div>
                  <div class="item-sub">
                    {formatCategory(item.category)}
                    {item.size ? ` · ${item.size}` : ''}
                    {' · '}
                    {new Date(item.purchasedAt).toLocaleDateString()}
                  </div>
                </div>
                <div class="item-meta">
                  {item.price != null && (
                    <div style="font-family: var(--mono); font-weight: 600;">
                      ₹{Number(item.price).toFixed(0)}
                    </div>
                  )}
                  {img && <img src={img} alt="" class="image-thumb" style="margin-top: 0.25rem; display: block; margin-left: auto;" />}
                  <button type="button" class="btn btn-ghost" style="padding: 0.2rem 0.4rem; font-size: 0.7rem; margin-top: 0.25rem;" onClick={() => deleteItem(item.id)}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
