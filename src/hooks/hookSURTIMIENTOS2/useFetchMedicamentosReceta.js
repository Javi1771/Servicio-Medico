import { useState } from "react";

export default function useFetchMedicamentosReceta() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedicamentosReceta = async (folio) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/SURTIMIENTOS2/getMedicamentosReceta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio }),
      });

      if (!response.ok) throw new Error("Error al obtener medicamentos");
      
      const data = await response.json();
      setMedicamentos(data);
    } catch (err) {
      setError(err.message);
      setMedicamentos([]);
    } finally {
      setLoading(false);
    }
  };

  return { medicamentos, loading, error, fetchMedicamentosReceta };
}