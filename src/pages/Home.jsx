import { useCallback, useEffect, useState } from 'react';
import { GetEstaciones } from '../api/getData';

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
      console.error(err);
      setError('Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <Header />
      <Main data={data} type="home" loading={loading} error={error} onRetry={loadData} />
      <Footer />
    </>
  );
}

export default Home;
