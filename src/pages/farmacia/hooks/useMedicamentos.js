import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export const useMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [message, setMessage] = useState("");

  // Obtener medicamentos de la API
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/obtenerMedicamentos");
      const data = await response.json();
      if (response.ok) {
        setMedicamentos(data);
      } else {
        console.error("Error al obtener medicamentos:", data.message);
      }
    } catch (error) {
      console.error("Error interno:", error);
    }
  };

  // Registrar un nuevo medicamento
  const addMedicamento = async (medicamento) => {
    try {
      const response = await fetch("/api/crearMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicamento),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Medicamento registrado exitosamente.");
        fetchMedicamentos(); // Actualizar la tabla
      } else {
        // Mostrar alerta si la sustancia ya existe
        if (data.message === "La sustancia ya está registrada.") {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "La sustancia ya está registrada en el inventario.",
          });
        } else {
          setMessage(data.message || "Error al registrar el medicamento.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error interno del servidor.");
    }
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  return { medicamentos, addMedicamento, message };
};
