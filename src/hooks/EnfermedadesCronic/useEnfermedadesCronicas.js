import { useState, useEffect } from "react";
import { showCustomAlert } from "../../utils/alertas";

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
  await showCustomAlert(
      "error",
      "Error",
      "El campo de enfermedad no puede estar vacío.",
      "Aceptar"
  );
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
await showCustomAlert(
          "error",
          "Enfermedad ya registrada",
          "Esta enfermedad crónica ya está registrada.",
          "Aceptar"
        );
        } else {
await showCustomAlert(
          "error",
          "Error al registrar la enfermedad",
          "Ocurrió un error inesperado.",
          "Aceptar"
        );
        }
        return;
      }

await showCustomAlert(
        "success",
        "Enfermedad registrada",
        "La enfermedad crónica se ha registrado correctamente.",
        "Aceptar",
      );

      setNewEnfermedad("");
      fetchEnfermedades();
    } catch (err) {
      console.error("Error al registrar la enfermedad:", err);
await showCustomAlert(
  "error",
  "Error",
  "Ocurrió un error inesperado.",
  "Aceptar"
);
    }
  };

  const handleKpiSubmit = async (e) => {
    e.preventDefault();

    if (!newKpi.trim()) {
await showCustomAlert(
  "error",
  "Error",
  "El campo de KPI no puede estar vacío.",
  "Aceptar"
);

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
await showCustomAlert(
  "error",
  "Error",
  "Error al registrar el KPI.",
  "Aceptar"
);

        return;
      }

await showCustomAlert(
  "success",
  "Registrado",
  "KPI registrado correctamente.",
  "Aceptar",
  {
    showConfirmButton: false,
    timer: 2000
  }
);


      setNewKpi("");
      setSelectedEnfermedadId(null);
    } catch (err) {
      console.error("Error al registrar el KPI:", err);
await showCustomAlert(
  "error",
  "Error",
  "Ocurrió un error inesperado.",
  "Aceptar"
);

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
