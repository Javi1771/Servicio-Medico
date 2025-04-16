import { useState } from "react"; // 🔹 Agregar esta línea para importar useState

export default function useFetchMedicamentosReceta() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedicamentosReceta = async (folio) => {
    if (!folio || isNaN(folio) || parseInt(folio, 10) <= 0) {
      console.warn("⚠️ Se intentó hacer una petición con folio inválido:", folio);
      setError("Folio inválido");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch("/api/SURTIMIENTOS2/getMedicamentosReceta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioReceta: folio }), // Aseguramos que es un número
      });
  
      if (!response.ok) throw new Error("Error al obtener medicamentos");
  
      const data = await response.json();
      //console.log("📌 Medicamentos recibidos en hook:", data);
      setMedicamentos(data);
    } catch (err) {
      console.error("❌ Error en fetchMedicamentosReceta:", err);
      setError(err.message);
      setMedicamentos([]);
    } finally {
      setLoading(false);
    }
  };
  

  return { medicamentos, loading, error, fetchMedicamentosReceta };
}
