/** Hash routing so deep links work on static GitHub Pages without server rewrites. */

export function getPath() {
  const hash = window.location.hash.slice(1);
  if (!hash) return '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export function navigateTo(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (getPath() !== normalized) {
    window.location.hash = normalized;
  }
}

export function onRouteChange(handler) {
  const listener = () => handler(getPath());
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}
