import { db } from '../../db/schema.js';
import { useLiveQuery } from '../../core/store.js';
import { analyzeSupplyPatterns, predictUpcomingBills } from '../../lib/patterns.js';
import { formatCategory } from '../../lib/categorize.js';

export function HomeDashboard({ onNavigate }) {
  const { data: supplies = [] } = useLiveQuery(() => db.supplies.toArray(), []);
  const { data: bills = [] } = useLiveQuery(() => db.bills.toArray(), []);

  const dueSoon = analyzeSupplyPatterns(supplies, { horizonDays: 7 });
  const upcomingBills = predictUpcomingBills(bills, 14).slice(0, 5);

  const totalSpend = supplies.reduce((s, i) => s + (Number(i.price) || 0), 0);

  return (
    <>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{supplies.length}</div>
          <div class="stat-label">Supply entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">₹{totalSpend.toFixed(0)}</div>
          <div class="stat-label">Tracked spend</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{bills.filter((b) => b.active !== false).length}</div>
          <div class="stat-label">Active bills</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{dueSoon.length}</div>
          <div class="stat-label">Items due soon</div>
        </div>
      </div>

      <h2 class="section-title">Restock suggestions</h2>
      {dueSoon.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Add supplies a few times — HomeRow learns your purchase rhythm and suggests restocks here.
        </p>
      ) : (
        dueSoon.slice(0, 5).map((item) => (
          <div key={item.key} class="suggestion-card">
            <span style="font-size: 1.5rem;">{item.emoji || '📦'}</span>
            <div style="flex: 1;">
              <div style="font-weight: 600;">
                {item.name}
                {item.brand ? ` · ${item.brand}` : ''}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Every ~{item.avgIntervalDays} days ·{' '}
                <span class={item.status === 'overdue' ? 'chip-danger' : 'chip-warn'}>
                  {item.status === 'overdue'
                    ? `${Math.abs(item.daysUntilDue)}d overdue`
                    : item.daysUntilDue <= 0
                      ? 'Due today'
                      : `Due in ${item.daysUntilDue}d`}
                </span>
              </div>
            </div>
            <button type="button" class="btn btn-primary" style="padding: 0.4rem 0.7rem; font-size: 0.75rem;" onClick={() => onNavigate?.('/supplies')}>
              Add
            </button>
          </div>
        ))
      )}

      <h2 class="section-title">Bills next 2 weeks</h2>
      {upcomingBills.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          No bills due soon.{' '}
          <button type="button" class="btn btn-ghost" style="display: inline; padding: 0;" onClick={() => onNavigate?.('/bills')}>
            Add bills
          </button>
        </p>
      ) : (
        <div class="list">
          {upcomingBills.map((b, i) => (
            <div key={`${b.id}-${i}`} class="list-item">
              <span class="item-emoji">💳</span>
              <div class="item-body">
                <div class="item-title">{b.name}</div>
                <div class="item-sub">
                  {b.dueDate} · {formatCategory(b.category)}
                </div>
              </div>
              <div class="item-meta" style="font-family: var(--mono); font-weight: 600;">
                ₹{Number(b.amount).toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-primary" onClick={() => onNavigate?.('/supplies')}>
          + Supply
        </button>
        <button type="button" class="btn btn-ghost" onClick={() => onNavigate?.('/analytics')}>
          Analytics
        </button>
      </div>
    </>
  );
}
