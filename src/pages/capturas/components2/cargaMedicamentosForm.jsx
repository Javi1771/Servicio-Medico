import React, { useState } from "react";
import ModalPdf from "./modalPdf";
import styles from "../../css/SURTIMIENTOS_ESTILOS/cargaMedicamentos.module.css";
import {
  FaPills,
  FaRegEdit,
  FaHashtag,
  FaBoxes,
  FaPlus,
  FaSave,
} from "react-icons/fa";
import { showCustomAlert } from "../../../utils/alertas";

const CargaMedicamentosForm = ({
  medicamentos,
  onAddMedicamento,
  onSave,
  disableAdd,
  folio,
  receta,
}) => {
  // "searchText" es el texto que se muestra en el input.
  const [searchText, setSearchText] = useState("");
  // "selectedMedicamentoCode" es la clave real del medicamento.
  const [selectedMedicamentoCode, setSelectedMedicamentoCode] = useState("");

  const [indicaciones, setIndicaciones] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [piezas, setPiezas] = useState("");
  const [showModal, setShowModal] = useState(false);

  /**
   * Maneja el cambio de texto en el input.
   * Busca si el texto coincide con algún medicamento para obtener su clave.
   */
  const handleChangeMedicamento = (e) => {
    const newText = e.target.value;
    setSearchText(newText);

    // Busca si coincide exactamente con uno de los textos generados en la lista
    const foundMed = medicamentos.find((med) => {
      const displayText = getDisplayText(med);
      return displayText === newText;
    });

    // Si lo encuentra, guardamos la clave. Si no, ponemos "".
    if (foundMed) {
      setSelectedMedicamentoCode(foundMed.CLAVEMEDICAMENTO);
    } else {
      setSelectedMedicamentoCode("");
    }
  };

  /**
   * Devuelve el texto que se muestra en el <option> de cada medicamento.
   */
  const getDisplayText = (med) => {
    return `${med.MEDICAMENTO} - Presentación: c/${med.PRESENTACION} - Piezas: ${med.PIEZAS}`;
  };

  const handleAddMedicamentoLocal = async () => {
    // Validar si se ha seleccionado (por clave) un medicamento
    if (!selectedMedicamentoCode) {
      await showCustomAlert(
        "warning",
        "Selecciona un medicamento",
        "Por favor, selecciona un medicamento válido.",
        "Aceptar"
      );
      return;
    }
    if (!indicaciones.trim()) {
      await showCustomAlert(
        "warning",
        "Indicaciones requeridas",
        "Por favor, proporciona las indicaciones del medicamento.",
        "Aceptar"
      );

      return;
    }
    if (!cantidad.trim()) {
      await showCustomAlert(
        "warning",
        "Atención",
        "Por favor, proporciona la cantidad.",
        "Aceptar"
      );
      return;
    }
    if (!piezas.trim()) {
      await showCustomAlert(
        "warning",
        "Atención",
        "Por favor, proporciona las piezas.",
        "Aceptar"
      );

      return;
    }

    // Verificar si ya existe en la receta
    if (
      receta.find((med) => med.claveMedicamento === selectedMedicamentoCode)
    ) {

      await showCustomAlert(
        "error",
        "Error",
        "Este medicamento ya está en la receta."
      )
      return;
    }

    // Obtener la información del medicamento por la clave
    const medSeleccionado = medicamentos.find(
      (med) => med.CLAVEMEDICAMENTO === selectedMedicamentoCode
    );

    if (!medSeleccionado) {

await showCustomAlert(
  "error",
  "Error",
  "El medicamento seleccionado no existe."
)
      return;
    }

    const nuevoMedicamento = {
      claveMedicamento: selectedMedicamentoCode,
      nombreMedicamento: medSeleccionado.MEDICAMENTO,
      indicaciones,
      cantidad,
      piezas,
      clasificacion: medSeleccionado.CLASIFICACION,
    };

    onAddMedicamento(nuevoMedicamento);

    // Limpiar campos
    setSearchText("");
    setSelectedMedicamentoCode("");
    setIndicaciones("");
    setCantidad("");
    setPiezas("");
  };

  const handleSaveAndShowPdf = async () => {
    if (!folio || isNaN(folio)) {

await showCustomAlert(
  "error",
  "Folio Inválido",
  "El folio ingresado es inválido."
)
      return;
    }

    await onSave();
    setTimeout(() => {
      setShowModal(true);
    }, 1000);
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Carga de Medicamentos</h2>

      <div className={styles.inputGroup}>
        <label htmlFor="medicamento" className={styles.labelWithIcon}>
          <FaPills className={styles.icon} /> Medicamento
        </label>
        {/*
          Usamos un <input list="medicamentosList"> para que funcione como buscador.
          - "searchText" es lo que se muestra en el input.
          - "selectedMedicamentoCode" es la clave real.
        */}
        <input
          list="medicamentosList"
          id="medicamento"
          value={searchText}
          onChange={handleChangeMedicamento}
          className={styles.select}
          placeholder="Seleccionar Medicamento"
          disabled={disableAdd}
          style={{ width: "1146px" }} // Ajusta según necesites
        />
        <datalist id="medicamentosList">
          {medicamentos.map((med) => (
            <option key={med.CLAVEMEDICAMENTO} value={getDisplayText(med)} />
          ))}
        </datalist>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="indicaciones" className={styles.labelWithIcon}>
          <FaRegEdit className={styles.icon} /> Indicaciones
        </label>
        <input
          type="text"
          id="indicaciones"
          value={indicaciones}
          onChange={(e) => setIndicaciones(e.target.value)}
          className={styles.input}
          disabled={disableAdd}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="cantidad" className={styles.labelWithIcon}>
          <FaHashtag className={styles.icon} /> Cantidad
        </label>
        <input
          type="text"
          id="cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={styles.input}
          disabled={disableAdd}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="piezas" className={styles.labelWithIcon}>
          <FaBoxes className={styles.icon} /> Piezas
        </label>
        <input
          type="number"
          id="piezas"
          value={piezas}
          onChange={(e) => setPiezas(e.target.value)}
          className={styles.input}
          disabled={disableAdd}
        />
      </div>

      <button
        onClick={handleAddMedicamentoLocal}
        className={styles.addButton}
        disabled={disableAdd}
      >
        <FaPlus className={styles.icon} /> Añadir a la Receta
      </button>

      <button onClick={handleSaveAndShowPdf} className={styles.saveButton}>
        <FaSave className={styles.icon} /> Guardar y Generar Receta
      </button>

      {showModal && (
        <ModalPdf folio={folio} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default CargaMedicamentosForm;
