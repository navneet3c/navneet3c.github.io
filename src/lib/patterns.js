const MS_DAY = 24 * 60 * 60 * 1000;

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function groupKey(item) {
  const name = (item.name || '').toLowerCase().trim();
  const brand = (item.brand || '').toLowerCase().trim();
  return brand ? `${name}|${brand}` : name;
}

export function analyzeSupplyPatterns(supplies, { horizonDays = 7 } = {}) {
  const groups = new Map();

  for (const s of supplies) {
    const key = groupKey(s);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  const now = Date.now();
  const horizon = horizonDays * MS_DAY;
  const suggestions = [];

  for (const [, items] of groups) {
    items.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
    if (items.length < 2) continue;

    const intervals = [];
    for (let i = 0; i < items.length - 1; i++) {
      const a = new Date(items[i].purchasedAt).getTime();
      const b = new Date(items[i + 1].purchasedAt).getTime();
      const days = (a - b) / MS_DAY;
      if (days > 0 && days < 365) intervals.push(days);
    }

    const avgDays = median(intervals);
    if (!avgDays || avgDays < 1) continue;

    const latest = items[0];
    const lastPurchase = new Date(latest.purchasedAt).getTime();
    const nextDue = lastPurchase + avgDays * MS_DAY;
    const daysUntilDue = (nextDue - now) / MS_DAY;

    if (daysUntilDue <= horizonDays) {
      suggestions.push({
        key: groupKey(latest),
        name: latest.name,
        brand: latest.brand,
        category: latest.category,
        emoji: latest.emoji,
        avgIntervalDays: Math.round(avgDays),
        lastPurchasedAt: latest.purchasedAt,
        nextDueAt: new Date(nextDue).toISOString(),
        daysUntilDue: Math.round(daysUntilDue),
        status: daysUntilDue < 0 ? 'overdue' : daysUntilDue <= 3 ? 'soon' : 'upcoming',
        purchaseCount: items.length,
      });
    }
  }

  return suggestions.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export function frequentItems(supplies, limit = 8) {
  const counts = new Map();
  for (const s of supplies) {
    const key = groupKey(s);
    if (!key) continue;
    const cur = counts.get(key) || { count: 0, item: s };
    cur.count += 1;
    if (new Date(s.purchasedAt) > new Date(cur.item.purchasedAt)) cur.item = s;
    counts.set(key, cur);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ count, item }) => ({ ...item, purchaseCount: count }));
}

export function spendByCategory(supplies) {
  const map = new Map();
  for (const s of supplies) {
    if (!s.price || s.price <= 0) continue;
    const cat = s.category || 'other';
    map.set(cat, (map.get(cat) || 0) + Number(s.price));
  }
  return [...map.entries()].map(([category, total]) => ({ category, total }));
}

export function spendOverTime(supplies, granularity = 'week') {
  const map = new Map();
  for (const s of supplies) {
    if (!s.price || s.price <= 0) continue;
    const d = new Date(s.purchasedAt);
    let key;
    if (granularity === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      key = start.toISOString().slice(0, 10);
    }
    map.set(key, (map.get(key) || 0) + Number(s.price));
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, total]) => ({ period, total }));
}

export function predictUpcomingBills(bills, daysAhead = 45) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + daysAhead);

  const upcoming = [];

  for (const bill of bills.filter((b) => b.active !== false)) {
    let due = bill.nextDue ? new Date(bill.nextDue) : null;
    if (!due && bill.lastPaid) {
      due = advanceDue(new Date(bill.lastPaid), bill.frequency);
    }
    if (!due) due = new Date(now);

    while (due <= horizon) {
      if (due >= now) {
        upcoming.push({
          ...bill,
          dueDate: due.toISOString().slice(0, 10),
          daysUntil: Math.round((due - now) / MS_DAY),
        });
      }
      due = advanceDue(due, bill.frequency);
    }
  }

  return upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function advanceDue(from, frequency) {
  const d = new Date(from);
  switch (frequency) {
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
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export function billsPerMonth(bills, months = 6) {
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    for (const bill of bills.filter((b) => b.active !== false)) {
      const perMonth = monthlyEquivalent(bill.amount, bill.frequency);
      total += perMonth;
    }
    result.push({ period: key, total });
  }
  return result;
}

function monthlyEquivalent(amount, frequency) {
  const a = Number(amount) || 0;
  switch (frequency) {
    case 'weekly':
      return a * (52 / 12);
    case 'biweekly':
      return a * (26 / 12);
    case 'quarterly':
      return a / 3;
    case 'yearly':
      return a / 12;
    default:
      return a;
  }
}
