// hooks/usePendientes.js
import { useState, useEffect } from 'react';

const usePendientes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendientes = async () => {
      try {
        const res = await fetch('/api/farmacia/recetasPendientes');
        if (!res.ok) {
          throw new Error('Error al obtener las recetas pendientes xdxdx');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPendientes();
  }, []);

  return { data, loading, error };
};

export default usePendientes;
