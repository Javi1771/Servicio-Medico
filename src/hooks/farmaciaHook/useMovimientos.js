import { useState, useEffect } from "react";

export const useMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMovimientos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/farmacia/obtenerMovimientos");
      const data = await response.json();
      if (response.ok) {
        setMovimientos(data);
      } else {
        setError(data.message || "Error al obtener los movimientos.");
      }
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
      setError("Error interno del servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  return { movimientos, loading, error };
};
