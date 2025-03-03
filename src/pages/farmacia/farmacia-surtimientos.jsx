import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../css/EstilosFarmacia/FarmaciaSurtimientos.module.css';
import SurtimientosTable from './components/surtimientosTable';
import useSurtimientos from '../../hooks/farmaciaHook/useSurtimientos';

const FarmaciaSurtimientos = () => {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const { data, setData, loading, error, fetchSurtimientos } = useSurtimientos();

  const handleSearch = async () => {
    await fetchSurtimientos(barcode);
  };

  // Redireccionar a /inicio-servicio-medico
  const handleRegresar = () => {
    router.push('/inicio-servicio-medico');
  };

  // Limpiar la pantalla después de guardar
  const limpiarPantalla = () => {
    setData(null);
    setBarcode("");
  };

  return (
    <div className={data ? styles.containerFlow : styles.containerCentered}>
      {/* La tarjeta del formulario cambia su estilo según si hay datos */}
      <div className={`${styles.card} ${data ? styles.cardWide : styles.cardEmpty}`}>
        <button
          onClick={handleRegresar}
          className={`${styles.button} ${styles['button-secondary']}`}
        >
          Regresar
        </button>
        <h1 className={styles.title}>Farmacia Surtimientos</h1>
        <div className={styles.inputContainer}>
          <label htmlFor="barcode" className={styles.label}>
            Código de Barras
          </label>
          <input
            id="barcode"
            type="text"
            placeholder="Escanea el código de barras"
            className={styles.input}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
        <button
          onClick={handleSearch}
          className={`${styles.button} ${styles['button-primary']}`}
        >
          Buscar
        </button>
        {loading && <p>Cargando...</p>}
        {error && <p>Error: {error}</p>}
      </div>
      
      {data && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Información del Surtimiento</h2>
          <div className={styles.sectionContent}>
            <div className={styles.dataCard}>
              <span className={styles.dataCardLabel}>Núm. de Surtimiento</span>
              <span className={styles.dataCardValue}>{data.numeroSurtimiento}</span>
            </div>
            <div className={styles.dataCard}>
              <span className={styles.dataCardLabel}>Paciente</span>
              <span className={styles.dataCardValue}>{data.paciente}</span>
            </div>
            <div className={styles.dataCard}>
              <span className={styles.dataCardLabel}>Fecha</span>
              <span className={styles.dataCardValue}>{data.fecha}</span>
            </div>
          </div>
          <SurtimientosTable data={data} resetSurtimiento={limpiarPantalla} />
        </div>
      )}
    </div>
  );
};

export default FarmaciaSurtimientos;
