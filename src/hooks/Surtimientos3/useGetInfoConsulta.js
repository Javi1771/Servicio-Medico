import { useState, useCallback } from 'react';

export function useGetInfoConsulta() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getInfoConsulta = useCallback(async (clave) => {
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/Surtimientos3/getInfoConsulta?claveconsulta=${clave}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Folio no encontrado');
        throw new Error('Error al obtener datos');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, getInfoConsulta };
}