import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Estaciones from './pages/Estaciones';
import Distribuidores from './pages/Distribuidores';
import NotFound from './components/NotFound';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <div className="contenedor">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estaciones" element={<Estaciones />} />
          <Route path="/distribuidores" element={<Distribuidores />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
