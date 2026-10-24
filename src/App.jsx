import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Home from './pages/Home';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

const Estaciones = lazy(() => import('./pages/Estaciones'));
const Distribuidores = lazy(() => import('./pages/Distribuidores'));
const NotFound = lazy(() => import('./components/NotFound'));

const PageLoader = () => (
  <main className="main">
    <div className="page">
      <div className="skeleton skeleton--hero" />
      <div className="cards-grid">
        {[0, 1, 2, 3, 4].map((item) => (
          <div className="skeleton skeleton--card" key={item} />
        ))}
      </div>
    </div>
  </main>
);

function App() {
  return (
    <ErrorBoundary>
      <div className="contenedor">
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/estaciones" element={<Estaciones />} />
              <Route path="/distribuidores" element={<Distribuidores />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
    </ErrorBoundary>
  );
}

export default App;
