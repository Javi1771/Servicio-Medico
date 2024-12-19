import { useState } from "react";

export default function useAddMedicamento() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMedicamento = async (nombre, tipo) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/surtimientos/addNuevoMedicamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, tipo }),
      });

      if (!response.ok) {
        throw new Error("Error al insertar el medicamento.");
      }

      const data = await response.json();
      setLoading(false);
      return { success: true, message: data.message };
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  return { addMedicamento, loading, error };
}
