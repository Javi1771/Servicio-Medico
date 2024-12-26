import { useState } from "react";

const useUpdateEstatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateEstatus = async (idDetalleReceta, newEstatus) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/surtimientos/updateEstatus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idDetalleReceta, estatus: newEstatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estatus del registro.");
      }

      return { success: true };
    } catch (error) {
      console.error("Error en el hook de estatus:", error.message);
      setError(error.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { updateEstatus, loading, error };
};

export default useUpdateEstatus;
