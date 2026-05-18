import { useEffect, useState } from 'preact/hooks';
import { MODULES, resolveRoute } from './core/registry.js';
import { Layout } from './components/Layout.jsx';
import { getPath, navigateTo, onRouteChange } from './lib/router.js';

export function App() {
  const [route, setRoute] = useState(() => resolveRoute(getPath()));

  useEffect(() => onRouteChange((path) => setRoute(resolveRoute(path))), []);

  const navigate = (path) => {
    navigateTo(path);
    setRoute(resolveRoute(path));
  };

  const View = route.component;

  return (
    <Layout
      title="HomeRow"
      modules={MODULES}
      currentPath={route.path}
      onNavigate={navigate}
    >
      <View onNavigate={navigate} />
    </Layout>
  );
}
