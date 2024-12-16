import { useState } from "react";

export default function useFetchDetallesByFolioPase() {
  const [detalles, setDetalles] = useState([]);
  const [folioSurtimiento, setFolioSurtimiento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetallesByFolioPase = async (folioPase) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/surtimientos/getDetallesByFolioPase?folioPase=${folioPase}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error desconocido");
      }

      setFolioSurtimiento(data.folioSurtimiento);
      setDetalles(data.detalles);
    } catch (err) {
      console.error("Error al obtener detalles:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { detalles, folioSurtimiento, loading, error, fetchDetallesByFolioPase };
}
