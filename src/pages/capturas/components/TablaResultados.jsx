import React, { useState, useEffect, useCallback } from "react";
import useUpdateEstatus from "../../../hooks/surtimientosHook/useUpdateEstatus";
import styles from "../../css/estilosSurtimientos/tablaResultados.module.css";
import Swal from "sweetalert2";


export default function TablaResultados({ data, onEstatusUpdated }) {
  const [medicamentosMap, setMedicamentosMap] = useState({});
  const { updateEstatus, loading, error } = useUpdateEstatus();

  const fetchMedicamentoByClave = async (claveMedicamento) => {
    try {
      const response = await fetch(
        `/api/surtimientos/getMedicamentoByClave?claveMedicamento=${claveMedicamento}`
      );
      if (!response.ok) throw new Error("No se pudo obtener el medicamento.");
      const result = await response.json();
      return result.medicamento;
    } catch {
      return "No disponible";
    }
  };

  // Memoizar la función loadMedicamentos
  const loadMedicamentos = useCallback(async () => {
    const newMedicamentosMap = { ...medicamentosMap };
    for (const detalle of data) {
      const clave = detalle.descMedicamento;
      if (!newMedicamentosMap[clave]) {
        const medicamentoNombre = await fetchMedicamentoByClave(clave);
        newMedicamentosMap[clave] = medicamentoNombre;
      }
    }
    setMedicamentosMap(newMedicamentosMap);
  }, [data, medicamentosMap]);

  useEffect(() => {
    if (data && data.length > 0) {
      loadMedicamentos();
    }
  }, [data, loadMedicamentos]);

  const handleDelete = async (idDetalleReceta) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Este medicamento será marcado como inactivo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d63031",
      cancelButtonColor: "#6c5ce7",
    });
  
    if (!result.isConfirmed) return;
  
    try {
      const updateResult = await updateEstatus(idDetalleReceta, 0);
      if (updateResult.success) {
        Swal.fire({
          title: "Eliminado",
          text: "El medicamento ha sido marcado como inactivo.",
          icon: "success",
          confirmButtonColor: "#6c5ce7",
        });
        onEstatusUpdated(); // Llamar a la función para refrescar los datos
      } else {
        throw new Error("No se pudo actualizar el registro.");
      }
    } catch (error) {
      console.error("Error al eliminar el medicamento:", error.message);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el registro.",
        icon: "error",
        confirmButtonColor: "#d63031",
      });
    }
  };
  

  if (!data || data.length === 0) {
    return <p>No hay detalles disponibles.</p>;
  }

  return (
    <div className={styles.tableContainer}>
      <h2 className={styles.title}>Detalles del Surtimiento</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre del Medicamento</th>
            <th>Indicaciones</th>
            <th>Cantidad</th>
            <th>Estatus</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter((detalle) => detalle.estatus === 1) // Filtrar solo los registros activos
            .map((detalle) => (
              <tr key={detalle.idDetalleReceta}>
                <td>{detalle.idDetalleReceta}</td>
                <td>{detalle.descMedicamento}</td>
                <td>{detalle.indicaciones}</td>
                <td>{detalle.cantidad}</td>
                <td>
                  <span style={{ color: "limegreen" }}>✔ Activo</span>
                </td>
                <td>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(detalle.idDetalleReceta)}
                    disabled={loading}
                  >
                    {loading ? "Quitando..." : "Quitar"}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {error && <p className={styles.errorMessage}>Error: {error}</p>}
    </div>
  );
}
