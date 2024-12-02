import { useState } from "react";

const useBeneficiarios = () => {
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBeneficiarios = async (num_nomina) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/farmacia/getBeneficiario_farmacia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nomina }),
      });

      const data = await response.json();

      if (response.ok) {
        setBeneficiarios(data);
      } else {
        setError(data.message || "No se encontraron beneficiarios.");
        setBeneficiarios([]);
      }
    } catch (err) {
      console.error("Error al buscar beneficiarios:", err);
      setError("Hubo un error al buscar los beneficiarios.");
      setBeneficiarios([]);
    } finally {
      setLoading(false);
    }
  };

  return { beneficiarios, loading, error, fetchBeneficiarios };
};

export default useBeneficiarios;
