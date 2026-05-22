import { db } from '../db/schema.js';
import { suggestCategoryAndEmoji } from './categorize.js';
import { guessDiningCategory, guessDiningEmoji } from './diningSuggestions.js';

const SUPPLY_GROUPS = [
  { name: 'Milk', brand: 'Amul', size: '1L', price: [58, 62, 60] },
  { name: 'Bread', brand: 'Britannia', size: '400g', price: [45, 48] },
  { name: 'Rice', brand: 'India Gate', size: '5kg', price: [520, 535] },
  { name: 'Eggs', brand: '', size: '12 pcs', price: [92, 88, 95] },
  { name: 'Bananas', brand: '', size: '1 dozen', price: [60, 55] },
  { name: 'Detergent', brand: 'Surf Excel', size: '2kg', price: [289, 299] },
  { name: 'Dish soap', brand: 'Vim', size: '750ml', price: [110, 115] },
  { name: 'Toilet paper', brand: 'Origami', size: '4 roll', price: [180, 175] },
  { name: 'Shampoo', brand: 'Head & Shoulders', size: '340ml', price: [320, 335] },
  { name: 'Toothpaste', brand: 'Colgate', size: '200g', price: [95, 99] },
  { name: 'Cooking oil', brand: 'Fortune', size: '1L', price: [165, 172] },
  { name: 'Chicken', brand: '', size: '1kg', price: [280, 295, 270] },
  { name: 'Coffee', brand: 'Nescafe', size: '200g', price: [450, 465] },
  { name: 'AA batteries', brand: 'Duracell', size: '4 pack', price: [220] },
  { name: 'Hand sanitizer', brand: 'Dettol', size: '200ml', price: [85, 90] },
  { name: 'Yogurt', brand: 'Mother Dairy', size: '400g', price: [35, 38, 36] },
  { name: 'Frozen pizza', brand: 'McCain', size: '400g', price: [199] },
  { name: 'LED bulb', brand: 'Philips', size: '9W', price: [149] },
];

const BILL_TEMPLATES = [
  { name: 'Electricity', category: 'utilities', amount: 1850, frequency: 'monthly', dueOffset: 5 },
  { name: 'Rent', category: 'rent', amount: 22000, frequency: 'monthly', dueOffset: 1 },
  { name: 'Broadband', category: 'internet', amount: 799, frequency: 'monthly', dueOffset: 12 },
  { name: 'Mobile plan', category: 'mobile', amount: 599, frequency: 'monthly', dueOffset: 18 },
  { name: 'Netflix', category: 'subscription', amount: 649, frequency: 'monthly', dueOffset: 22 },
  { name: 'Spotify', category: 'subscription', amount: 119, frequency: 'monthly', dueOffset: 8 },
  { name: 'Health insurance', category: 'insurance', amount: 4200, frequency: 'quarterly', dueOffset: 40 },
  { name: 'Gym', category: 'subscription', amount: 1500, frequency: 'monthly', dueOffset: 3 },
  { name: 'Water tanker', category: 'utilities', amount: 450, frequency: 'biweekly', dueOffset: 6 },
  { name: 'Amazon Prime', category: 'subscription', amount: 1499, frequency: 'yearly', dueOffset: 120 },
];

const DINING_GROUPS = [
  { name: 'Masala dosa', location: 'Saravana Bhavan', cost: [120, 130, 125] },
  { name: 'Filter coffee', location: 'Blue Tokai', cost: [180, 195, 190] },
  { name: 'Chicken biryani', location: 'Meghana Foods', cost: [280, 295, 310] },
  { name: 'Margherita pizza', location: 'Domino\'s', cost: [399, 449] },
  { name: 'Samosa & chai', location: 'Office canteen', cost: [40, 45, 42] },
  { name: 'Club sandwich', location: 'BLR Airport T2', cost: [320, 350] },
  { name: 'Veg thali', location: 'MTR', cost: [220, 235] },
  { name: 'Paneer butter masala', location: 'Punjabi Rasoi', cost: [340, 360, 355] },
  { name: 'Iced latte', location: 'Third Wave', cost: [210, 225] },
  { name: 'Burger meal', location: 'McDonald\'s', cost: [249, 269] },
  { name: 'Momos', location: 'Wow Momo', cost: [99, 110] },
  { name: 'South Indian breakfast', location: 'Home', cost: [0], notes: 'cooked at home' },
  { name: 'Sushi platter', location: 'Harima', cost: [890, 950] },
  { name: 'Highway dhaba lunch', location: 'NH48', cost: [180, 200] },
  { name: 'Ice cream', location: 'Corner House', cost: [85, 95] },
];

