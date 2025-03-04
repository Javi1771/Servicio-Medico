// hooks/hookSURTIMIENTOS2/useFetchHistorialSurtimientos.js
import { useState } from "react";

const useFetchHistorialSurtimientos = () => {
  const [historialData, setHistorialData] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);

  const fetchHistorialSurtimientos = async (folioPase) => {
    try {
      setLoadingHistorial(true);
      setErrorHistorial(null);

      const response = await fetch("/api/SURTIMIENTOS2/getHistorialSurtimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioPase }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener el historial de surtimientos.");
      }

      const data = await response.json();
      setHistorialData(data); // Guardamos en el estado
    } catch (error) {
      console.error("Error al obtener historial de surtimientos:", error);
      setErrorHistorial(error.message);
    } finally {
      setLoadingHistorial(false);
    }
  };

  return {
    historialData,
    loadingHistorial,
    errorHistorial,
    fetchHistorialSurtimientos,
    setHistorialData, // opcional, por si quieres manipular manualmente
  };
};

export default useFetchHistorialSurtimientos;
