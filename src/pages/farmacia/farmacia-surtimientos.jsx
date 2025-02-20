// pages/farmacia/farmacia-surtimientos.jsx
import React, { useState } from 'react';
import styles from '../css/EstilosFarmacia/FarmaciaSurtimientos.module.css';
import SurtimientosTable from './components/surtimientosTable';
import useSurtimientos from '../../hooks/farmaciaHook/useSurtimientos';

const FarmaciaSurtimientos = () => {
  const [barcode, setBarcode] = useState('');
  const { data, loading, error, fetchSurtimientos } = useSurtimientos();

  const handleSearch = async () => {
    await fetchSurtimientos(barcode);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Farmacia Surtimientos</h1>
        <div className={styles.inputContainer}>
          <label htmlFor="barcode" className={styles.label}>Código de Barras</label>
          <input
            id="barcode"
            type="text"
            placeholder="Escanea el código de barras"
            className={styles.input}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
        <button onClick={handleSearch} className={styles.button}>Buscar</button>
        {loading && <p>Cargando...</p>}
        {error && <p>Error: {error}</p>}
        {data && <SurtimientosTable data={data} />}
      </div>
    </div>
  );
};

export default FarmaciaSurtimientos;
