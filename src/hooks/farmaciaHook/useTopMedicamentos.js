// hooks/farmaciaHook/useTopMedicamentos.js
import { useState, useEffect } from 'react';

export default function useTopMedicamentos(selectedDate) {
  const [topMedicamentos, setTopMedicamentos] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [errorTop, setErrorTop] = useState(null);

  useEffect(() => {
    // Si no hay fecha, no hacemos la petición
    if (!selectedDate) {
      setLoadingTop(false);
      return;
    }

    const fetchTopMedicamentos = async () => {
      setLoadingTop(true);
      setErrorTop(null);

      try {
        const res = await fetch(`/api/farmacia/topMedicamentos?date=${selectedDate}`);
        if (!res.ok) {
          throw new Error('Error al obtener los top medicamentos');
        }
        const data = await res.json();
        setTopMedicamentos(data);
      } catch (error) {
        setErrorTop(error.message);
      } finally {
        setLoadingTop(false);
      }
    };

    fetchTopMedicamentos();
  }, [selectedDate]);

  return { topMedicamentos, loadingTop, errorTop };
}
