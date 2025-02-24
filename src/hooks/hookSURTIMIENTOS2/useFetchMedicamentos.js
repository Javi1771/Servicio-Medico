// Hook: useFetchMedicamentos.js
import { useState, useEffect } from "react";

export default function useFetchMedicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedicamentos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/SURTIMIENTOS2/getMedicamentos");
      if (!response.ok) {
        throw new Error("Error al cargar los medicamentos.");
      }
      const data = await response.json();
      setMedicamentos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  return { medicamentos, loading, error };
}
