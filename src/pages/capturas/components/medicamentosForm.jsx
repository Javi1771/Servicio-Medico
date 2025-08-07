/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback } from "react";
import HistorialSurtimientos from "./historialSurtimientos"; // Importar el componente HistorialSurtimientos
import styles from "../../css/estilosSurtimientos/tableSurtimientos.module.css";
import { MdWarningAmber } from "react-icons/md";
import ModalRegistrarMedicamento from "../components/modalRegistrarMedicamento";
import { MdAdd } from "react-icons/md";
import Cookies from "js-cookie";
import { showCustomAlert } from "../../../utils/alertas"; // Importar la función de alerta personalizada

const MedicamentosForm = ({
  folioConsulta,
  diagnostico,
  onFormSubmitted,
  detalles,
}) => {
  const [medicamentoMap, setMedicamentoMap] = useState({}); // Mapeo de claveMedicamento -> descripción

  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const [medicamentos, setMedicamentos] = useState([]);
  const [selectedMedicamento, setSelectedMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");

  const [setIsGuardadoHabilitado] = useState(false);

  const [temporalMedicamentos, setTemporalMedicamentos] = useState([]); // Temporal storage

  // Función para obtener el medicamento por clave
  const fetchMedicamentoDescripcion = useCallback(
    async (claveMedicamento) => {
      if (medicamentoMap[claveMedicamento]) {
        return medicamentoMap[claveMedicamento]; // Retorna si ya está en el mapeo
      }

      try {
        const response = await fetch(
          `/api/surtimientos/getMedicamentoByClave?claveMedicamento=${claveMedicamento}`
        );
        if (!response.ok) throw new Error("No se pudo obtener el medicamento.");
        const data = await response.json();
        setMedicamentoMap((prev) => ({
          ...prev,
          [claveMedicamento]: data.medicamento, // Agrega al mapeo
        }));
        return data.medicamento;
      } catch (error) {
        console.error("Error al obtener medicamento:", error.message);
        return "Descripción no disponible";
      }
    },
    [medicamentoMap]
  );

  // Al renderizar, llena el mapa de medicamentos dinámicamente
  useEffect(() => {
    const fetchDescripciones = async () => {
      const clavesUnicas = [
        ...new Set(temporalMedicamentos.map((med) => med.medicamento)),
      ];
      for (const clave of clavesUnicas) {
        await fetchMedicamentoDescripcion(clave);
      }
    };
    fetchDescripciones();
  }, [temporalMedicamentos, fetchMedicamentoDescripcion]);

  useEffect(() => {
    fetchMedicamentos();
    validarEspecialidad();
  }, [folioConsulta, validarEspecialidad]);

  // Nueva validación: deshabilitar botón si ya existe al menos un medicamento
  const tieneMedicamentos = detalles?.length > 0;

  const handleRemoveFromReceta = async (id, event) => {
    event.preventDefault(); // Evita el refresco de la página
    await showCustomAlert(
      "warning",
      "¿Estás seguro?",
      "El medicamento será eliminado de la lista temporal.",
      "Sí, eliminar"
    ).then(async (result) => {
      if (result.isConfirmed) {
        const nuevosMedicamentos = temporalMedicamentos.filter(
          (med) => med.id !== id
        );
        setTemporalMedicamentos(nuevosMedicamentos);

        await showCustomAlert(
          "success",
          "Eliminado",
          "El medicamento ha sido eliminado de la lista temporal.",
          "Aceptar"
        );
      }
    });
  };

  const handleAddToReceta = async () => {
    //console.log("Medicamento seleccionado:", selectedMedicamento); // Aquí debe ser la clave
    if (!selectedMedicamento || !indicaciones || !cantidad) {
      await showCustomAlert(
        "warning",
        "Campos incompletos",
        "Por favor completa todos los campos antes de añadir.",
        "Aceptar"
      );

      return;
    }

    // Validación para evitar medicamentos duplicados
    const medicamentoExistente = temporalMedicamentos.some(
      (med) => med.medicamento === selectedMedicamento
    );
    if (medicamentoExistente) {
      await showCustomAlert(
        "warning",
        "Medicamento duplicado",
        "Este medicamento ya ha sido añadido. No puedes duplicarlo.",
        "Aceptar"
      );

      return;
    }
    // Agregar el medicamento al estado temporal
    const nuevoMedicamento = {
      id: temporalMedicamentos.length + 1,
      medicamento: selectedMedicamento, // Aquí debe ser la clave
      indicaciones,
      cantidad,
    };

    setTemporalMedicamentos([...temporalMedicamentos, nuevoMedicamento]);

    // Limpiar los campos
    setSelectedMedicamento("");
    setIndicaciones("");
    setCantidad("");

    await showCustomAlert(
      "success",
      "Añadido",
      "El medicamento ha sido añadido a la lista temporal.",
      "Aceptar"
    );
  };

  const guardarMedicamentos = async (consultaData) => {
    try {
      // Datos a enviar a la API
      const datosSurtimiento = {
        folioPase: folioConsulta,
        fechaEmision: new Date(),
        nomina: consultaData.clavenomina,
        clavePaciente: consultaData.clavepaciente,
        nombrePaciente: consultaData.nombrepaciente,
        esEmpleado: consultaData.elpacienteesempleado,
        edad: consultaData.edad, // Obtener la edad directamente de la consulta
        claveMedico: consultaData.claveproveedor,
        diagnostico: diagnostico, // Asegúrate de que el diagnóstico se esté enviando
        departamento: consultaData.departamento.trim().replace(/\s+/g, " "), // ← Limpieza del valor
        estatus: 1,
        fechaDespacho: null,
        sindicato: consultaData.sindicato, // Obtener el sindicato directamente de la consulta
        claveUsuario: Cookies.get("claveusuario") || "No especificado",
      };

      const newInsertResponse = await fetch(
        "/api/surtimientos/addSurtimiento",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosSurtimiento),
        }
      );

      if (!newInsertResponse.ok) {
        throw new Error("Error al insertar en la tabla SURTIMIENTOS.");
      }

      const newInsertData = await newInsertResponse.json();
      const nuevoFolio = newInsertData.nuevoFolio; // Obtener el nuevo FOLIO_SURTIMIENTO

      // Insertar en la tabla DETALLE_SURTIMIENTOS
      for (const med of temporalMedicamentos) {
        const claveMedicamento = med.medicamento;
        const cantidad = med.cantidad;

        if (!claveMedicamento || !cantidad) {
          throw new Error(
            `El medicamento ${med.medicamento} o la cantidad ${med.cantidad} no tienen un ID válido.`
          );
        }

        const response = await fetch(
          "/api/surtimientos/addDetalleSurtimiento",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folioSurtimiento: nuevoFolio, // Usar el nuevo FOLIO_SURTIMIENTO
              claveMedicamento,
              indicaciones: med.indicaciones,
              cantidad,
              estatus: 1,
            }),
          }
        );

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
      await showCustomAlert(
        "success",
        "¡Éxito!",
        "Todos los medicamentos, el diagnóstico y los nuevos datos han sido guardados exitosamente.",
        "Aceptar"
      );

      // Limpiar los registros temporales y refrescar los datos en el componente padre
      setTemporalMedicamentos([]);
      onFormSubmitted(); // Refrescar los datos en el componente padre
    } catch (error) {
      console.error("Error al guardar medicamentos:", error.message);

      await showCustomAlert(
        "error",
        "Error",
        "No se pudo guardar uno o más medicamentos.",
        "Intentar de nuevo"
      );
    }
  };

  const handleGuardarMedicamentos = async () => {
    try {
      // Obtener datos de la consulta
      const consultaResponse = await fetch(
        `/api/surtimientos/getConsultaByFolio?folio=${folioConsulta}`
      );
      if (!consultaResponse.ok) {
        throw new Error("Error al obtener los datos de la consulta.");
      }
      const consultaData = await consultaResponse.json();

      // Verificar el campo seasignoaespecialidad
      const { seasignoaespecialidad } = consultaData;

      // Si seasignoaespecialidad es 'N', permitir guardar sin validaciones
      if (seasignoaespecialidad === "N") {
        await guardarMedicamentos(consultaData);
        return;
      }

      // Validar que haya al menos un medicamento en el estado temporal
      if (temporalMedicamentos.length === 0) {
        await showCustomAlert(
          "warning",
          "Sin medicamentos",
          "No hay medicamentos para guardar. Añade al menos uno.",
          "Aceptar"
        );

        return;
      }

      // Validar que el diagnóstico no esté vacío
      if (!diagnostico || diagnostico.trim() === "") {
        await showCustomAlert(
          "warning",
          "Falta el diagnóstico",
          "Es obligatorio registrar un diagnóstico antes de guardar medicamentos.",
          "Aceptar"
        );
        return;
      }

      await guardarMedicamentos(consultaData);
    } catch (error) {
      console.error("Error al guardar medicamentos:", error.message);

      await showCustomAlert(
        "error",
        "Error al guardar medicamentos",
        "No se pudo guardar uno o más medicamentos.",
        "Intentar de nuevo"
      );
    }
  };

  const handleSaveMedicamento = async (nombre, tipo) => {
    //console.log("Enviando datos al servidor:", { nombre, tipo });

    try {
      const response = await fetch("/api/surtimientos/addNuevoMedicamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, tipo }),
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar el medicamento.");
      }

      await showCustomAlert(
        "success",
        "Medicamento registrado",
        "El medicamento ha sido registrado exitosamente.",
        "Aceptar"
      );

      fetchMedicamentos();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar el medicamento:", error.message);

      await showCustomAlert(
        "error",
        "Error al guardar el medicamento",
        "No se pudo guardar el medicamento. Por favor, intenta de nuevo.",
        "Aceptar"
      );
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
      if (!response.ok) {
        throw new Error("Error al obtener la lista de medicamentos.");
      }

      const data = await response.json();
      //console.log("Medicamentos obtenidos:", data); // Verifica el resultado aquí

      setMedicamentos(
        data.map((item) => ({
          CLAVEMEDICAMENTO: item.CLAVEMEDICAMENTO,
          MEDICAMENTO: item.MEDICAMENTO,
        }))
      );
    } catch (error) {
      console.error("Error fetching medicamentos:", error.message);

      await showCustomAlert(
        "error",
        "Error al obtener medicamentos",
        "No se pudo obtener la lista de medicamentos. Por favor, intenta de nuevo más tarde.",
        "Aceptar"
      );
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.headerContainer}>
        <h2 className={styles.title}>Seleccionar Medicamento</h2>
      </div>
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
            >
              <option value="" disabled>
                -- Selecciona un medicamento --
              </option>
              {medicamentos.map((medicamento) => (
                <option
                  key={medicamento.CLAVEMEDICAMENTO}
                  value={medicamento.CLAVEMEDICAMENTO}
                >
                  {medicamento.MEDICAMENTO}
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
              const result = await showCustomAlert(
                "warning",
                "¿Estás seguro?",
                "Confirma si quieres añadir los medicamentos. Una vez añadidos no podrás editar la receta ni el diagnóstico.",
                "Sí, añadir"
              );

              if (result.isConfirmed) {
                handleGuardarMedicamentos(); // Llama a la función para guardar los medicamentos
              } else {
                await showCustomAlert(
                  "info",
                  "Acción cancelada",
                  "No se añadieron los medicamentos.",
                  "Aceptar"
                );
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
                        <strong>Medicamento:</strong>{" "}
                        {medicamentoMap[med.medicamento] || "Cargando..."}
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
                      onClick={(event) => handleRemoveFromReceta(med.id, event)}
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
      <div className={styles.historialContent}>
        <HistorialSurtimientos folioPase={folioConsulta} />
      </div>

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
