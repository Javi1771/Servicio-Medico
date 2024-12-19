import { useState } from "react";

export default function useFetchMedicamento() {
  const [medicamento, setMedicamento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedicamentoByClave = async (claveMedicamento) => {
    setLoading(true);
    setError(null);
    setMedicamento(null);

    try {
      const response = await fetch(
        `/api/surtimientos/getMedicamentoByClave?claveMedicamento=${claveMedicamento}`
      );

      if (!response.ok) {
        throw new Error("No se pudo obtener el medicamento.");
      }

      const data = await response.json();
      setMedicamento(data.medicamento);
    } catch (err) {
      console.error("Error al obtener el medicamento:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { medicamento, loading, error, fetchMedicamentoByClave };
}
