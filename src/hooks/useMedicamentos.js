import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export const useMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [setMessage] = useState("");

  
    // Cargar medicamentos al montar el componente
    useEffect(() => {
      fetchMedicamentos();
    }, []);
  

  // Obtener medicamentos de la API
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/farmacia/obtenerMedicamentos");
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
      const response = await fetch("/api/farmacia/crearMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicamento),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Registrado",
          text: "El medicamento fue registrado exitosamente al inventario.",
        });
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


    // Eliminar un medicamento
const deleteMedicamento = async (id) => {
  // Preguntar si el usuario quiere confirmar la eliminación
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "confirma si quieres eliminar este medicamento del inventario",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (result.isConfirmed) {
    try {
      const response = await fetch("/api/farmacia/eliminarMedicamento", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      if (response.ok) {
        // Mostrar mensaje de éxito
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "El medicamento fue eliminado exitosamente.",
        });

        // Actualizar la lista de medicamentos
        fetchMedicamentos();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo eliminar el medicamento.",
        });
      }
    } catch (error) {
      console.error("Error al eliminar medicamento:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error interno del servidor.",
      });
    }
  }
};




 // Función para editar un medicamento
 const editMedicamento = async (medicamento) => {
  const { id, ean, sustancia, piezas, activo } = medicamento;

  try {
    const response = await fetch("/api/farmacia/editarMedicamento", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ean, sustancia, piezas, activo }),
    });

    const data = await response.json();
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Medicamento editado correctamente.",
      });

      // Actualizar la lista de medicamentos
      fetchMedicamentos();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "No se pudo editar el medicamento.",
      });
    }
  } catch (error) {
    console.error("Error al editar medicamento:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Error interno del servidor.",
    });
  }
};

return { medicamentos,editMedicamento,deleteMedicamento,addMedicamento  };
};