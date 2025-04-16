
import { useState } from "react";

export default function useFetchConsulta() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchConsulta = async (folio) => {
    //console.log("Folio recibido en fetchConsulta:", folio);
    setLoading(true);
    setError(null);
    setData(null);
  
    try {
      const response = await fetch(`/api/surtimientos/getConsultaByFolio?folio=${folio}`);
      //console.log("Respuesta del servidor:", response);
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const result = await response.json();
      //console.log("Resultado de la consulta:", result);
      setData(result);
      return result;
    } catch (err) {
      console.error("Error en fetchConsulta:", err.message);
      setError(err.message || "Error al buscar la consulta.");
    } finally {
      setLoading(false);
    }
  };
  

  return { data, error, loading, fetchConsulta };
}