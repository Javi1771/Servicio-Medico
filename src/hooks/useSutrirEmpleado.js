import { useState } from "react";

const useEmpleado = () => {
  const [empleado, setEmpleado] = useState(null); // Información del empleado
  const [error, setError] = useState(""); // Mensajes de error
  const [loading, setLoading] = useState(false); // Estado de carga

  const fetchEmpleado = async (numNom) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: numNom }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmpleado(data);
      } else {
        setEmpleado(null);
        setError(data.error || "No se encontró al empleado.");
      }
    } catch (err) {
      console.error("Error al buscar empleado:", err);
      setError("Hubo un error al buscar la información del empleado.");
    } finally {
      setLoading(false);
    }
  };

  return { empleado, error, loading, fetchEmpleado };
};

export default useEmpleado;
