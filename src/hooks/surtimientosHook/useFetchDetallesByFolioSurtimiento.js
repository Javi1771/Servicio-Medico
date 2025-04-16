import { useState } from "react";

export default function useFetchDetallesByFolioSurtimiento() {
  const [detalles, setDetalles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDetalles = async (folioSurtimiento) => {
    setLoading(true);
    setError(null);
    setDetalles([]); // Limpia los detalles anteriores antes de cargar nuevos

    try {
      const response = await fetch(
        `/api/surtimientos/getDetallesByFolioSurtimiento?folio=${folioSurtimiento}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      //console.log("Detalles recibidos del API:", result); // Depuración
      setDetalles(result); // Actualiza el estado con los resultados obtenidos
    } catch (err) {
      console.error("Error al obtener los detalles:", err.message);
      setError(err.message || "Error al buscar detalles.");
    } finally {
      setLoading(false);
    }
  };

  return { detalles, error, loading, fetchDetalles };
}
