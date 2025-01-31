import { useState } from "react";

export default function useFetchEspecialista() {
  const [especialista, setEspecialista] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEspecialista = async (folioConsulta) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/SURTIMIENTOS2/getEspecialista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioConsulta }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener la información del especialista.");
      }

      const data = await response.json();
      setEspecialista(data);
    } catch (err) {
      setError(err.message);
      setEspecialista(null);
    } finally {
      setLoading(false);
    }
  };

  return { especialista, loading, error, fetchEspecialista };
}