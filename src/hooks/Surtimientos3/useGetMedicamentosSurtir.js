// src/hooks/Surtimientos3/useGetMedicamentosSurtir.js
import { useState, useCallback } from 'react';

export function useGetResurtimientos() {
  const [items, setItems] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [errorRes, setErrorRes] = useState('');

  const getResurtimientos = useCallback(async (folio) => {
    setErrorRes('');
    setLoadingRes(true);
    setItems([]);

    try {
      const res = await fetch(
        `/api/Surtimientos3/getMedicamentosResurtir?folioReceta=${encodeURIComponent(folio)}`
      );
      if (!res.ok) {
        throw new Error('No se pudo obtener los medicamentos');
      }
      const json = await res.json();

      // json = { isInterconsulta: boolean, items: [...] }
      setItems(Array.isArray(json.items) ? json.items : []);
    } catch (err) {
      setErrorRes(err.message);
    } finally {
      setLoadingRes(false);
    }
  }, []);

  return { items, loadingRes, errorRes, getResurtimientos };
}
