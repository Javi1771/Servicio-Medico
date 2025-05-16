// components/ResurtimientoTable.jsx
import React, { useEffect } from 'react';
import { useGetResurtimientos } from '../../../hooks/Surtimientos3/useGetMedicamentosSurtir';
import styles from '../../css/surtimientos3/ResurtimientoTable.module.css';
import { 
  FiMonitor, 
  FiClipboard, 
  FiBox, 
  FiCalendar, 
  FiRefreshCw, 
  FiMinusCircle 
} from 'react-icons/fi';

export default function ResurtimientoTable({ folioReceta }) {
  const { items, loadingRes, errorRes, getResurtimientos } = useGetResurtimientos();

  useEffect(() => {
    if (folioReceta) getResurtimientos(folioReceta);
  }, [folioReceta, getResurtimientos]);

  if (!folioReceta) return null;

  return (
    <div className={styles.tableContainer}>
      <h3>Medicamentos a Resurtir</h3>

      {loadingRes && <p className={styles.infoMessage}>Cargando medicamentos...</p>}
      {errorRes && <p className={styles.error}>{errorRes}</p>}
      {!loadingRes && items.length === 0 && (
        <p className={styles.infoMessage}>No hay resurtimientos pendientes.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th><FiMonitor size={16}/> Medicamento</th>
              <th><FiClipboard size={16}/> Indicaciones</th>
              <th><FiBox size={16}/> Piezas</th>
              <th><FiCalendar size={16}/> Meses Totales</th>
              <th><FiRefreshCw size={16}/> Meses Surtidos</th>
              <th><FiMinusCircle size={16}/> Faltan</th>
            </tr>
          </thead>
          <tbody>
            {items.map(md => (
              <tr key={md.idDetalleReceta}>
                <td>{md.nombreMedicamento || md.clavemedicamento}</td>
                <td>{md.indicaciones}</td>
                <td>{md.piezas}</td>
                <td>{md.cantidadMeses}</td>
                <td>{md.surtimientoActual}</td>
                <td>{md.cantidadMeses - md.surtimientoActual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
