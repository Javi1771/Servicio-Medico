// components/TopMedicamentos.jsx
import React, { useState } from 'react';
import useTopMedicamentos from '../../../hooks/farmaciaHook/useTopMedicamentos';
import styles from '../../css/EstilosFarmacia/TopMedicamentosPendientes.module.css';
import { FaPills } from 'react-icons/fa';

const TopMedicamentos = () => {
  // Valor inicial: la fecha de hoy, pero no se consulta hasta dar clic en "Consultar"
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  // fetchDate es la fecha efectiva para la consulta
  const [fetchDate, setFetchDate] = useState(null);

  // Hook que llama al endpoint solo cuando fetchDate tiene un valor
  const { topMedicamentos, loadingTop, errorTop } = useTopMedicamentos(fetchDate);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleConsultar = () => {
    // Asignamos la fecha seleccionada a fetchDate para que se dispare la consulta
    setFetchDate(selectedDate);
  };

  return (
    <div className={styles.topMedicamentosContainer}>
      <h2 className={styles.topMedicamentosTitle}>Top 20 Medicamentos Recetados</h2>

      <div className={styles.datePickerContainer}>
        <label htmlFor="datePicker">Selecciona Fecha: </label>
        <input 
          type="date" 
          id="datePicker" 
          value={selectedDate} 
          onChange={handleDateChange} 
          className={styles.datePicker}
        />
        <button onClick={handleConsultar} className={styles.consultarButton}>
          Consultar
        </button>
      </div>

      {/* Mensaje inicial si no se ha hecho clic en "Consultar" */}
      {fetchDate === null ? (
        <p>Por favor, seleccione una fecha y haga clic en Consultar.</p>
      ) : (
        <>
          {loadingTop && <p>Cargando top medicamentos...</p>}
          {errorTop && <p>Error: {errorTop}</p>}
          {!loadingTop && !errorTop && (
            <ul className={styles.topMedicamentosList}>
              {topMedicamentos.map((med) => (
                <li key={med.claveMedicamento} className={styles.topMedicamentoItem}>
                  <FaPills className={styles.iconLeft} />
                  <span className={styles.medicamentoName}>
                    {med.nombreMedicamento || med.claveMedicamento}
                  </span>
                  <span className={styles.medicamentoCount}>({med.total})</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default TopMedicamentos;
