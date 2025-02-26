// useSurtimientos.js
import { useState } from 'react';

const useSurtimientos = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSurtimientos = async (barcode) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/farmacia/getSurtimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode })
      });
      if (!res.ok) throw new Error('Error en la consulta');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return { data, setData, loading, error, fetchSurtimientos };
};

export default useSurtimientos;
