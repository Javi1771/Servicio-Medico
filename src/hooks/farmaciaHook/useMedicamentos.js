import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export const useMedicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [message, setMessage] = useState("");

  //* Cargar medicamentos al montar el componente
  useEffect(() => {
    fetchMedicamentos();
  }, []);

  //* Obtener medicamentos de la API
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/farmacia/obtenerMedicamentos");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setMedicamentos(data);
      } else {
        console.error("Error al obtener medicamentos:", data?.message || "Datos inválidos.");
        setMedicamentos([]);
      }
    } catch (error) {
      console.error("Error interno:", error);
      setMedicamentos([]);
    }
  };

  //? Registrar un nuevo medicamento
  const addMedicamento = async (medicamentoData) => {
    try {
      const response = await fetch("/api/farmacia/crearMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicamentoData),
      });

      const data = await response.json();
      if (response.ok) {
        //* Alerta de éxito: fondo verde
        Swal.fire({
          icon: "success",
          title: "<span style='color: #ffffff; font-weight: bold;'>Registrado</span>",
          html: "<p style='color: #ffffff; font-size: 1.1rem;'>El medicamento fue registrado exitosamente.</p>",
          background: "linear-gradient(145deg, #004d00, #002200)",
          confirmButtonColor: "#00c853",
          confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup: "border border-green-600 shadow-[0px_0px_20px_5px_rgba(76,175,80,0.9)] rounded-lg"
          },
          didOpen: () => {
            const popup = Swal.getPopup();
            popup.style.boxShadow = "0px 0px 20px 5px rgba(76,175,80,0.9)";
            popup.style.borderRadius = "15px";
          },
        });
        fetchMedicamentos();
      } else {
        if (data.message === "El medicamento ya está registrado.") {
          //! Alerta de error: fondo rojo
          Swal.fire({
            icon: "error",
            title: "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>Error</span>",
            html: "<p style='color: #fff; font-size: 1.1rem;'>El medicamento ya está registrado en el inventario.</p>",
            background: "linear-gradient(145deg, #4a0000, #220000)",
            confirmButtonColor: "#ff1744",
            confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
            customClass: {
              popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg"
            },
            didOpen: () => {
              const popup = Swal.getPopup();
              popup.style.boxShadow = "0px 0px 20px 5px rgba(255,23,68,0.9)";
              popup.style.borderRadius = "15px";
            },
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

  //? Eliminar un medicamento
  const deleteMedicamento = async (id) => {
    //TODO: Alerta de advertencia: fondo naranja
    const result = await Swal.fire({
      icon: "warning",
      title: "<span style='color: #ffffff; font-weight: bold;'>¿Estás seguro?</span>",
      html: "<p style='color: #ffffff; font-size: 1.1rem;'>Confirma si quieres eliminar este medicamento del inventario</p>",
      background: "linear-gradient(145deg, #b35900, #663300)",
      confirmButtonColor: "#ff9800",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Sí, eliminar</span>",
      cancelButtonText: "<span style='color: #fff;'>Cancelar</span>",
      customClass: {
        popup: "border border-orange-600 shadow-[0px_0px_20px_5px_rgba(255,152,0,0.9)] rounded-lg"
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.style.boxShadow = "0px 0px 20px 5px rgba(255,152,0,0.9)";
        popup.style.borderRadius = "15px";
      },
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
          //* Alerta de éxito: fondo verde
          Swal.fire({
            icon: "success",
            title: "<span style='color: #ffffff; font-weight: bold;'>Eliminado</span>",
            html: "<p style='color: #ffffff; font-size: 1.1rem;'>El medicamento fue eliminado exitosamente.</p>",
            background: "linear-gradient(145deg, #004d00, #002200)",
            confirmButtonColor: "#00c853",
            confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
            customClass: {
              popup: "border border-green-600 shadow-[0px_0px_20px_5px_rgba(76,175,80,0.9)] rounded-lg"
            },
            didOpen: () => {
              const popup = Swal.getPopup();
              popup.style.boxShadow = "0px 0px 20px 5px rgba(76,175,80,0.9)";
              popup.style.borderRadius = "15px";
            },
          });
          fetchMedicamentos();
        } else {
          //! Alerta de error: fondo rojo
          Swal.fire({
            icon: "error",
            title: "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>Error</span>",
            html: `<p style='color: #fff; font-size: 1.1rem;'>${data.message || "No se pudo eliminar el medicamento."}</p>`,
            background: "linear-gradient(145deg, #4a0000, #220000)",
            confirmButtonColor: "#ff1744",
            confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
            customClass: {
              popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg"
            },
            didOpen: () => {
              const popup = Swal.getPopup();
              popup.style.boxShadow = "0px 0px 20px 5px rgba(255,23,68,0.9)";
              popup.style.borderRadius = "15px";
            },
          });
        }
      } catch (error) {
        console.error("Error al eliminar medicamento:", error);
        //! Alerta de error interno: fondo rojo
        Swal.fire({
          icon: "error",
          title: "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>Error</span>",
          html: "<p style='color: #fff; font-size: 1.1rem;'>Error interno del servidor.</p>",
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg"
          },
          didOpen: () => {
            const popup = Swal.getPopup();
            popup.style.boxShadow = "0px 0px 20px 5px rgba(255,23,68,0.9)";
            popup.style.borderRadius = "15px";
          },
        });
      }
    }
  };

  //? Editar un medicamento
  const editMedicamento = async (medicamentoData) => {
    const { id, medicamento, clasificacion, presentacion, ean, piezas } = medicamentoData;
    try {
      const response = await fetch("/api/farmacia/editarMedicamento", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, medicamento, clasificacion, presentacion, ean, piezas }),
      });

      const data = await response.json();
      if (response.ok) {
        //* Alerta de éxito: fondo verde
        Swal.fire({
          icon: "success",
          title: "<span style='color: #ffffff; font-weight: bold;'>Éxito</span>",
          html: "<p style='color: #ffffff; font-size: 1.1rem;'>El medicamento fue editado exitosamente.</p>",
          background: "linear-gradient(145deg, #004d00, #002200)",
          confirmButtonColor: "#00c853",
          confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup: "border border-green-600 shadow-[0px_0px_20px_5px_rgba(76,175,80,0.9)] rounded-lg"
          },
          didOpen: () => {
            const popup = Swal.getPopup();
            popup.style.boxShadow = "0px 0px 20px 5px rgba(76,175,80,0.9)";
            popup.style.borderRadius = "15px";
          },
        });
        fetchMedicamentos();
      } else {
        //! Alerta de error: fondo rojo
        Swal.fire({
          icon: "error",
          title: "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>Error</span>",
          html: `<p style='color: #fff; font-size: 1.1rem;'>${data.message || "No se pudo editar el medicamento."}</p>`,
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg"
          },
          didOpen: () => {
            const popup = Swal.getPopup();
            popup.style.boxShadow = "0px 0px 20px 5px rgba(255,23,68,0.9)";
            popup.style.borderRadius = "15px";
          },
        });
      }
    } catch (error) {
      console.error("Error al editar medicamento:", error);
      //! Alerta de error interno: fondo rojo
      Swal.fire({
        icon: "error",
        title: "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>Error</span>",
        html: "<p style='color: #fff; font-size: 1.1rem;'>Error interno del servidor.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg"
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          popup.style.boxShadow = "0px 0px 20px 5px rgba(255,23,68,0.9)";
          popup.style.borderRadius = "15px";
        },
      });
    }
  };

  return { medicamentos, addMedicamento, deleteMedicamento, editMedicamento, message };
};
