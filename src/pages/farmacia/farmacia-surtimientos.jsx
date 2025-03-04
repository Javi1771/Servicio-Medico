import React, { useState } from "react";
import { useRouter } from "next/router";
import { FaSearch, FaExclamationCircle, FaArrowLeft } from "react-icons/fa";
import SurtimientosTable from "./components/surtimientosTable";
import useSurtimientos from "../../hooks/farmaciaHook/useSurtimientos";

const FarmaciaSurtimientos = () => {
  const router = useRouter();
  const [barcode, setBarcode] = useState("");
  const { data, setData, loading, error, fetchSurtimientos } =
    useSurtimientos();

  const handleSearch = async () => {
    await fetchSurtimientos(barcode);
  };

  const handleRegresar = () => {
    router.push("/inicio-servicio-medico");
  };

  // Función para limpiar la pantalla después de guardar
  const limpiarPantalla = () => {
    setData(null);
    setBarcode("");
  };

  // Estilos del contenedor principal
  // - Ocupa toda la pantalla
  // - Fondo con un degradado suave
  // - Centra el contenido
  const containerClasses = `
    min-h-screen 
    flex
    justify-center
    ${data ? "items-start" : "items-center"}
    p-8
    bg-gradient-to-br
    from-blue-100
    to-cyan-50
  `;

  // Ajuste de ancho máximo
  const cardMaxWidth = data ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className={containerClasses}>
      <div
        className={`
          w-full
          ${cardMaxWidth}
          bg-white
          rounded-lg
          shadow-lg
          p-8
          transition
          hover:shadow-xl
        `}
      >
        {/* Botón de Regresar */}
        <button
          onClick={handleRegresar}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition"
        >
          <FaArrowLeft />
          <span>Regresar</span>
        </button>

        {/* Título principal */}
        <h1 className="text-3xl font-bold text-center text-gray-800 uppercase tracking-wider mb-6">
          Farmacia Surtimientos
        </h1>

        {/* Input para el código de barras */}
        <div className="mb-4">
          <label
            htmlFor="barcode"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Código de Barras
          </label>
          <input
            id="barcode"
            type="text"
            placeholder="Escanea el código de barras"
            className="
              w-full
              px-4
              py-3
              border
              border-gray-300
              rounded-lg
              focus:outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-500
              transition
            "
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
          />
        </div>

        {/* Botón de Buscar */}
        <button
          onClick={handleSearch}
          className="
            w-full
            py-3
            bg-blue-600
            text-white
            font-semibold
            rounded-lg
            shadow-lg
            hover:bg-blue-700
            transition
            mb-4
            flex
            items-center
            justify-center
            gap-2
          "
        >
          <FaSearch />
          <span>Buscar</span>
        </button>

        {/* Estado de carga */}
        {loading && (
          <div className="flex flex-col items-center my-6 text-gray-600">
            {/* Spinner */}
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-8 w-8 mb-4 animate-spin border-t-blue-600"></div>
            <p className="text-center">Cargando...</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            <FaExclamationCircle className="text-red-600" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Si hay datos, mostrar la tabla */}
        {data ? (
          <div className="mt-6 overflow-auto">
            <SurtimientosTable data={data} resetSurtimiento={limpiarPantalla} />
          </div>
        ) : (
          // Si NO hay datos, muestra un contenido decorativo
          !loading &&
          !error && (
            <div className="flex flex-col items-center text-gray-500 mt-10">
              <p className="text-center text-lg">
                Escanea un{" "}
                <span className="font-semibold">Código de Barras</span> para
                comenzar.
              </p>
            </div>
          )
        )}
      </div>

      {/* Spinner CSS con Tailwind */}
      <style jsx>{`
        .loader {
          border-color: #f3f3f3;
          border-top-color: #3498db;
        }
      `}</style>
    </div>
  );
};

export default FarmaciaSurtimientos;
