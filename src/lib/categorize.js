const RULES = [
  {
    category: 'grocery',
    emoji: '🛒',
    keywords: [
      'milk', 'bread', 'rice', 'flour', 'sugar', 'salt', 'oil', 'butter', 'egg', 'eggs',
      'cheese', 'yogurt', 'cereal', 'pasta', 'noodle', 'dal', 'lentil', 'beans', 'tea',
      'coffee', 'juice', 'water bottle', 'snack', 'chips', 'biscuit', 'cookie', 'honey',
      'jam', 'ketchup', 'sauce', 'spice', 'masala', 'onion', 'potato', 'tomato', 'vegetable',
      'fruit', 'apple', 'banana', 'orange', 'grocery', 'atta', 'ghee',
    ],
  },
  {
    category: 'food',
    emoji: '🍽️',
    keywords: [
      'meal', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'sandwich', 'chicken',
      'fish', 'meat', 'frozen', 'ice cream', 'chocolate', 'candy', 'sweet', 'restaurant',
      'takeout', 'delivery', 'ready to eat', 'instant', 'noodle cup', 'ramen',
    ],
  },
  {
    category: 'cosmetics',
    emoji: '💄',
    keywords: [
      'shampoo', 'conditioner', 'soap', 'body wash', 'lotion', 'cream', 'moisturizer',
      'sunscreen', 'perfume', 'deodorant', 'toothpaste', 'toothbrush', 'razor', 'shaving',
      'makeup', 'lipstick', 'foundation', 'serum', 'face wash', 'skincare', 'hair oil',
      'nail', 'cosmetic', 'beauty', 'facewash',
    ],
  },
  {
    category: 'health',
    emoji: '💊',
    keywords: [
      'medicine', 'tablet', 'pill', 'vitamin', 'supplement', 'bandage', 'first aid',
      'thermometer', 'mask', 'sanitizer', 'hand sanitizer', 'paracetamol', 'ibuprofen',
      'aspirin', 'cough', 'cold', 'pain relief', 'protein powder', 'pharmacy', 'health',
    ],
  },
  {
    category: 'household',
    emoji: '🧹',
    keywords: [
      'detergent', 'dishwash', 'dish soap', 'cleaner', 'bleach', 'tissue', 'toilet paper',
      'paper towel', 'trash bag', 'garbage bag', 'sponge', 'mop', 'broom', 'vacuum',
      'battery', 'bulb', 'light bulb', 'tape', 'foil', 'wrap', 'ziploc', 'laundry',
      'fabric softener', 'air freshener', 'insect', 'pest',
    ],
  },
  {
    category: 'electronics',
    emoji: '🔌',
    keywords: [
      'charger', 'cable', 'usb', 'adapter', 'battery pack', 'power bank', 'headphone',
      'earphone', 'speaker', 'mouse', 'keyboard', 'hdmi', 'extension cord', 'bulb led',
    ],
  },
];

const ITEM_EMOJI = {
  milk: '🥛', bread: '🍞', rice: '🍚', egg: '🥚', eggs: '🥚', cheese: '🧀',
  butter: '🧈', apple: '🍎', banana: '🍌', orange: '🍊', coffee: '☕', tea: '🍵',
  water: '💧', pizza: '🍕', burger: '🍔', chicken: '🍗', fish: '🐟', chocolate: '🍫',
  shampoo: '🧴', soap: '🧼', toothpaste: '🪥', medicine: '💊', vitamin: '💊',
  detergent: '🫧', tissue: '🧻', battery: '🔋', charger: '🔌', oil: '🫒', sugar: '🧂',
  salt: '🧂', honey: '🍯', yogurt: '🥛', pasta: '🍝', onion: '🧅', potato: '🥔',
  tomato: '🍅', chips: '🥔', 'ice cream': '🍦', flour: '🌾', dal: '🫘',
};

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

export function suggestCategoryAndEmoji(name, brand = '') {
  const haystack = normalize(`${name} ${brand}`);
  let best = { category: 'other', emoji: '📦', score: 0 };

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (haystack.includes(kw)) score += kw.length;
    }
    if (score > best.score) {
      best = { category: rule.category, emoji: rule.emoji, score };
    }
  }

  for (const [word, emoji] of Object.entries(ITEM_EMOJI)) {
    if (haystack.includes(word)) {
      return { category: best.category, emoji };
    }
  }

  return { category: best.category, emoji: best.emoji };
}

export function formatCategory(cat) {
  if (!cat) return 'Other';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}
