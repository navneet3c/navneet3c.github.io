import { useState, useMemo } from 'preact/hooks';
import { db } from '../../db/schema.js';
import { useLiveQuery } from '../../core/store.js';
import {
  analyzeSupplyPatterns,
  spendByCategory,
  spendOverTime,
  billsPerMonth,
  frequentItems,
} from '../../lib/patterns.js';
import { formatCategory } from '../../lib/categorize.js';
import { DoughnutChart, BarChart } from '../../components/Chart.jsx';

export function AnalyticsView() {
  const { data: supplies = [] } = useLiveQuery(() => db.supplies.toArray(), []);
  const { data: bills = [] } = useLiveQuery(() => db.bills.toArray(), []);
  const [timeGranularity, setTimeGranularity] = useState('week');

  const dueSoon = useMemo(() => analyzeSupplyPatterns(supplies, { horizonDays: 14 }), [supplies]);
  const frequent = useMemo(() => frequentItems(supplies, 6), [supplies]);
  const byCategory = useMemo(() => spendByCategory(supplies), [supplies]);
  const overTime = useMemo(
    () => spendOverTime(supplies, timeGranularity),
    [supplies, timeGranularity],
  );
  const billMonthly = useMemo(() => billsPerMonth(bills, 6), [bills]);

  const catLabels = byCategory.map((x) => formatCategory(x.category));
  const catValues = byCategory.map((x) => Math.round(x.total));

  const timeLabels = overTime.map((x) => x.period);
  const timeValues = overTime.map((x) => Math.round(x.total));

  const billLabels = billMonthly.map((x) => x.period);
  const billValues = billMonthly.map((x) => Math.round(x.total));

  return (
    <>
      <h2 class="section-title">Likely due soon</h2>
      {dueSoon.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Need at least 2 purchases per item to detect patterns.
        </p>
      ) : (
        <div class="list" style="margin-bottom: 1rem;">
          {dueSoon.map((item) => (
            <div key={item.key} class="suggestion-card">
              <span style="font-size: 1.4rem;">{item.emoji || '📦'}</span>
              <div style="flex: 1;">
                <strong>{item.name}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  ~every {item.avgIntervalDays}d · {formatCategory(item.category)}
                </div>
              </div>
              <span class={`chip ${item.status === 'overdue' ? 'chip-danger' : 'chip-warn'}`}>
                {item.daysUntilDue <= 0 ? 'Due' : `+${item.daysUntilDue}d`}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 class="section-title">Frequently bought</h2>
      {frequent.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">—</p>
      ) : (
        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem;">
          {frequent.map((item) => (
            <span key={`${item.name}-${item.brand}`} class="chip chip-accent">
              {item.emoji} {item.name} ×{item.purchaseCount}
            </span>
          ))}
        </div>
      )}

      <h2 class="section-title">Spend by category</h2>
      {byCategory.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">Add prices to supplies for charts.</p>
      ) : (
        <DoughnutChart labels={catLabels} values={catValues} />
      )}

      <h2 class="section-title">Spend over time</h2>
      <div style="display: flex; gap: 0.35rem; margin-bottom: 0.5rem;">
        <button
          type="button"
          class={`chip ${timeGranularity === 'week' ? 'chip-accent' : ''}`}
          onClick={() => setTimeGranularity('week')}
        >
          Weekly
        </button>
        <button
          type="button"
          class={`chip ${timeGranularity === 'month' ? 'chip-accent' : ''}`}
          onClick={() => setTimeGranularity('month')}
        >
          Monthly
        </button>
      </div>
      {overTime.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">—</p>
      ) : (
        <BarChart labels={timeLabels} values={timeValues} title="Supply spend" />
      )}

      <h2 class="section-title">Bills per month (est.)</h2>
      {bills.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">Add bills to see monthly estimates.</p>
      ) : (
        <BarChart labels={billLabels} values={billValues} title="Recurring bills (monthly equiv.)" />
      )}
    </>
  );
}
