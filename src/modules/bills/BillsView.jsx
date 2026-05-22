import { useState, useMemo } from 'preact/hooks';
import { db, BILL_FREQUENCIES } from '../../db/schema.js';
import { useLiveQuery } from '../../core/store.js';
import { predictUpcomingBills, advanceBillDue } from '../../lib/patterns.js';
import {
  FALLBACK_CATEGORY,
  DEFAULT_EMOJI,
  UPCOMING_BILL_DAY_PRESETS,
  DEFAULT_UPCOMING_BILL_DAYS,
} from '../../lib/constants.js';
import { DEFAULT_BILL_CATEGORIES } from '../../lib/categories.js';
import { formatCategory } from '../../lib/categorize.js';
import { useBillCategories } from '../../lib/categories.js';
import { getCategoryStyle } from '../../lib/categoryColors.js';
import { formatDueLabel } from '../../lib/dateRange.js';
import { CategorySelect } from '../../components/CategorySelect.jsx';
import { CategoryAdd } from '../../components/CategoryAdd.jsx';
import { ActionButton } from '../../components/ActionButton.jsx';
import { FormClearButton } from '../../components/FormClearButton.jsx';
import { EditActions } from '../../components/EditActions.jsx';
import { InputRupee } from '../../components/InputRupee.jsx';
import { formatRupee } from '../../lib/formatMoney.js';

function groupBillsByCategory(bills, categoryOrder) {
  const map = new Map();
  for (const b of bills) {
    const c = b.category || FALLBACK_CATEGORY;
    if (!map.has(c)) map.set(c, []);
    map.get(c).push(b);
  }
  const groups = [];
  for (const c of categoryOrder) {
    if (map.has(c)) groups.push({ category: c, bills: map.get(c) });
  }
  for (const [c, list] of map) {
    if (!categoryOrder.includes(c)) groups.push({ category: c, bills: list });
  }
  return groups;
}

function billSubline(bill) {
  return `${formatCategory(bill.frequency)} · ${bill.nextDue || 'No date'}`;
}

