import { useState } from "react";

export default function useFetchEmpleado() {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmpleado = async (folio) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/SURTIMIENTOS2/getEmpleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener el empleado.");
      }

      const data = await response.json();
      setEmpleado(data);
    } catch (err) {
      setError(err.message);
      setEmpleado(null);
    } finally {
      setLoading(false);
    }
  };

  return { empleado, loading, error, fetchEmpleado };
}
