import { useState } from "react";

export default function useFetchPaciente() {
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPaciente = async (folio) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/SURTIMIENTOS2/getPaciente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener la información del paciente.");
      }

      const data = await response.json();
      setPaciente(data);
    } catch (err) {
      setError(err.message);
      setPaciente(null);
    } finally {
      setLoading(false);
    }
  };

  return { paciente, loading, error, fetchPaciente };
}
