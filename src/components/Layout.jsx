import { ActionButton } from './ActionButton.jsx';

export function Layout({ title, modules, currentPath, onNavigate, children }) {
  const navModules = modules.filter((m) => m.nav);

  return (
    <div class="app-shell">
      <header class="app-header">
        <h1>
          <span class="logo">🏠</span> {title}
        </h1>
        <ActionButton
          class="btn btn-ghost"
          style="padding: 0.4rem 0.6rem; font-size: 1.1rem;"
          label="Backup & settings"
          onClick={() => onNavigate('/backup')}
        >
          ☁️
        </ActionButton>
      </header>
      <main class="app-main">{children}</main>
      <nav class="bottom-nav" aria-label="Main">
        <div class="bottom-nav-inner">
          {navModules.map((m) => (
            <button
              key={m.id}
              type="button"
              class={`nav-item ${currentPath === m.path ? 'active' : ''}`}
              onClick={() => onNavigate(m.path)}
            >
              <span class="nav-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
