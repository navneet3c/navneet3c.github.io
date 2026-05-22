import { SuppliesView } from '../modules/supplies/SuppliesView.jsx';
import { DiningView } from '../modules/dining/DiningView.jsx';
import { BillsView } from '../modules/bills/BillsView.jsx';
import { AnalyticsView } from '../modules/analytics/AnalyticsView.jsx';
import { BackupView } from '../modules/backup/BackupView.jsx';
import { HomeDashboard } from '../modules/home/HomeDashboard.jsx';

/**
 * Extensibility: add a module by creating `src/modules/<id>/` with a view component,
 * then register it here. Shared DB tables live in `src/db/schema.js`; domain logic in `src/lib/`.
 */
export const MODULES = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    path: '/',
    component: HomeDashboard,
    nav: true,
  },
  {
    id: 'supplies',
    label: 'Supplies',
    icon: '📦',
    path: '/supplies',
    component: SuppliesView,
    nav: true,
  },
  {
    id: 'dining',
    label: 'Dining',
    icon: '🍽️',
    path: '/dining',
    component: DiningView,
    nav: true,
  },
  {
    id: 'bills',
    label: 'Bills',
    icon: '💳',
    path: '/bills',
    component: BillsView,
    nav: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📊',
    path: '/analytics',
    component: AnalyticsView,
    nav: true,
  },
  {
    id: 'backup',
    label: 'Backup',
    icon: '☁️',
    path: '/backup',
    component: BackupView,
    nav: false,
  },
];

export function resolveRoute(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';
  return MODULES.find((m) => m.path === path) || MODULES[0];
}
