import { useState, useMemo } from 'preact/hooks';
import { db } from '../../db/schema.js';
import { fetchAllSuppliesLite } from '../../db/suppliesQuery.js';
import { fetchAllDiningLite } from '../../db/diningQuery.js';
import { useLiveQuery } from '../../core/store.js';
import {
  analyzeSupplyPatterns,
  spendByCategory,
  spendOverTime,
  filterByDateRange,
  billsPerMonth,
  frequentItems,
} from '../../lib/patterns.js';
import { formatCategory } from '../../lib/categorize.js';
import { DateRangeToolbar } from '../../components/DateRangeToolbar.jsx';
import { DEFAULT_ANALYTICS_DATE_PRESET } from '../../lib/constants.js';
import { useDateRangeFilter } from '../../lib/useDateRangeFilter.js';
import { DoughnutChart, BarChart } from '../../components/Chart.jsx';

export function AnalyticsView() {
  const { data: supplies = [] } = useLiveQuery(() => fetchAllSuppliesLite(), []);
  const { data: dining = [] } = useLiveQuery(() => fetchAllDiningLite(), []);
  const { data: bills = [] } = useLiveQuery(() => db.bills.toArray(), []);

  const {
    datePreset,
    setDatePreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateRange,
    dateLabel,
  } = useDateRangeFilter(DEFAULT_ANALYTICS_DATE_PRESET);
  const [timeGranularity, setTimeGranularity] = useState('week');

  const suppliesInRange = useMemo(
    () => filterByDateRange(supplies, dateRange.from, dateRange.to, 'purchasedAt'),
    [supplies, dateRange.from, dateRange.to],
  );

  const diningInRange = useMemo(
    () => filterByDateRange(dining, dateRange.from, dateRange.to, 'spentAt'),
    [dining, dateRange.from, dateRange.to],
  );

  const dueSoon = useMemo(
    () => analyzeSupplyPatterns(suppliesInRange, { horizonDays: 14 }),
    [suppliesInRange],
  );
  const frequent = useMemo(() => frequentItems(suppliesInRange, 6), [suppliesInRange]);
  const supplyByCategory = useMemo(() => spendByCategory(suppliesInRange), [suppliesInRange]);
  const supplyOverTime = useMemo(
    () => spendOverTime(suppliesInRange, timeGranularity),
    [suppliesInRange, timeGranularity],
  );

  const diningByCategory = useMemo(
    () => spendByCategory(diningInRange, { amountField: 'cost' }),
    [diningInRange],
  );
  const diningOverTime = useMemo(
    () =>
      spendOverTime(diningInRange, timeGranularity, {
        amountField: 'cost',
        dateField: 'spentAt',
      }),
    [diningInRange, timeGranularity],
  );

  const billMonthly = useMemo(() => billsPerMonth(bills, 6), [bills]);

  const supplyCatLabels = supplyByCategory.map((x) => formatCategory(x.category));
  const supplyCatValues = supplyByCategory.map((x) => Math.round(x.total));

  const supplyTimeLabels = supplyOverTime.map((x) => x.period);
  const supplyTimeValues = supplyOverTime.map((x) => Math.round(x.total));

  const diningCatLabels = diningByCategory.map((x) => formatCategory(x.category));
  const diningCatValues = diningByCategory.map((x) => Math.round(x.total));

  const diningTimeLabels = diningOverTime.map((x) => x.period);
  const diningTimeValues = diningOverTime.map((x) => Math.round(x.total));

  const billLabels = billMonthly.map((x) => x.period);
  const billValues = billMonthly.map((x) => Math.round(x.total));

  return (
    <>
      <DateRangeToolbar
        datePreset={datePreset}
        onPresetChange={setDatePreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />
      <p class="list-summary" style="margin-top: -0.25rem;">
        Charts use <strong>{dateLabel}</strong> for supplies and dining.
      </p>

      <h2 class="section-title">Likely due soon</h2>
      {dueSoon.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Need at least 2 purchases per item in this period to detect patterns.
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

      <h2 class="section-title">Supply spend by category</h2>
      {supplyByCategory.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">Add prices to supplies for charts.</p>
      ) : (
        <DoughnutChart labels={supplyCatLabels} values={supplyCatValues} />
      )}

      <h2 class="section-title">Dining spend by category</h2>
      {diningByCategory.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Log meals with cost in Dining to see category breakdown.
        </p>
      ) : (
        <DoughnutChart labels={diningCatLabels} values={diningCatValues} />
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
      {supplyOverTime.length === 0 && diningOverTime.length === 0 ? (
        <p style="color: var(--text-muted); font-size: 0.9rem;">—</p>
      ) : (
        <>
          {supplyOverTime.length > 0 && (
            <BarChart labels={supplyTimeLabels} values={supplyTimeValues} title="Supplies" />
          )}
          {diningOverTime.length > 0 && (
            <div style={supplyOverTime.length > 0 ? 'margin-top: 1rem;' : ''}>
              <BarChart labels={diningTimeLabels} values={diningTimeValues} title="Dining" />
            </div>
          )}
        </>
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
