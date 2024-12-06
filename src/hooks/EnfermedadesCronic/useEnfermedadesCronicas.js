import { useState, useEffect } from "react";
import Swal from "sweetalert2";

export function useEnfermedadesCronicas() {
  const [enfermedades, setEnfermedades] = useState([]);
  const [newEnfermedad, setNewEnfermedad] = useState("");
  const [error, setError] = useState(null);
  const [selectedEnfermedadId, setSelectedEnfermedadId] = useState(null);
  const [newKpi, setNewKpi] = useState("");

  useEffect(() => {
    fetchEnfermedades();
  }, []);

  const fetchEnfermedades = async () => {
    try {
      const response = await fetch(
        "/api/enfermedadesCronicas/listarEnfermedades"
      );
      const data = await response.json();
      setEnfermedades(data.filter((enfermedad) => enfermedad.estatus === true));
    } catch (err) {
      console.error("Error al cargar las enfermedades:", err);
      setError("Error al cargar las enfermedades.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newEnfermedad.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El campo de enfermedad crónica no puede estar vacío.",
      });
      return;
    }

    try {
      const response = await fetch(
        "/api/enfermedadesCronicas/crearEnfermedadCronica",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cronica: newEnfermedad.trim() }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Esta enfermedad crónica ya está registrada.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Ocurrió un error al registrar la enfermedad crónica.",
          });
        }
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Registrado",
        text: "La enfermedad crónica se registró exitosamente.",
        showConfirmButton: false,
        timer: 2000,
      });

      setNewEnfermedad("");
      fetchEnfermedades();
    } catch (err) {
      console.error("Error al registrar la enfermedad:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error inesperado.",
      });
    }
  };

  const handleKpiSubmit = async (e) => {
    e.preventDefault();

    if (!newKpi.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El KPI no puede estar vacío.",
      });
      return;
    }

    try {
      const response = await fetch("/api/enfermedadesCronicas/crearKpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_enf_cronica: selectedEnfermedadId,
          kpi: newKpi,
        }),
      });

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al registrar el KPI.",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Registrado",
        text: "KPI registrado correctamente.",
        showConfirmButton: false,
        timer: 2000,
      });

      setNewKpi("");
      setSelectedEnfermedadId(null);
    } catch (err) {
      console.error("Error al registrar el KPI:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error inesperado.",
      });
    }
  };

  return {
    enfermedades,
    newEnfermedad,
    error,
    setNewEnfermedad,
    handleSubmit,
    handleKpiSubmit,
    selectedEnfermedadId,
    setSelectedEnfermedadId,
    newKpi,
    setNewKpi,
  };
}
