import { useState, useEffect } from "react";

const useHistorialSurtimientos = (folioPase) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const response = await fetch(`/api/surtimientos/getHistorialSurtimientos?folioPase=${folioPase}`);
        const data = await response.json();

        if (!data.success) {
          setHistorial([]);
        } else {
          setHistorial(data.data);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (folioPase) {
      fetchHistorial();
    }
  }, [folioPase]);

  return { historial, loading, error };
};

export default useHistorialSurtimientos;