const PURCHASE_OFFSETS = [3, 10, 17, 24, 31, 38, 45, 52, 60, 68, 75, 82];

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function dueInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function jitter(base, pct = 0.08) {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

function buildDiningRows(now = new Date().toISOString()) {
  const dining = [];

  for (const group of DINING_GROUPS) {
    const category = group.category || guessDiningCategory(group.name, group.location);
    const emoji = group.emoji || guessDiningEmoji(group.name, group.location, category);
    const visitCount = 1 + Math.floor(Math.random() * 3);
    const offsets = [...PURCHASE_OFFSETS].sort(() => Math.random() - 0.5).slice(0, visitCount);

    offsets.forEach((daysBack, i) => {
      const baseCost = group.cost[i % group.cost.length] ?? group.cost[0];
      const cost = baseCost > 0 ? jitter(baseCost, 0.06) : undefined;
      dining.push({
        name: group.name,
        location: group.location || undefined,
        cost,
        notes: group.notes || undefined,
        category,
        emoji,
        spentAt: daysAgo(daysBack + Math.floor(Math.random() * 4)),
        createdAt: now,
      });
    });
  }

  return dining;
}

export async function isDatabaseEmpty() {
  const [supplies, bills] = await Promise.all([db.supplies.count(), db.bills.count()]);
  return supplies === 0 && bills === 0;
}

export async function seedDemoData() {
  const now = new Date().toISOString();
  const supplies = [];

  for (const group of SUPPLY_GROUPS) {
    const { category, emoji } = suggestCategoryAndEmoji(group.name, group.brand);
    const purchaseCount = 1 + Math.floor(Math.random() * 3);
    const offsets = [...PURCHASE_OFFSETS].sort(() => Math.random() - 0.5).slice(0, purchaseCount);

    offsets.forEach((daysBack, i) => {
      const basePrice = group.price[i % group.price.length] ?? group.price[0];
      supplies.push({
        name: group.name,
        brand: group.brand || undefined,
        size: group.size,
        price: jitter(basePrice),
        category,
        emoji,
        purchasedAt: daysAgo(daysBack + Math.floor(Math.random() * 4)),
        createdAt: now,
      });
    });
  }

  const bills = BILL_TEMPLATES.map((t) => ({
    name: t.name,
    category: t.category,
    amount: t.amount,
    frequency: t.frequency,
    nextDue: dueInDays(t.dueOffset + Math.floor(Math.random() * 5)),
    lastPaid: daysAgo(28 + Math.floor(Math.random() * 14)).slice(0, 10),
    active: Math.random() > 0.1,
    createdAt: now,
  }));

  const dining = buildDiningRows(now);

  await db.transaction('rw', db.supplies, db.bills, db.dining, async () => {
    await db.supplies.bulkAdd(supplies);
    await db.bills.bulkAdd(bills);
    await db.dining.bulkAdd(dining);
  });

  return { supplies: supplies.length, bills: bills.length, dining: dining.length };
}

export async function seedDiningIfEmpty() {
  if ((await db.dining.count()) > 0) return null;
  const dining = buildDiningRows();
  await db.dining.bulkAdd(dining);
  return { dining: dining.length };
}

export async function seedIfEmpty() {
  if (await isDatabaseEmpty()) {
    return seedDemoData();
  }
  return null;
}
