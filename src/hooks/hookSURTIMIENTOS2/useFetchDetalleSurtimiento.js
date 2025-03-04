// hooks/hookSURTIMIENTOS2/useFetchDetalleSurtimiento.js
import { useState } from "react";

const useFetchDetalleSurtimiento = () => {
  const [detalle, setDetalle] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);

  const fetchDetalleSurtimiento = async (folioSurtimiento) => {
    try {
      setLoadingDetalle(true);
      setErrorDetalle(null);

      const response = await fetch("/api/SURTIMIENTOS2/getDetalleSurtimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioSurtimiento }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener el detalle del surtimiento");
      }

      const data = await response.json();
      setDetalle(data);
    } catch (error) {
      console.error("Error en fetchDetalleSurtimiento:", error);
      setErrorDetalle(error.message);
    } finally {
      setLoadingDetalle(false);
    }
  };

  return { detalle, loadingDetalle, errorDetalle, fetchDetalleSurtimiento };
};

export default useFetchDetalleSurtimiento;
