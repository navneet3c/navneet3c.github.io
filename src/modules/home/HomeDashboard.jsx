import { db } from '../../db/schema.js';
import { useLiveQuery } from '../../core/store.js';
import { fetchSupplyDashboardStats } from '../../db/suppliesQuery.js';
import { predictUpcomingBills } from '../../lib/patterns.js';
import { formatCategory } from '../../lib/categorize.js';
import { formatRupee } from '../../lib/formatMoney.js';

export function HomeDashboard({ onNavigate }) {
  const { data: supplyStats = { count: 0, totalSpend: 0, dueSoon: [] } } = useLiveQuery(
    () => fetchSupplyDashboardStats(7),
    [],
  );
  const { data: bills = [] } = useLiveQuery(() => db.bills.toArray(), []);

  const dueSoon = supplyStats.dueSoon || [];
  const upcomingBills = predictUpcomingBills(bills, 14).slice(0, 5);

  return (
    <>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{supplyStats.count}</div>
          <div class="stat-label">Supply entries</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{formatRupee(supplyStats.totalSpend)}</div>
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
            <button
              type="button"
              class="btn btn-primary"
              style="padding: 0.4rem 0.7rem; font-size: 0.75rem;"
              onClick={() => onNavigate?.('/supplies', { supplyKey: item.key })}
            >
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
              <div class="item-meta item-price">{formatRupee(b.amount)}</div>
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
