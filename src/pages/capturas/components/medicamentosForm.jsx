/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import styles from "../../css/estilosSurtimientos/tableSurtimientos.module.css";
import { MdWarningAmber } from "react-icons/md";
import Swal from "sweetalert2";


const MedicamentosForm = ({
  folioConsulta,
  diagnostico,
  onFormSubmitted,
  detalles,
}) => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [isGuardadoHabilitado, setIsGuardadoHabilitado] = useState(false);

  // Validar la especialidad al cargar el formulario
  const validarEspecialidad = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/surtimientos/validateEspecialidadintercosulta?claveconsulta=${folioConsulta}`
      );
  
      if (!response.ok) {
        throw new Error("No se pudo validar la consulta.");
      }
  
      const data = await response.json();
      setIsGuardadoHabilitado(data.habilitado);
    } catch (error) {
      console.error("Error al validar especialidad:", error.message);
      setIsGuardadoHabilitado(false);
    }
  }, [folioConsulta]);
  

  // Fetch para obtener la lista de medicamentos
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/surtimientos/getMedicamentos");
      const data = await response.json();
      setMedicamentos(
        data.map((item) => ({
          id: item.CLAVEMEDICAMENTO,
          name: item.MEDICAMENTO,
        }))
      );
    } catch (error) {
      console.error("Error fetching medicamentos:", error);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
    validarEspecialidad();
  }, [folioConsulta, validarEspecialidad]);
  

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    // Validar campos vacíos
    if (!selectedMedicamento || !indicaciones || !cantidad || !diagnostico) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Por favor completa todos los campos, incluido el diagnóstico.",
        icon: "warning",
        confirmButtonColor: "#f39c12",
        confirmButtonText: "Ok",
      });
      return;
    }
  
    try {
      console.log("Iniciando inserción del medicamento...");
  
      // Insertar en detalleReceta
      const insertResponse = await fetch("/api/surtimientos/addDetalleReceta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folioReceta: folioConsulta,
          descMedicamento: selectedMedicamento,
          indicaciones,
          estatus: 1,
          cantidad,
        }),
      });
  
      if (!insertResponse.ok) {
        const errorData = await insertResponse.json();
        throw new Error(errorData.message || "Error al guardar el medicamento.");
      }
      console.log("Medicamento insertado correctamente.");
  
      // Actualizar el campo diagnóstico
      console.log("Actualizando diagnóstico...");
      const updateResponse = await fetch("/api/surtimientos/updateDiagnostico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claveconsulta: folioConsulta,
          diagnostico,
        }),
      });
  
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(
          errorData.message || "Error al actualizar el diagnóstico."
        );
      }
      console.log("Diagnóstico actualizado correctamente.");
  
      // SweetAlert personalizado para éxito
      Swal.fire({
        title: "¡Éxito!",
        text: "Medicamento y diagnóstico guardados con éxito.",
        icon: "success",
        background: "#2d3436",
        color: "#ffffff",
        confirmButtonColor: "#6c5ce7",
        confirmButtonText: "Aceptar",
      });
  
      // Limpiar campos después del éxito
      setSelectedMedicamento("");
      setIndicaciones("");
      setCantidad("");
  
      // Notificar al componente padre para refrescar los datos
      onFormSubmitted();
    } catch (error) {
      console.error("Error en la operación:", error.message);
  
      // SweetAlert personalizado para error
      Swal.fire({
        title: "¡Error!",
        text: error.message || "Ocurrió un error al guardar los datos.",
        icon: "error",
        background: "#2d3436",
        color: "#ffffff",
        confirmButtonColor: "#d63031",
        confirmButtonText: "Intentar de nuevo",
      });
    }
  };
  

  // Nueva validación: deshabilitar botón si ya existe al menos un medicamento
  const tieneMedicamentos = detalles?.length > 0;

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Seleccionar Medicamento</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="medicamentoSelect" className={styles.label}>
            Medicamentos:
          </label>
          <select
            id="medicamentoSelect"
            value={selectedMedicamento}
            onChange={(e) => setSelectedMedicamento(e.target.value)}
            className={styles.select}
            disabled={tieneMedicamentos}
          >
            <option value="" disabled>
              -- Selecciona un medicamento --
            </option>
            {medicamentos.map((medicamento) => (
              <option key={medicamento.id} value={medicamento.name}>
                {medicamento.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="indicaciones" className={styles.label}>
            Indicaciones:
          </label>
          <textarea
            id="indicaciones"
            className={styles.textarea}
            placeholder="Escribe las indicaciones..."
            value={indicaciones}
            onChange={(e) => setIndicaciones(e.target.value)}
            disabled={tieneMedicamentos}
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cantidad" className={styles.label}>
            Cantidad (días):
          </label>
          <input
            id="cantidad"
            className={styles.textarea}
            placeholder="Escribe la cantidad..."
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={tieneMedicamentos}
          />
        </div>

        <button
          type="submit"
          className={styles.addButton}
          disabled={!isGuardadoHabilitado || tieneMedicamentos}
        >
          Guardar Medicamento
        </button>

        {tieneMedicamentos && (
          <p className={styles.warningMessage}>
            <MdWarningAmber className={styles.warningIcon} />
            Ya existe un medicamento registrado. No puedes agregar otro.
          </p>
        )}
      </form>
    </div>
  );
};

export default MedicamentosForm;
