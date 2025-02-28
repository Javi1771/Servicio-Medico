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

  //* Define las rutas de los sonidos de éxito y error
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  //! Reproduce un sonido de éxito/error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

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
      playSound(false);
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
          playSound(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Esta enfermedad crónica ya está registrada.",
          });
        } else {
          playSound(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Ocurrió un error al registrar la enfermedad crónica.",
          });
        }
        return;
      }

      playSound(true);
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
      playSound(false);
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
      playSound(false);
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
        playSound(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al registrar el KPI.",
        });
        return;
      }

      playSound(true);
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
      playSound(false);
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
