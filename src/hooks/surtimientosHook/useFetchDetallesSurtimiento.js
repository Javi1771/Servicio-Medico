import { useState, useCallback } from "react";

export default function useFetchDetallesSurtimiento() {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetallesSurtimiento = useCallback(async (folioSurtimiento) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/surtimientos/getDetallesSurtimiento?folioSurtimiento=${folioSurtimiento}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setDetalles(data);
    } catch (err) {
      console.error("Error al obtener detalles:", err.message);
      setError(err.message || "Error al cargar los detalles.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { detalles, loading, error, fetchDetallesSurtimiento };
}
