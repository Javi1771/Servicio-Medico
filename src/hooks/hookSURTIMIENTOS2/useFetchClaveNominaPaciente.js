import { useState } from "react";

const useFetchClaveNominaPaciente = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (folio) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/SURTIMIENTOS2/getClaveNominaPaciente?folio=${folio}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || "Error al obtener datos");
      }
      setData(json.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return { data, loading, error, fetchData };
};

export default useFetchClaveNominaPaciente;
