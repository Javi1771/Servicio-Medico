import React, { useState } from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/tablaMedicamentos.module.css"; // Usando import para los estilos
import {
  FaPills,
  FaRegEdit,
  FaHashtag,
  FaBoxes,
  FaTrashAlt
} from "react-icons/fa"; // Importamos los iconos

const TablaMedicamentos = ({
  onGenerarReceta, // Asegúrate de recibir esta prop
  folioPase, // Folio pasado desde el componente padre
  medicamentos, // Medicamentos de la receta (vista por defecto)
  loading,
  error,
  onRemoveMedicamento,
  // Props para historial
  surtimientos,
  loadingSurtimientos,
  errorSurtimientos,
  onFetchSurtimientos,
  detalle,
  loadingDetalle,
  errorDetalle,
  onFetchDetalleSurtimiento,
}) => {
  // Estado para controlar la vista: "default" | "surtimientos" | "detalle"
  const [modo, setModo] = useState("default");
  // Guardar el folio del surtimiento seleccionado
  const [surtSeleccionado, setSurtSeleccionado] = useState(null);

  // --- Manejo de vistas ---
  const handleMostrarHistorial = () => {
    onFetchSurtimientos(folioPase);
    setModo("surtimientos");
  };

  const handleVerDetalle = (folioSurtimiento) => {
    onFetchDetalleSurtimiento(folioSurtimiento);
    setSurtSeleccionado(folioSurtimiento);
    setModo("detalle");
  };

  const handleVolverAtras = () => {
    if (modo === "detalle") {
      setModo("surtimientos");
      setSurtSeleccionado(null);
    } else {
      setModo("default");
    }
  };

  return (
    <div className={styles.tableContainer}>
      {/* Renderizado según el modo */}
      {modo === "default" && (
        <DefaultView
          loading={loading}
          error={error}
          medicamentos={medicamentos}
          onRemoveMedicamento={onRemoveMedicamento}
          onMostrarHistorial={handleMostrarHistorial}
        />
      )}

      {modo === "surtimientos" && (
        <SurtimientosView
          loadingSurtimientos={loadingSurtimientos}
          errorSurtimientos={errorSurtimientos}
          surtimientos={surtimientos}
          onVolverAtras={handleVolverAtras}
          onVerDetalle={handleVerDetalle}
          onGenerarReceta={onGenerarReceta} // Pasamos la función aquí
        />
      )}

      {modo === "detalle" && (
        <DetalleView
          loadingDetalle={loadingDetalle}
          errorDetalle={errorDetalle}
          detalle={detalle}
          surtSeleccionado={surtSeleccionado}
          onVolverAtras={handleVolverAtras}
        />
      )}
    </div>
  );
};

/* Vista por defecto: Medicamentos Recetados */
const DefaultView = ({
  loading,
  error,
  medicamentos,
  onRemoveMedicamento,
  onMostrarHistorial,
}) => {
  if (loading)
    return <p className={styles.loading}>Cargando medicamentos...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;
  if (!medicamentos || medicamentos.length === 0)
    return <p className={styles.error}>No hay medicamentos asignados.</p>;

  return (
    <>
      <div className={styles.headerContainer}>
        <h3 className={styles.headerTitle}>Medicamentos Recetados</h3>
      </div>

      <table className={styles.medicamentosTable}>
        <thead>
          <tr>
            <th>
              <FaPills className={styles.icon} /> Medicamento
            </th>
            <th>
              <FaRegEdit className={styles.icon} /> Indicaciones
            </th>
            <th>
              <FaHashtag className={styles.icon} /> Cantidad
            </th>
            <th>
              <FaBoxes className={styles.icon} /> Piezas
            </th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {medicamentos.map((med) => (
            <tr key={med.claveMedicamento}>
              <td>
                <FaPills className={styles.icon} /> {med.nombreMedicamento}
              </td>
              <td>
                <FaRegEdit className={styles.icon} /> {med.indicaciones}
              </td>
              <td>
                <FaHashtag className={styles.icon} /> {med.cantidad}
              </td>
              <td>
                <FaBoxes className={styles.icon} /> {med.piezas}
              </td>
              <td>
                <button
                  onClick={() => onRemoveMedicamento(med)}
                  className={styles.removeButton}
                >
                  <FaTrashAlt className={styles.icon} /> Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default TablaMedicamentos;
