import React, { useState, useEffect } from "react";
import styles from "../../css/estilosSurtimientos/tablaResultados.module.css";

export default function TablaResultados({ data }) {
  const [medicamentosMap, setMedicamentosMap] = useState({}); // Mapeo clave -> medicamento

  // Función para obtener el nombre del medicamento por clave
  const fetchMedicamentoByClave = async (claveMedicamento) => {
    try {
      const response = await fetch(
        `/api/surtimientos/getMedicamentoByClave?claveMedicamento=${claveMedicamento}`
      );
      if (!response.ok) {
        throw new Error("No se pudo obtener el medicamento.");
      }
      const result = await response.json();
      return result.medicamento; // Devuelve el nombre del medicamento
    } catch (error) {
      console.error(`Error al obtener el medicamento ${claveMedicamento}:`, error.message);
      return "No disponible";
    }
  };

  // Cargar medicamentos al montar el componente
  useEffect(() => {
    const loadMedicamentos = async () => {
      const newMedicamentosMap = { ...medicamentosMap };

      for (const detalle of data) {
        const clave = detalle.descMedicamento; // Clave del medicamento en los datos
        if (!newMedicamentosMap[clave]) {
          const medicamentoNombre = await fetchMedicamentoByClave(clave);
          newMedicamentosMap[clave] = medicamentoNombre; // Mapea clave -> nombre
        }
      }

      setMedicamentosMap(newMedicamentosMap);
    };

    if (data && data.length > 0) {
      loadMedicamentos();
    }
  }, [data]);

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
            <th>Clave Medicamento</th>
            <th>Nombre del Medicamento</th>
            <th>Indicaciones</th>
            <th>Cantidad</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {data.map((detalle) => (
            <tr key={detalle.idDetalleReceta}>
              <td data-label="ID">{detalle.idDetalleReceta}</td>
              <td data-label="Clave Medicamento">{detalle.descMedicamento}</td>
              <td data-label="Nombre del Medicamento">
                {medicamentosMap[detalle.descMedicamento] || "Cargando..."}
              </td>
              <td data-label="Indicaciones">{detalle.indicaciones}</td>
              <td data-label="Cantidad">{detalle.cantidad}</td>
              <td data-label="Estatus">
                {detalle.estatus === 1 ? (
                  <span style={{ color: "limegreen" }}>✔ Activo</span>
                ) : (
                  <span style={{ color: "red" }}>✘ Inactivo</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
