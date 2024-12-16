import { useState } from "react";

const useCreateConsulta = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const createConsulta = async (consultaData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/surtimientos/createConsulta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consultaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al crear la consulta. Inténtalo de nuevo."
        );
      }

      const data = await response.json();
      setSuccessMessage(data.message || "Consulta creada exitosamente.");
    } catch (err) {
      console.error("Error en la creación de la consulta:", err.message);
      setError(err.message || "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return { createConsulta, loading, error, successMessage };
};

export default useCreateConsulta;
