/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useCallback } from "react"; // Asegúrate de incluir useCallback
import styles from "../../css/estilosSurtimientos/tableSurtimientos.module.css";
import { MdWarningAmber } from "react-icons/md";
import ModalRegistrarMedicamento from "../components/modalRegistrarMedicamento";
import Swal from "sweetalert2";
import { MdAdd } from "react-icons/md";

const MedicamentosForm = ({
  folioConsulta,
  diagnostico,
  onFormSubmitted,
  detalles,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const [medicamentos, setMedicamentos] = useState([]);
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");

  const [isGuardadoHabilitado, setIsGuardadoHabilitado] = useState(false);

  const [temporalMedicamentos, setTemporalMedicamentos] = useState([]); // Temporal storage
  // Nueva validación: deshabilitar botón si ya existe al menos un medicamento

  const handleRemoveFromReceta = (id, event) => {
    event.preventDefault(); // Evita el refresco de la página
    Swal.fire({
      title: "¿Estás seguro?",
      text: "El medicamento será eliminado de la lista temporal.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d63031",
      cancelButtonColor: "#6c5ce7",
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevosMedicamentos = temporalMedicamentos.filter(
          (med) => med.id !== id
        );
        setTemporalMedicamentos(nuevosMedicamentos);

        Swal.fire({
          title: "Eliminado",
          text: "El medicamento ha sido eliminado de la lista temporal.",
          icon: "success",
          confirmButtonColor: "#6c5ce7",
        });
      }
    });
  };

  const handleAddToReceta = () => {
    if (!selectedMedicamento || !indicaciones || !cantidad) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Por favor completa todos los campos antes de añadir.",
        icon: "warning",
        confirmButtonColor: "#f39c12",
        confirmButtonText: "Ok",
      });
      return;
    }

    // Validación para evitar medicamentos duplicados
    const medicamentoExistente = temporalMedicamentos.some(
      (med) => med.medicamento === selectedMedicamento
    );

    if (medicamentoExistente) {
      Swal.fire({
        title: "Medicamento duplicado",
        text: "Este medicamento ya ha sido añadido. No puedes duplicarlo.",
        icon: "warning",
        confirmButtonColor: "#f39c12",
        confirmButtonText: "Ok",
      });
      return;
    }

    // Agregar el medicamento al estado temporal
    const nuevoMedicamento = {
      id: temporalMedicamentos.length + 1, // Generar un ID temporal
      medicamento: selectedMedicamento,
      indicaciones,
      cantidad,
    };

    setTemporalMedicamentos([...temporalMedicamentos, nuevoMedicamento]);

    // Limpiar los campos
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");

    Swal.fire({
      title: "Añadido a la receta",
      text: "El medicamento ha sido añadido temporalmente.",
      icon: "success",
      confirmButtonColor: "#6c5ce7",
      confirmButtonText: "Ok",
    });
  };

  const handleGuardarMedicamentos = async () => {
    // Validar que haya al menos un medicamento en el estado temporal
    if (temporalMedicamentos.length === 0) {
      Swal.fire({
        title: "Sin medicamentos",
        text: "No hay medicamentos para guardar. Añade al menos uno.",
        icon: "warning",
        confirmButtonColor: "#f39c12",
        confirmButtonText: "Ok",
      });
      return;
    }

    // Validar que el diagnóstico no esté vacío
    if (!diagnostico || diagnostico.trim() === "") {
      Swal.fire({
        title: "Falta el diagnóstico",
        text: "Es obligatorio registrar un diagnóstico antes de guardar medicamentos.",
        icon: "warning",
        confirmButtonColor: "#f39c12",
        confirmButtonText: "Ok",
      });
      return;
    }

    try {
      // Iterar sobre los medicamentos temporales y enviarlos al servidor
      for (const med of temporalMedicamentos) {
        const response = await fetch("/api/surtimientos/addDetalleReceta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folioReceta: folioConsulta,
            descMedicamento: med.medicamento,
            indicaciones: med.indicaciones,
            estatus: 1,
            cantidad: med.cantidad,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Error al insertar el medicamento: ${med.medicamento}`
          );
        }
      }

      // Actualizar el diagnóstico
      const updateResponse = await fetch(
        "/api/surtimientos/updateDiagnostico",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveconsulta: folioConsulta,
            diagnostico,
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(
          errorData.message || "Error al actualizar el diagnóstico."
        );
      }

      // Mostrar SweetAlert de éxito
      Swal.fire({
        title: "¡Éxito!",
        text: "Todos los medicamentos y el diagnóstico han sido guardados exitosamente.",
        icon: "success",
        confirmButtonColor: "#6c5ce7",
        confirmButtonText: "Aceptar",
      });

      // Limpiar los registros temporales y refrescar los datos en el componente padre
      setTemporalMedicamentos([]);
      onFormSubmitted(); // Refrescar los datos en el componente padre
    } catch (error) {
      console.error("Error al guardar medicamentos:", error.message);
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar uno o más medicamentos.",
        icon: "error",
        confirmButtonColor: "#d63031",
        confirmButtonText: "Intentar de nuevo",
      });
    }
  };

  const handleSaveMedicamento = async (nombre, tipo) => {
    console.log("Enviando datos al servidor:", { nombre, tipo });

    try {
      const response = await fetch("/api/surtimientos/addNuevoMedicamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, tipo }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el medicamento.");
      }

      Swal.fire({
        title: "¡Éxito!",
        text: "El medicamento ha sido registrado correctamente.",
        icon: "success",
        confirmButtonColor: "#6c5ce7",
      });

      fetchMedicamentos();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar el medicamento:", error.message);

      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al guardar el medicamento.",
        icon: "error",
        confirmButtonColor: "#d63031",
      });
    }
  };

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
    }
  }, [folioConsulta]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch para obtener la lista de medicamentos
  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/surtimientos/getMedicamentos");
      if (!response.ok)
        throw new Error("Error al obtener la lista de medicamentos.");

      const data = await response.json();
      setMedicamentos(
        data.map((item) => ({
          id: item.CLAVEMEDICAMENTO,
          name: item.MEDICAMENTO,
        }))
      );
    } catch (error) {
      console.error("Error fetching medicamentos:", error.message);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar la lista de medicamentos.",
        icon: "error",
        confirmButtonColor: "#d63031",
      });
    }
  };

  useEffect(() => {
    fetchMedicamentos();
    validarEspecialidad();
  }, [folioConsulta, validarEspecialidad]);

  // Nueva validación: deshabilitar botón si ya existe al menos un medicamento
  const tieneMedicamentos = detalles?.length > 0;

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Seleccionar Medicamento</h2>
      <form className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="medicamentoSelect" className={styles.label}>
            Medicamentos:
          </label>
          <div className={styles.inputWithButton}>
            <select
              id="medicamentoSelect"
              value={selectedMedicamento}
              onChange={(e) => setSelectedMedicamento(e.target.value)}
              className={styles.select}
              disabled={tieneMedicamentos} // Agregado
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
            <button
              type="button"
              className={styles.addButtonCompact}
              onClick={() => setIsModalOpen(true)}
              title="Registrar nuevo medicamento"
            >
              <MdAdd />
            </button>
          </div>
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
            disabled={tieneMedicamentos} // Agregado
          ></textarea>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cantidad" className={styles.label}>
            Cantidad (días):
          </label>
          <input
            id="cantidad"
            className={styles.input}
            placeholder="Escribe la cantidad..."
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            disabled={tieneMedicamentos} // Agregado
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.addButton}
            onClick={handleAddToReceta}
            disabled={tieneMedicamentos} // Agregado
          >
            Añadir a la Receta
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={async () => {
              const result = await Swal.fire({
                title: "¿Estás seguro?",
                text: "Confirma si quieres añadir los medicamentos. Una vez añadidos no podrás editar la receta ni el diagnostico.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, añadir",
                cancelButtonText: "Cancelar",
                confirmButtonColor: "#6c5ce7",
                cancelButtonColor: "#d63031",
              });

              if (result.isConfirmed) {
                handleGuardarMedicamentos(); // Llama a la función para guardar los medicamentos
              } else {
                Swal.fire({
                  title: "Acción cancelada",
                  text: "No se añadieron los medicamentos.",
                  icon: "info",
                  confirmButtonColor: "#6c5ce7",
                });
              }
            }}
            disabled={tieneMedicamentos} // Validación existente
          >
            Guardar Medicamentos
          </button>

          {tieneMedicamentos && (
            <p className={styles.warningMessage}>
              <MdWarningAmber className={styles.warningIcon} />
              Ya existen un medicamentos registrados. No puedes agregar otro.
            </p>
          )}
        </div>

        {!tieneMedicamentos && (
          <div className={styles.temporalList}>
            <h3 className={styles.temporalTitle}>Medicamentos Añadidos</h3>
            {temporalMedicamentos.length > 0 ? (
              <div className={styles.temporalContainer}>
                {temporalMedicamentos.map((med) => (
                  <div key={med.id} className={styles.medicamentoCard}>
                    <div className={styles.medicamentoDetails}>
                      <p>
                        <strong>Medicamento:</strong> {med.medicamento}
                      </p>
                      <p>
                        <strong>Indicaciones:</strong> {med.indicaciones}
                      </p>
                      <p>
                        <strong>Cantidad:</strong> {med.cantidad}
                      </p>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={(event) => handleRemoveFromReceta(med.id, event)} // Pasa el evento como segundo argumento
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noMedicamentosMessage}>
                No se han añadido medicamentos aún.
              </p>
            )}
          </div>
        )}
      </form>

      <ModalRegistrarMedicamento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (nombre, tipo) => {
          try {
            await handleSaveMedicamento(nombre, tipo); // Guarda el medicamento
            await fetchMedicamentos(); // Refresca la lista de medicamentos
            setIsModalOpen(false); // Cierra el modal solo si todo es exitoso
          } catch (error) {
            console.error("Error al guardar el medicamento:", error.message);
          }
        }}
      />
    </div>
  );
};

export default MedicamentosForm;
