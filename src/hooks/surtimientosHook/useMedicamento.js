import { useState, useEffect } from "react";

const useMedicamento = (claveMedicamento) => {
  const [medicamento, setMedicamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicamento = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/surtimientos/getMedicamentos?claveMedicamento=${claveMedicamento}`);
        if (!response.ok) {
          throw new Error("Error al obtener el medicamento");
        }
        const data = await response.json();
        setMedicamento(data[0]?.MEDICAMENTO || "Desconocido");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (claveMedicamento) {
      fetchMedicamento();
    }
  }, [claveMedicamento]);

  return { medicamento, loading, error };
};

export default useMedicamento;