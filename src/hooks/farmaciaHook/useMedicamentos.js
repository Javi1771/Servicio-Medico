import { useState, useEffect } from "react";
import { showCustomAlert } from "../../utils/alertas";

export const useMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [message, setMessage] = useState("");

  // Cargar medicamentos al montar el componente
  useEffect(() => {
    fetchMedicamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obtener medicamentos de la API
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/farmacia/obtenerMedicamentos");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setMedicamentos(data);
      } else {
        console.error(
          "Error al obtener medicamentos:",
          data?.message || "Datos inválidos."
        );
        setMedicamentos([]);
      }
    } catch (error) {
      console.error("Error interno:", error);
      setMedicamentos([]);
    }
  };

  // ===========================
  // REGISTRAR (INSERT) MEDICAMENTO
  // ===========================
  const addMedicamento = async (medicamentoData) => {
    try {
      const response = await fetch("/api/farmacia/crearMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...medicamentoData,
          // conversión a número con respaldo a 0 si viene vacío
          precio: Number.isNaN(parseFloat(medicamentoData.precio))
            ? 0
            : parseFloat(medicamentoData.precio),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await showCustomAlert(
          "success",
          "Registrado",
          "El medicamento fue registrado exitosamente.",
          "Aceptar"
        );
        fetchMedicamentos();
      } else {
        await showCustomAlert(
          "error",
          "Error",
          `${
            data?.message === "El medicamento ya está registrado."
              ? "El medicamento o el EAN ya está registrado en el inventario."
              : data?.message || "Error al registrar el medicamento."
          }`,
          "Aceptar"
        );

        if (data?.message !== "El medicamento ya está registrado.") {
          setMessage(data?.message || "Error al registrar el medicamento.");
        }
      }
    } catch (error) {
      console.error("Error interno:", error);
      await showCustomAlert("error", "Error", "Error interno del servidor.", "Aceptar");
      setMessage("Error interno del servidor.");
    }
  };

  // ===========================
  // ELIMINAR (DELETE) MEDICAMENTO
  // ===========================
  const deleteMedicamento = async (id) => {
    const result = await showCustomAlert(
      "warning",
      "¿Estás seguro?",
      "Confirma si quieres eliminar este medicamento del inventario",
      "Sí, eliminar",
      {
        background: "linear-gradient(145deg, #b35900, #663300)",
        confirmButtonColor: "#ff9800",
        cancelButtonColor: "#3085d6",
        cancelButtonText: "Cancelar",
        showCancelButton: true,
        customClass: {
          popup: "border border-orange-600 rounded-lg",
        },
        // Evitamos depender de Swal.getPopup(); SweetAlert2 pasa el popup como argumento
        didOpen: (popup) => {
          if (popup) {
            popup.style.boxShadow = "0px 0px 20px 5px rgba(255,152,0,0.9)";
            popup.style.borderRadius = "15px";
          }
        },
      }
    );

    if (!result?.isConfirmed) return;

    try {
      const response = await fetch("/api/farmacia/eliminarMedicamento", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (response.ok) {
        await showCustomAlert(
          "success",
          "Eliminado",
          "El medicamento fue eliminado exitosamente.",
          "Aceptar"
        );
        fetchMedicamentos();
      } else {
        await showCustomAlert(
          "error",
          "Error",
          data?.message || "No se pudo eliminar el medicamento.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al eliminar medicamento:", error);
      await showCustomAlert("error", "Error", "Error interno del servidor.", "Aceptar");
    }
  };

  // ===========================
  // EDITAR (UPDATE) MEDICAMENTO
  // ===========================
  const editMedicamento = async (medicamentoData) => {
    const {
      id,
      medicamento,
      clasificacion,
      presentacion,
      ean,
      piezas,
      maximo,
      minimo,
      medida,
      precio,
    } = medicamentoData;

    try {
      const response = await fetch("/api/farmacia/editarMedicamento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          medicamento,
          clasificacion,
          presentacion,
          ean,
          piezas,
          maximo,
          minimo,
          medida: Number.isNaN(parseInt(medida, 10)) ? 0 : parseInt(medida, 10),
          precio: Number.isNaN(parseFloat(precio)) ? 0 : parseFloat(precio),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        await showCustomAlert(
          "success",
          "Éxito",
          "El medicamento fue editado exitosamente.",
          "Aceptar"
        );
        fetchMedicamentos();
      } else {
        await showCustomAlert(
          "error",
          "Error",
          data?.message || "No se pudo editar el medicamento.",
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error al editar medicamento:", error);
      await showCustomAlert("error", "Error", "Error interno del servidor.", "Aceptar");
    }
  };

  return {
    medicamentos,
    addMedicamento,
    deleteMedicamento,
    editMedicamento,
    message,
  };
};
