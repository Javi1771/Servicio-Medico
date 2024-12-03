import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import styles from "../../css/EstilosFarmacia/SurtirMedicamentoModal.module.css";

const parentescoMap = {
  1: "Esposo(a)",
  2: "Hijo(a)",
  3: "Concubino(a)",
  4: "Padre",
  5: "Madre",
};

const SurtirMedicamentoModal = ({
  isOpen,
  onClose,
  medicamentos,
  beneficiario,
}) => {
  const [medicamentoId, setMedicamentoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState("");

  useEffect(() => {
    // Establecer la fecha actual al abrir el modal
    if (isOpen) {
      const fechaActual = new Date().toISOString().split("T")[0]; // Formato yyyy-mm-dd
      setFechaEntrega(fechaActual);
    }
  }, [isOpen]);

  if (!isOpen || !beneficiario) return null;

  // Variants para animaciones
  const slideVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Manejar la selección del medicamento
  const handleMedicamentoChange = (e) => {
    const selectedId = e.target.value;
    setMedicamentoId(selectedId); // <-- Actualiza el estado de medicamentoId
  
    const medicamento = medicamentos.find(
      (med) => med.id === parseInt(selectedId)
    );
    setSelectedMedicamento(medicamento);
    setCantidad(""); // Reinicia la cantidad cuando se selecciona un nuevo medicamento
  };

  // Manejar el cambio en el campo de cantidad
  const handleCantidadChange = (e) => {
    const value = e.target.value;
    if (
      selectedMedicamento &&
      parseInt(value) > selectedMedicamento.piezas // Validación
    ) {
      Swal.fire({
        icon: "error",
        title: "Cantidad excedida",
        text: `La cantidad ingresada no puede exceder las piezas disponibles (${selectedMedicamento.piezas}).`,
        background: "#1e1e2d",
        color: "#ffffff",
        confirmButtonColor: "#fa009a",
      });
      return;
    }
    setCantidad(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validaciones antes del envío
    if (!selectedMedicamento || !cantidad || cantidad <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Selecciona un medicamento y una cantidad válida.",
        background: "#1e1e2d",
        color: "#ffffff",
        confirmButtonColor: "#fa009a",
      });
      return;
    }
  
    Swal.fire({
      icon: "success",
      title: "Registro Exitoso",
      text: "El medicamento fue registrado correctamente.",
      background: "#1e1e2d",
      color: "#ffffff",
      confirmButtonColor: "#00fa9a",
    });
  
    // Resetea el formulario y cierra el modal
    setMedicamentoId("");
    setCantidad("");
    setObservaciones("");
    setSelectedMedicamento(null);
    onClose();
  };

  return (
    <motion.div
      className={styles.modalBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={slideVariants}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div
        className={styles.modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeVariants}
        transition={{ duration: 0.3 }}
      >
        <button className={styles.modalCloseButton} onClick={onClose}>
          ✕
        </button>
        <h3 className={styles.modalTitle}>Registrar Medicamento</h3>
        <form className={styles.surtirForm} onSubmit={handleSubmit}>
          {/* Contenedor principal de dos columnas */}
          <div className={styles.formColumns}>
            {/* Columna izquierda */}
            <div className={styles.column}>
              <div className={styles.formGroup}>
                <label htmlFor="beneficiarioNombre">
                  Nombre del Beneficiario
                </label>
                <input
                  type="text"
                  id="beneficiarioNombre"
                  value={`${beneficiario.NOMBRE} ${beneficiario.A_PATERNO} ${beneficiario.A_MATERNO}`}
                  className={styles.textInput}
                  readOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="noNomina">Número de Nómina</label>
                <input
                  type="text"
                  id="noNomina"
                  value={beneficiario.NO_NOMINA}
                  className={styles.textInput}
                  readOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="parentesco">Parentesco</label>
                <input
                  type="text"
                  id="parentesco"
                  value={
                    parentescoMap[beneficiario.PARENTESCO] || "No especificado"
                  }
                  className={styles.textInput}
                  readOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="edad">Edad</label>
                <input
                  type="text"
                  id="edad"
                  value={beneficiario.EDAD}
                  className={styles.textInput}
                  readOnly
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className={styles.column}>
              <div className={styles.formGroup}>
                <label htmlFor="fechaEntrega">Fecha de Entrega</label>
                <input
                  type="date"
                  id="fechaEntrega"
                  className={styles.textInput}
                  value={fechaEntrega}
                  readOnly
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="medicamento">Medicamento</label>
                <select
                  id="medicamento"
                  className={styles.selectInput}
                  onChange={handleMedicamentoChange}
                >
                  <option value="">Seleccionar Medicamento</option>
                  {Array.isArray(medicamentos) && medicamentos.length > 0 ? (
                    medicamentos.map((medicamento) => (
                      <option key={medicamento.id} value={medicamento.id}>
                        {`${medicamento.sustancia} (Piezas: ${medicamento.piezas})`}
                      </option>
                    ))
                  ) : (
                    <option disabled>No hay medicamentos disponibles</option>
                  )}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="cantidad">Cantidad</label>
                <input
                  type="number"
                  id="cantidad"
                  placeholder="Cantidad a surtir"
                  className={styles.textInput}
                  value={cantidad}
                  onChange={handleCantidadChange}
                  disabled={!selectedMedicamento} // Deshabilitar si no se selecciona un medicamento
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  placeholder="Añadir observaciones..."
                  className={styles.textInput}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
          <button type="submit" className={styles.submitButton}>
            Registrar
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SurtirMedicamentoModal;
