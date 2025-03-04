// hooks/hookSURTIMIENTOS2/useFetchSurtimientos.js
import { useState } from "react";

const useFetchSurtimientos = () => {
  const [surtimientos, setSurtimientos] = useState([]);
  const [loadingSurtimientos, setLoadingSurtimientos] = useState(false);
  const [errorSurtimientos, setErrorSurtimientos] = useState(null);

  const fetchSurtimientos = async (folioPase) => {
    try {
      setLoadingSurtimientos(true);
      setErrorSurtimientos(null);

      const response = await fetch("/api/SURTIMIENTOS2/getSurtimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioPase }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener surtimientos");
      }

      const data = await response.json();
      setSurtimientos(data);
    } catch (error) {
      console.error("Error en fetchSurtimientos:", error);
      setErrorSurtimientos(error.message);
    } finally {
      setLoadingSurtimientos(false);
    }
  };

  return { surtimientos, loadingSurtimientos, errorSurtimientos, fetchSurtimientos };
};

export default useFetchSurtimientos;
