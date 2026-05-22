export function formatRupee(amount, { decimals = 0 } = {}) {
  if (amount == null || amount === '' || Number.isNaN(Number(amount))) return '';
  return `₹${Number(amount).toFixed(decimals)}`;
}