export function BillsView() {
  const { data: bills = [] } = useLiveQuery(() => db.bills.toArray(), []);

  const { categories, addCategory, removeCategory } = useBillCategories(bills);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(DEFAULT_BILL_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [upcomingDays, setUpcomingDays] = useState(DEFAULT_UPCOMING_BILL_DAYS);

  const upcoming = useMemo(
    () => predictUpcomingBills(bills, upcomingDays),
    [bills, upcomingDays],
  );

  const groupedBills = useMemo(
    () => groupBillsByCategory(bills, categories),
    [bills, categories],
  );

  const handleRemoveCategory = async (id) => {
    await removeCategory(id);
    if (category === id) setCategory(FALLBACK_CATEGORY);
    if (editingId && editDraft?.category === id) {
      setEditDraft({ ...editDraft, category: FALLBACK_CATEGORY });
    }
  };

  const resetAddForm = () => {
    setName('');
    setAmount('');
    setCategory(DEFAULT_BILL_CATEGORIES[0]);
    setFrequency('monthly');
    setNextDue(new Date().toISOString().slice(0, 10));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await db.bills.add({
        name: name.trim(),
        category,
        amount: parseFloat(amount),
        frequency,
        nextDue,
        active: true,
        createdAt: now,
      });
      resetAddForm();
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (bill) => {
    const paid = new Date().toISOString().slice(0, 10);
    const next = advanceBillDue(new Date(bill.nextDue || paid), bill.frequency);
    await db.bills.update(bill.id, { lastPaid: paid, nextDue: next.toISOString().slice(0, 10) });
  };

  const toggleActive = async (bill) => {
    await db.bills.update(bill.id, { active: bill.active === false ? true : false });
  };

  const deleteBill = async (id) => {
    if (confirm('Delete this bill?')) {
      if (editingId === id) {
        setEditingId(null);
        setEditDraft(null);
      }
      await db.bills.delete(id);
    }
  };

  const updateBill = async (id, patch) => {
    const row = { ...patch };
    if ('amount' in patch) {
      if (patch.amount === '' || patch.amount == null) return;
      const a = parseFloat(patch.amount);
      if (Number.isNaN(a)) return;
      row.amount = a;
    }
    if ('name' in patch) {
      const n = patch.name?.trim();
      if (!n) return;
      row.name = n;
    }
    await db.bills.update(id, row);
  };

  const startEdit = (bill) => {
    setEditingId(bill.id);
    setEditDraft({
      name: bill.name,
      category: bill.category || FALLBACK_CATEGORY,
      amount: bill.amount ?? '',
      frequency: bill.frequency || 'monthly',
      nextDue: bill.nextDue || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft?.name?.trim()) return;
    await updateBill(editingId, {
      name: editDraft.name,
      category: editDraft.category,
      amount: editDraft.amount,
      frequency: editDraft.frequency,
      nextDue: editDraft.nextDue || undefined,
    });
    cancelEdit();
  };

  const renderBillRow = (bill, { showDueEditor = false, dueDate, daysUntil, rowKey } = {}) => {
    const catStyle = getCategoryStyle(bill.category, 'bill');
    const isEditing = editingId === bill.id && editDraft;
    return (
      <div
        key={rowKey || bill.id}
        class={`list-item list-item-compact bill-row${isEditing ? ' is-editing' : ''}${bill.active === false ? ' is-inactive' : ''}`}
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
              <CategorySelect
                categories={categories}
                value={editDraft.category}
                onChange={(c) => setEditDraft({ ...editDraft, category: c })}
                onAddCategory={addCategory}
              />
            </div>
            <div class="quick-add-fields">
              <InputRupee
                class="inline-field"
                value={editDraft.amount}
                onInput={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
              />
              <select
                class="inline-field"
                value={editDraft.frequency}
                onChange={(e) => setEditDraft({ ...editDraft, frequency: e.target.value })}
              >
                {BILL_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {formatCategory(f)}
                  </option>
                ))}
              </select>
              <input
                class="inline-field"
                type="date"
                value={editDraft.nextDue}
                onInput={(e) => setEditDraft({ ...editDraft, nextDue: e.target.value })}
              />
            </div>
            <EditActions onSave={saveEdit} onCancel={cancelEdit} />
          </div>
        ) : (
          <>
            <span class="item-emoji">💳</span>
            <div class="item-body">
              <div class="item-title">{bill.name}</div>
              <div class="item-sub item-sub-compact">
                {showDueEditor && dueDate
                  ? `${formatCategory(bill.category)} · ${dueDate} · ${formatDueLabel(dueDate, daysUntil)}`
                  : billSubline(bill)}
              </div>
            </div>
            <div class="item-meta item-meta-compact item-meta-bill">
              <span class="item-price">{formatRupee(bill.amount)}</span>
              <div class="item-actions">
                <ActionButton
                  tight
                  label="Mark as paid — moves next due date forward"
                  onClick={() => markPaid(bill)}
                >
                  ✓
                </ActionButton>
                {!showDueEditor && (
                  <ActionButton
                    tight
                    label={
                      bill.active === false
                        ? 'Resume — include in upcoming bills'
                        : 'Pause — hide from upcoming'
                    }
                    onClick={() => toggleActive(bill)}
                  >
                    {bill.active === false ? '◉' : '○'}
                  </ActionButton>
                )}
                <ActionButton
                  tight
                  label="Edit name, amount, frequency, and due date"
                  onClick={() => startEdit(bill)}
                >
                  ✎
                </ActionButton>
                <ActionButton
                  tight
                  danger
                  label="Delete this bill permanently"
                  onClick={() => deleteBill(bill.id)}
                >
                  ✕
                </ActionButton>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <form class="card quick-add" onSubmit={handleAdd} style="margin-bottom: 1rem;">
        <div class="form-row form-row-2">
          <div class="field" style="grid-column: 1 / -1;">
            <label>Bill name</label>
            <input
              type="text"
              placeholder="e.g. Electricity, Netflix"
              value={name}
              onInput={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div class="field">
            <label>Category</label>
            <CategorySelect
              categories={categories}
              value={category}
              onChange={setCategory}
              onAddCategory={addCategory}
            />
          </div>
          <div class="field">
            <label>Amount</label>
            <InputRupee value={amount} onInput={(e) => setAmount(e.target.value)} required />
          </div>
          <div class="field">
            <label>Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {BILL_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {formatCategory(f)}
                </option>
              ))}
            </select>
          </div>
          <div class="field">
            <label>Next due</label>
            <input type="date" value={nextDue} onInput={(e) => setNextDue(e.target.value)} />
          </div>
        </div>
        <div class="form-actions">
          <FormClearButton onClick={resetAddForm} disabled={saving} />
          <button type="submit" class="btn btn-primary" disabled={saving}>
            Add bill
          </button>
        </div>
      </form>

      <div class="filter-section">
        <span class="filter-label">Categories</span>
        <CategoryAdd categories={categories} onRemove={handleRemoveCategory} />
      </div>

      <div class="filter-section">
        <h2 class="section-title section-title-inline">Upcoming bills</h2>
        <div class="chip-row">
          {UPCOMING_BILL_DAY_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              class={`chip ${upcomingDays === d ? 'chip-accent' : ''}`}
              onClick={() => setUpcomingDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
        <p class="list-summary">
          Showing bills due in the next <strong>{upcomingDays} days</strong>
          {upcoming.length > 0 ? ` · ${upcoming.length} payment${upcoming.length === 1 ? '' : 's'}` : ''}
        </p>
      </div>
      {upcoming.length === 0 ? (
        <p class="empty-state" style="padding: 1rem;">
          No bills due in this period. Try a longer range or add bills above.
        </p>
      ) : (
        <div class="list list-bills" style="margin-bottom: 1.25rem;">
          {upcoming.map((b, i) =>
            renderBillRow(b, {
              showDueEditor: true,
              dueDate: b.dueDate,
              daysUntil: b.daysUntil,
              rowKey: `${b.id}-${b.dueDate}-${i}`,
            }),
          )}
        </div>
      )}

      <details class="bill-section-collapse">
        <summary class="section-title bill-section-summary">
          All bills
          {bills.length > 0 && <span class="bill-group-count">({bills.length})</span>}
        </summary>
        {bills.length === 0 ? (
          <div class="empty-state">
            <div class="emoji">{DEFAULT_EMOJI.bill}</div>
            <p>Track rent, utilities, subscriptions, and more.</p>
          </div>
        ) : (
          <div class="bill-groups">
            {groupedBills.map(({ category: cat, bills: group }) => {
              const headerStyle = getCategoryStyle(cat, 'bill');
              return (
                <section key={cat} class="bill-group">
                  <h3
                    class="bill-group-title"
                    style={{ borderColor: headerStyle.borderColor, color: 'var(--text)' }}
                  >
                    {formatCategory(cat)}
                    <span class="bill-group-count">{group.length}</span>
                  </h3>
                  <div class="list list-bills">
                    {group.map((bill) => renderBillRow(bill))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </details>
    </div>
  );
}
