import { useState } from "react";

export default function useFetchSindicato() {
  const [sindicato, setSindicato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSindicato = async (folio) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/SURTIMIENTOS2/getSindicato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener la información del sindicato.");
      }

      const data = await response.json();
      setSindicato(data); // Guardar el objeto completo
    } catch (err) {
      setError(err.message);
      setSindicato(null);
    } finally {
      setLoading(false);
    }
  };

  return { sindicato, loading, error, fetchSindicato };
}
