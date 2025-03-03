import React, { useState } from 'react';
import { useRouter } from 'next/router';
import SurtimientosTable from './components/surtimientosTable';
import useSurtimientos from '../../hooks/farmaciaHook/useSurtimientos';

const FarmaciaSurtimientos = () => {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const { data, setData, loading, error, fetchSurtimientos } = useSurtimientos();

  const handleSearch = async () => {
    await fetchSurtimientos(barcode);
  };

  const handleRegresar = () => {
    router.push('/inicio-servicio-medico');
  };

  // Función para limpiar la pantalla después de guardar
  const limpiarPantalla = () => {
    setData(null);
    setBarcode("");
  };

  // Si no hay datos, centra verticalmente; si hay datos, alinea hacia arriba
  const containerClasses = `min-h-screen bg-gray-100 flex justify-center ${data ? 'items-start' : 'items-center'} p-8`;
  // Ajusta el ancho máximo según si hay datos o no (más ancho para más contenido)
  const cardMaxWidth = data ? "max-w-5xl" : "max-w-3xl";

  return (
    <div className={containerClasses}>
      <div className={`bg-white p-8 rounded-2xl shadow-lg w-full ${cardMaxWidth} transform transition hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-blue-400 hover:ring-opacity-75`}>
        {/* Botón de Regresar */}
        <button
          onClick={handleRegresar}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
        >
          Regresar
        </button>
        <h1 className="text-3xl font-bold text-center text-gray-800 uppercase tracking-wider mb-6">
          Farmacia Surtimientos
        </h1>
        <div className="mb-4">
          <label htmlFor="barcode" className="block text-sm font-semibold text-gray-700 mb-2">
            Código de Barras
          </label>
          <input
            id="barcode"
            type="text"
            placeholder="Escanea el código de barras"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
        <button
          onClick={handleSearch}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition mb-4"
        >
          Buscar
        </button>
        {loading && <p className="text-center text-gray-600">Cargando...</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}
        {data && (
          <div className="mt-6 overflow-auto">
            <SurtimientosTable data={data} resetSurtimiento={limpiarPantalla} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmaciaSurtimientos;
