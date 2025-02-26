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

  // 🔹 Función para limpiar la pantalla después de guardar
  const limpiarPantalla = () => {
    setData(null); // Resetea los datos
    setBarcode(""); // Limpia el input del código de barras
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Botón de Regresar */}
        <button onClick={handleRegresar} className={styles.button}>
          Regresar
        </button>
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
        {data && <SurtimientosTable data={data} resetSurtimiento={limpiarPantalla} />}
      </div>
    </div>
  );
};

export default FarmaciaSurtimientos;
