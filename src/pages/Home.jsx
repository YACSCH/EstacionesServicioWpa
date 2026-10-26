import { useCallback, useEffect, useState } from 'react';
import { GetEstaciones } from '../api/getData';
import { apiErrorMessage } from '../utils/errors';

import Header from '../components/Header';
import Footer from '../components/Footer';
import Main from '../components/Main';

function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetEstaciones();
      setData(response.data);
    } catch (err) {
      // Solo mensaje/estado: el objeto de axios incluye cabeceras (Authorization).
      console.error('No se pudieron cargar las estaciones:', err?.response?.status || err?.message || 'error desconocido');
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const response = await GetEstaciones();
      setData(response.data);
      return true;
    } catch (err) {
      console.error('No se pudieron actualizar las estaciones:', err?.response?.status || err?.message || 'error desconocido');
      return false;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <Header />
      <Main
        data={data}
        type="home"
        loading={loading}
        error={error}
        onRetry={loadData}
        onRefresh={refreshData}
      />
      <Footer />
    </>
  );
}

export default Home;
