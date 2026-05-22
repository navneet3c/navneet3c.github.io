import { useState, useMemo, useEffect } from 'preact/hooks';
import { db } from '../../db/schema.js';
import { fetchDiningPage, fetchAllDiningLite, countDining } from '../../db/diningQuery.js';
import { useLiveQuery } from '../../core/store.js';
import { formatCategory, useDiningCategories } from '../../lib/categories.js';
import { getCategoryStyle } from '../../lib/categoryColors.js';
import {
  buildDiningSuggestionIndex,
  searchDiningNameSuggestions,
  searchLocationSuggestions,
  getDiningHints,
  emojiChoicesForDining,
} from '../../lib/diningSuggestions.js';
import { CategorySelect } from '../../components/CategorySelect.jsx';
import { CategoryAdd } from '../../components/CategoryAdd.jsx';
import { CategoryChipFilter } from '../../components/CategoryChipFilter.jsx';
import { AutocompleteField } from '../../components/AutocompleteField.jsx';
import { InputRupee } from '../../components/InputRupee.jsx';
import { formatRupee } from '../../lib/formatMoney.js';
import { formatShortDate, joinSubline } from '../../lib/formatList.js';
import { DateRangeToolbar } from '../../components/DateRangeToolbar.jsx';
import { ActionButton } from '../../components/ActionButton.jsx';
import { FormClearButton } from '../../components/FormClearButton.jsx';
import { EditActions } from '../../components/EditActions.jsx';
import { ListPageFooter } from '../../components/ListPageFooter.jsx';
import { QuickAddHintsPreview } from '../../components/QuickAddHintsPreview.jsx';
import {
  FALLBACK_CATEGORY,
  DEFAULT_EMOJI,
  DEFAULT_LIST_DATE_PRESET,
  SUGGESTION_MATCH_LIMIT,
  SUGGESTION_IDLE_LIMIT,
} from '../../lib/constants.js';
import { useDateRangeFilter } from '../../lib/useDateRangeFilter.js';
import { useListPagination } from '../../lib/useListPagination.js';

function fillFromProfile(profile, setters) {
  const latest = profile.latest;
  setters.setName(latest.name);
  setters.setLocation(latest.location || '');
  setters.setCategory(latest.category || '');
  setters.setCategoryLocked(true);
  setters.setLocationLocked(true);
  setters.setEmojiOverride(latest.emoji || null);
  if (latest.cost != null) {
    setters.setCost(String(latest.cost));
    setters.setCostLocked(true);
  }
}

function diningSubline(item) {
  return joinSubline([formatCategory(item.category), item.location, formatShortDate(item.spentAt)]);
}

