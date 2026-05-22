/** One-shot navigation payload (hash router has no location.state). */

let pendingSupplyPrefillKey = null;
const supplyPrefillListeners = new Set();

export function setPendingSupplyPrefill(key) {
  if (!key) return;
  pendingSupplyPrefillKey = key;
  for (const fn of supplyPrefillListeners) fn();
}

export function consumePendingSupplyPrefill() {
  const key = pendingSupplyPrefillKey;
  pendingSupplyPrefillKey = null;
  return key;
}

export function subscribeSupplyPrefill(listener) {
  supplyPrefillListeners.add(listener);
  return () => supplyPrefillListeners.delete(listener);
}
