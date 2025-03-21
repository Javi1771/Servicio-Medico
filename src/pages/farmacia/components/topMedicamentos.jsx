// components/TopMedicamentos.jsx
import React from 'react';
import styles from '../../css/EstilosFarmacia/TopMedicamentos.module.css';

const TopMedicamentos = ({ data }) => {
  // Contabiliza la frecuencia de cada clave
  const frequency = {};
  data.forEach(item => {
    if(item.claveMedicamento) {
      frequency[item.claveMedicamento] = (frequency[item.claveMedicamento] || 0) + 1;
    }
  });

  // Ordena descendente y toma los 20 primeros
  const sortedMedicamentos = Object.entries(frequency)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 20);

  return (
    <div className={styles.topContainer}>
      <h2 className={styles.topTitle}>Top Medicamentos Pendientes</h2>
      <ul className={styles.topList}>
        {sortedMedicamentos.map(([clave, count]) => (
          <li key={clave} className={styles.topItem}>
            <span className={styles.medKey}>{clave}</span>
            <span className={styles.medCount}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopMedicamentos;
