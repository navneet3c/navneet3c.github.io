import { useState } from 'preact/hooks';
import { db, BILL_FREQUENCIES } from '../../db/schema.js';
import { useLiveQuery } from '../../core/store.js';
import { predictUpcomingBills } from '../../lib/patterns.js';
import { formatCategory } from '../../lib/categorize.js';

const BILL_CATEGORIES = [
  'utilities',
  'rent',
  'subscription',
  'insurance',
  'loan',
  'internet',
  'mobile',
  'other',
];

export function BillsView() {
  const { data: bills = [] } = useLiveQuery(() => db.bills.toArray(), []);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('utilities');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDue, setNextDue] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const upcoming = predictUpcomingBills(bills, 60);

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
      setName('');
      setAmount('');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (bill) => {
    const paid = new Date().toISOString().slice(0, 10);
    const d = new Date(bill.nextDue || paid);
    switch (bill.frequency) {
      case 'weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'biweekly':
        d.setDate(d.getDate() + 14);
        break;
      case 'quarterly':
        d.setMonth(d.getMonth() + 3);
        break;
      case 'yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
      default:
        d.setMonth(d.getMonth() + 1);
    }
    await db.bills.update(bill.id, { lastPaid: paid, nextDue: d.toISOString().slice(0, 10) });
  };

  const toggleActive = async (bill) => {
    await db.bills.update(bill.id, { active: bill.active === false ? true : false });
  };

  const deleteBill = async (id) => {
    if (confirm('Delete this bill?')) await db.bills.delete(id);
  };

  return (
    <div>
      <form class="card" onSubmit={handleAdd} style="margin-bottom: 1rem;">
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
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {BILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {formatCategory(c)}
                </option>
              ))}
            </select>
          </div>
          <div class="field">
            <label>Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onInput={(e) => setAmount(e.target.value)}
              required
            />
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
        <button type="submit" class="btn btn-primary" style="width: 100%;" disabled={saving}>
          Add bill
        </button>
      </form>

      <h2 class="section-title">Upcoming (60 days)</h2>
      {upcoming.length === 0 ? (
        <p class="empty-state" style="padding: 1rem;">
          No upcoming bills. Add recurring bills above.
        </p>
      ) : (
        <div class="list" style="margin-bottom: 1.25rem;">
          {upcoming.slice(0, 12).map((b, i) => (
            <div key={`${b.id}-${b.dueDate}-${i}`} class="list-item">
              <span class="item-emoji">💳</span>
              <div class="item-body">
                <div class="item-title">{b.name}</div>
                <div class="item-sub">
                  {formatCategory(b.category)} · Due {b.dueDate}
                  {b.daysUntil === 0 ? ' (today)' : b.daysUntil > 0 ? ` (in ${b.daysUntil}d)` : ' (overdue)'}
                </div>
              </div>
              <div class="item-meta">
                <div style="font-family: var(--mono); font-weight: 600;">₹{Number(b.amount).toFixed(0)}</div>
                <button type="button" class="btn btn-ghost" style="font-size: 0.7rem; margin-top: 0.25rem;" onClick={() => markPaid(b)}>
                  Paid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 class="section-title">All bills</h2>
      {bills.length === 0 ? (
        <div class="empty-state">
          <div class="emoji">💳</div>
          <p>Track rent, utilities, subscriptions, and more.</p>
        </div>
      ) : (
        <div class="list">
          {bills.map((bill) => (
            <div key={bill.id} class="list-item" style={bill.active === false ? 'opacity: 0.5;' : ''}>
              <span class="item-emoji">📄</span>
              <div class="item-body">
                <div class="item-title">{bill.name}</div>
                <div class="item-sub">
                  {formatCategory(bill.category)} · {formatCategory(bill.frequency)}
                  {bill.nextDue ? ` · Next: ${bill.nextDue}` : ''}
                </div>
              </div>
              <div class="item-meta">
                <div style="font-family: var(--mono); font-weight: 600;">₹{Number(bill.amount).toFixed(0)}</div>
                <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem; justify-content: flex-end;">
                  <button type="button" class="btn btn-ghost" style="font-size: 0.65rem; padding: 0.2rem 0.4rem;" onClick={() => toggleActive(bill)}>
                    {bill.active === false ? 'On' : 'Off'}
                  </button>
                  <button type="button" class="btn btn-danger" style="font-size: 0.65rem; padding: 0.2rem 0.4rem;" onClick={() => deleteBill(bill.id)}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