export function DiningView() {
  const [filter, setFilter] = useState('all');
  const {
    datePreset,
    setDatePreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateRange,
    dateLabel,
  } = useDateRangeFilter(DEFAULT_LIST_DATE_PRESET);
  const { listLimit, loadMore } = useListPagination([filter, datePreset, customFrom, customTo]);

  const { categories, addCategory, removeCategory } = useDiningCategories();

  const { data: listItems = [] } = useLiveQuery(
    () =>
      fetchDiningPage({
        category: filter,
        limit: listLimit,
        from: dateRange.from,
        to: dateRange.to,
      }),
    [filter, listLimit, dateRange.from, dateRange.to],
  );

  const { data: listTotal = 0 } = useLiveQuery(
    () => countDining({ category: filter, from: dateRange.from, to: dateRange.to }),
    [filter, dateRange.from, dateRange.to],
  );

  const { data: allLite = [] } = useLiveQuery(() => fetchAllDiningLite(), []);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [showEmojiPick, setShowEmojiPick] = useState(false);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [emojiOverride, setEmojiOverride] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [categoryLocked, setCategoryLocked] = useState(false);
  const [costLocked, setCostLocked] = useState(false);
  const [locationLocked, setLocationLocked] = useState(false);

  const suggestionIndex = useMemo(() => buildDiningSuggestionIndex(allLite), [allLite]);

  const hints = useMemo(
    () => getDiningHints(suggestionIndex, name, location),
    [suggestionIndex, name, location],
  );

  const effectiveCategory = category || hints.category || FALLBACK_CATEGORY;
  const effectiveEmoji = emojiOverride ?? hints.emoji ?? DEFAULT_EMOJI.dining;

  const emojiChoices = useMemo(() => {
    const picks = emojiChoicesForDining(name, location, effectiveCategory);
    const seen = new Set();
    const out = [];
    for (const e of [effectiveEmoji, ...picks]) {
      if (e && !seen.has(e)) {
        seen.add(e);
        out.push(e);
      }
    }
    return out;
  }, [name, location, effectiveCategory, effectiveEmoji]);

  const nameSuggestions = useMemo(() => {
    const matches = name.trim()
      ? searchDiningNameSuggestions(suggestionIndex, name, SUGGESTION_MATCH_LIMIT)
      : suggestionIndex.items.slice(0, SUGGESTION_IDLE_LIMIT);
    return matches.map((item) => ({
      id: item.key,
      label: item.label,
      meta: [item.profile.latest.location, formatCategory(item.profile.latest.category)]
        .filter(Boolean)
        .join(' · '),
      profile: item.profile,
    }));
  }, [name, suggestionIndex]);

  const locationSuggestions = useMemo(
    () =>
      searchLocationSuggestions(suggestionIndex, location, SUGGESTION_MATCH_LIMIT).map((row, i) => ({
        id: `${row.location}-${i}`,
        label: row.location,
        meta: row.lastName || '',
        location: row.location,
      })),
    [location, suggestionIndex],
  );

  useEffect(() => {
    if (!name.trim()) return;
    if (!categoryLocked) setCategory(hints.category);
    if (!locationLocked && hints.location) setLocation(hints.location);
  }, [name, location, hints.category, hints.location, categoryLocked, locationLocked]);

  useEffect(() => {
    if (!name.trim() || costLocked) return;
    if (hints.cost != null) setCost(String(Math.round(hints.cost)));
  }, [name, location, hints.cost, costLocked]);

  const hasMore = listItems.length < listTotal;

  const resetForm = () => {
    setName('');
    setLocation('');
    setCost('');
    setNotes('');
    setCategory('');
    setEmojiOverride(null);
    setShowEmojiPick(false);
    setCategoryLocked(false);
    setCostLocked(false);
    setLocationLocked(false);
  };

  const formSetters = {
    setName,
    setLocation,
    setCategory,
    setCategoryLocked,
    setEmojiOverride,
    setCost,
    setCostLocked,
    setLocationLocked,
  };

  const handleRemoveCategory = async (id) => {
    await removeCategory(id);
    if (filter === id) setFilter('all');
    if (category === id) {
      setCategory('');
      setCategoryLocked(false);
    }
    if (editingId && editDraft?.category === id) {
      setEditDraft({ ...editDraft, category: FALLBACK_CATEGORY });
    }
  };

  const handleQuickAdd = async (e) => {
    e?.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await db.dining.add({
        name: name.trim(),
        location: location.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes: notes.trim() || undefined,
        category: effectiveCategory,
        emoji: effectiveEmoji,
        spentAt: now,
        createdAt: now,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const applyHints = () => {
    setCategory(hints.category);
    setCategoryLocked(true);
    setEmojiOverride(hints.emoji);
    if (hints.location) {
      setLocation(hints.location);
      setLocationLocked(true);
    }
    if (hints.cost != null) {
      setCost(String(Math.round(hints.cost)));
      setCostLocked(true);
    }
  };

  const updateItem = async (id, patch) => {
    const row = { ...patch };
    if ('cost' in patch) {
      const p = patch.cost;
      row.cost = p === '' || p == null ? undefined : parseFloat(p);
      if (row.cost != null && Number.isNaN(row.cost)) return;
    }
    if ('location' in patch) row.location = patch.location?.trim() || undefined;
    if ('name' in patch) row.name = patch.name?.trim();
    await db.dining.update(id, row);
  };

  const deleteItem = async (id) => {
    if (confirm('Remove this dining entry?')) {
      if (editingId === id) {
        setEditingId(null);
        setEditDraft(null);
      }
      await db.dining.delete(id);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({
      name: item.name,
      location: item.location || '',
      category: item.category || 'other',
      cost: item.cost ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft?.name?.trim()) return;
    await updateItem(editingId, {
      name: editDraft.name,
      location: editDraft.location,
      category: editDraft.category,
      cost: editDraft.cost,
    });
    cancelEdit();
  };

  return (
    <div>
      <form class="quick-add" onSubmit={handleQuickAdd}>
        <div class="quick-add-row quick-add-row-name">
          <ActionButton
            class={`emoji-lead action-btn-emoji${showEmojiPick ? ' emoji-lead-open' : ''}`}
            label="Choose emoji"
            onClick={() => setShowEmojiPick(!showEmojiPick)}
          >
            {effectiveEmoji}
          </ActionButton>
          <AutocompleteField
            value={name}
            placeholder="What did you eat? — Enter to save"
            suggestions={nameSuggestions}
            onInput={(v) => {
              setName(v);
              setCategoryLocked(false);
              setCostLocked(false);
            }}
            onSelect={(s) => fillFromProfile(s.profile, formSetters)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" class="btn btn-primary" disabled={!name.trim() || saving}>
            {saving ? '…' : '+'}
          </button>
          <FormClearButton onClick={resetForm} disabled={saving} />
        </div>
        {showEmojiPick && (
          <div class="emoji-picker-strip">
            {emojiChoices.map((e) => (
              <ActionButton
                key={e}
                class={`emoji-pick${effectiveEmoji === e ? ' emoji-pick-active' : ''}`}
                label={`Select ${e}`}
                onClick={() => {
                  setEmojiOverride(e);
                  setShowEmojiPick(false);
                }}
              >
                {e}
              </ActionButton>
            ))}
            <ActionButton
              class="emoji-pick emoji-pick-auto"
              label="Use automatic emoji"
              onClick={() => {
                setEmojiOverride(null);
                setShowEmojiPick(false);
              }}
            >
              Auto
            </ActionButton>
          </div>
        )}
        <div class="quick-add-row" style="margin-top: 0.5rem;">
          <AutocompleteField
            value={location}
            placeholder="Location (restaurant, store…)"
            suggestions={locationSuggestions}
            onInput={(v) => {
              setLocation(v);
              setCategoryLocked(false);
              setCostLocked(false);
            }}
            onSelect={(s) => setLocation(s.location)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div class="quick-add-fields">
          <CategorySelect
            categories={categories}
            value={effectiveCategory}
            onChange={(c) => {
              setCategory(c);
              setCategoryLocked(true);
            }}
            onAddCategory={addCategory}
          />
          <InputRupee
            class="inline-field"
            placeholder="Cost"
            value={cost}
            onInput={(e) => {
              setCost(e.target.value);
              setCostLocked(true);
            }}
          />
        </div>
        {name.trim() && (
          <QuickAddHintsPreview onApply={applyHints}>
            {hints.fromHistory ? (
              <>
                From history: <strong>{formatCategory(hints.category)}</strong>
                {hints.location ? ` · ${hints.location}` : ''}
                {hints.cost != null ? ` · ${formatRupee(hints.cost)}` : ''}
              </>
            ) : (
              <>
                Suggested: <strong>{formatCategory(hints.keywordCategory)}</strong>
              </>
            )}
          </QuickAddHintsPreview>
        )}
        <div class="field" style="margin-top: 0.5rem;">
          <textarea
            rows={2}
            value={notes}
            onInput={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
          />
        </div>
      </form>

      <DateRangeToolbar
        datePreset={datePreset}
        onPresetChange={setDatePreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <CategoryChipFilter categories={categories} filter={filter} onFilter={setFilter}>
        <CategoryAdd categories={categories} onRemove={handleRemoveCategory} />
      </CategoryChipFilter>

      {listTotal === 0 ? (
        <div class="empty-state">
          <div class="emoji">{DEFAULT_EMOJI.dining}</div>
          <p>
            {datePreset !== 'all' || filter !== 'all'
              ? 'No dining entries in this period or category.'
              : 'No meals logged yet. Add what you ate above.'}
          </p>
        </div>
      ) : (
        <div class="list list-supplies">
          {listItems.map((item) => {
            const isEditing = editingId === item.id && editDraft;
            const catStyle = getCategoryStyle(item.category, 'dining');
            return (
              <div
                key={item.id}
                class={`list-item list-item-compact${isEditing ? ' is-editing' : ''}`}
                style={{ background: catStyle.background, borderColor: catStyle.borderColor }}
              >
                {isEditing ? (
                  <div class="supply-edit">
                    <div class="supply-edit-row">
                      <input
                        type="text"
                        value={editDraft.name}
                        onInput={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={editDraft.location}
                        onInput={(e) => setEditDraft({ ...editDraft, location: e.target.value })}
                      />
                    </div>
                    <div class="quick-add-fields">
                      <CategorySelect
                        categories={categories}
                        value={editDraft.category}
                        onChange={(c) => setEditDraft({ ...editDraft, category: c })}
                        onAddCategory={addCategory}
                      />
                      <InputRupee
                        class="inline-field"
                        value={editDraft.cost}
                        onInput={(e) => setEditDraft({ ...editDraft, cost: e.target.value })}
                      />
                    </div>
                    <EditActions onSave={saveEdit} onCancel={cancelEdit} />
                  </div>
                ) : (
                  <>
                    <div class="item-body">
                      <div class="item-title">
                        <span class="item-emoji-inline" aria-hidden="true">
                          {item.emoji || DEFAULT_EMOJI.dining}
                        </span>
                        {item.name}
                      </div>
                      <div class="item-sub item-sub-compact">{diningSubline(item)}</div>
                    </div>
                    <div class="item-meta item-meta-compact">
                      {item.cost != null && (
                        <span class="item-price">{formatRupee(item.cost)}</span>
                      )}
                      <div class="item-actions">
                        <ActionButton tight label="Edit" onClick={() => startEdit(item)}>
                          ✎
                        </ActionButton>
                        <ActionButton tight danger label="Remove" onClick={() => deleteItem(item.id)}>
                          ✕
                        </ActionButton>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ListPageFooter
        shown={listItems.length}
        total={listTotal}
        dateLabel={dateLabel}
        categoryFilter={filter}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
