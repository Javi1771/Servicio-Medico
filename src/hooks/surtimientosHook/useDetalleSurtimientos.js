import { useState, useEffect } from "react";

const useDetalleSurtimientos = (folioSurtimiento) => {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalles = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/surtimientos/getDetalleSurtimientos?folioSurtimiento=${folioSurtimiento}`);
        if (!response.ok) {
          throw new Error("Error al obtener los detalles de surtimientos");
        }
        const data = await response.json();
        setDetalles(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (folioSurtimiento) {
      fetchDetalles();
    }
  }, [folioSurtimiento]);

  return { detalles, loading, error };
};

export default useDetalleSurtimientos;