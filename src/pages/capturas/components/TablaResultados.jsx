import React, { useState, useEffect } from "react";
import styles from "../../css/estilosSurtimientos/tablaResultados.module.css";

export default function TablaResultados({ data }) {
  const [medicamentosMap, setMedicamentosMap] = useState({}); // Mapeo clave -> medicamento

  // Función para obtener el nombre del medicamento
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

  // Cargar todos los medicamentos al montar el componente o al cambiar los datos
  useEffect(() => {
    const loadMedicamentos = async () => {
      const newMedicamentosMap = {};

      for (const detalle of data) {
        if (!newMedicamentosMap[detalle.claveMedicamento]) {
          const medicamentoNombre = await fetchMedicamentoByClave(
            detalle.claveMedicamento
          );
          newMedicamentosMap[detalle.claveMedicamento] = medicamentoNombre;
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
            <th>Medicamento</th>
            <th>Indicaciones</th>
            <th>Cantidad</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {data.map((detalle) => (
            <tr key={detalle.idSurtimiento}>
              <td data-label="ID">{detalle.idSurtimiento}</td>
              <td data-label="Clave Medicamento">{detalle.claveMedicamento}</td>
              <td data-label="Medicamento">
                {medicamentosMap[detalle.claveMedicamento] || "Cargando..."}
              </td>
              <td data-label="Indicaciones">{detalle.indicaciones}</td>
              <td data-label="Cantidad">{detalle.cantidad}</td>
              <td data-label="Estatus">{detalle.estatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
