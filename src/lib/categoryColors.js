/** Muted tints for dark UI — stable per category id */
const SUPPLY_BUILTIN = {
  grocery: { bg: 'rgba(127, 184, 122, 0.14)', border: 'rgba(127, 184, 122, 0.28)' },
  food: { bg: 'rgba(210, 165, 110, 0.14)', border: 'rgba(210, 165, 110, 0.28)' },
  cosmetics: { bg: 'rgba(198, 145, 188, 0.14)', border: 'rgba(198, 145, 188, 0.28)' },
  health: { bg: 'rgba(118, 188, 210, 0.14)', border: 'rgba(118, 188, 210, 0.28)' },
  household: { bg: 'rgba(155, 172, 205, 0.14)', border: 'rgba(155, 172, 205, 0.28)' },
  electronics: { bg: 'rgba(108, 158, 218, 0.14)', border: 'rgba(108, 158, 218, 0.28)' },
  other: { bg: 'rgba(139, 156, 179, 0.12)', border: 'rgba(139, 156, 179, 0.24)' },
};

const BILL_BUILTIN = {
  utilities: { bg: 'rgba(228, 188, 96, 0.14)', border: 'rgba(228, 188, 96, 0.3)' },
  rent: { bg: 'rgba(178, 132, 215, 0.14)', border: 'rgba(178, 132, 215, 0.3)' },
  subscription: { bg: 'rgba(228, 138, 158, 0.14)', border: 'rgba(228, 138, 158, 0.3)' },
  insurance: { bg: 'rgba(102, 178, 205, 0.14)', border: 'rgba(102, 178, 205, 0.3)' },
  loan: { bg: 'rgba(205, 128, 128, 0.14)', border: 'rgba(205, 128, 128, 0.3)' },
  internet: { bg: 'rgba(108, 158, 218, 0.14)', border: 'rgba(108, 158, 218, 0.3)' },
  mobile: { bg: 'rgba(132, 192, 172, 0.14)', border: 'rgba(132, 192, 172, 0.3)' },
  other: { bg: 'rgba(139, 156, 179, 0.12)', border: 'rgba(139, 156, 179, 0.24)' },
};

function hueFromCategory(category) {
  let h = 0;
  const s = category || 'other';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function styleFromPreset(preset) {
  return { background: preset.bg, borderColor: preset.border };
}

function styleFromHash(category) {
  const hue = hueFromCategory(category);
  return {
    background: `hsla(${hue}, 32%, 42%, 0.14)`,
    borderColor: `hsla(${hue}, 32%, 48%, 0.3)`,
  };
}

const DINING_BUILTIN = {
  breakfast: { bg: 'rgba(230, 195, 120, 0.14)', border: 'rgba(230, 195, 120, 0.3)' },
  dine_in: { bg: 'rgba(210, 140, 110, 0.14)', border: 'rgba(210, 140, 110, 0.3)' },
  snacks: { bg: 'rgba(200, 160, 200, 0.14)', border: 'rgba(200, 160, 200, 0.3)' },
  travel: { bg: 'rgba(120, 175, 210, 0.14)', border: 'rgba(120, 175, 210, 0.3)' },
  other: { bg: 'rgba(139, 156, 179, 0.12)', border: 'rgba(139, 156, 179, 0.24)' },
};

const STYLE_TABLES = {
  supply: SUPPLY_BUILTIN,
  bill: BILL_BUILTIN,
  dining: DINING_BUILTIN,
};

/** @param {'supply' | 'bill' | 'dining'} kind */
export function getCategoryStyle(category, kind = 'supply') {
  const id = category || 'other';
  const table = STYLE_TABLES[kind] || SUPPLY_BUILTIN;
  const preset = table[id];
  if (preset) return styleFromPreset(preset);
  return styleFromHash(id);
}
