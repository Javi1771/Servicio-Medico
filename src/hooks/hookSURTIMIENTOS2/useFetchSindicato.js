import { useState } from "react";

export default function useFetchSindicato() {
  const [sindicato, setSindicato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSindicato = async (folioReceta) => {
    setLoading(true);
    setError(null);

    try {
      //* Ajusta la ruta al endpoint donde tengas getsindicato.js
      const response = await fetch("/api/SURTIMIENTOS2/getSindicato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveconsulta: folioReceta }), 
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener la información del sindicato.");
      }

      const data = await response.json();

      //* data.sindicato puede venir null si no está sindicalizado
      //* Puedes guardar el valor directamente...
      //* Si quieres mostrar un texto custom, puedes hacer algo como:
      //* setSindicato(data.sindicato ?? "No está sindicalizado");
      setSindicato(data.sindicato ?? "N/A");
    } catch (err) {
      setError(err.message);
      setSindicato(null);
    } finally {
      setLoading(false);
    }
  };

  return { sindicato, loading, error, fetchSindicato };
}
