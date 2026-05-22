import { render } from 'preact';
import { App } from './app.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { seedIfEmpty, seedDiningIfEmpty } from './lib/seed.js';
import './styles/global.css';

const root = document.getElementById('app');

Promise.all([seedIfEmpty(), seedDiningIfEmpty()]).finally(() => {
  render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
    root,
  );
});
