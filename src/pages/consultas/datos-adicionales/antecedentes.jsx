import React, { useState } from "react";

const Antecedentes = () => {
  const [antecedentesClinicos, setAntecedentesClinicos] = useState([]);
  const [antecedentesQuirurgicos, setAntecedentesQuirurgicos] = useState([]);
  const [antecedentesPsiquiatricos, setAntecedentesPsiquiatricos] = useState([]);
  const [traumatismos, setTraumatismos] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const handleGuardar = () => {
    if (!selectedTable || !descripcion) {
      alert("Por favor, selecciona una tabla y agrega una descripción.");
      return;
    }

    const newRecord = {
      descripcion,
      fecha: new Date().toLocaleDateString(),
    };

    switch (selectedTable) {
      case "Antecedentes Clínicos":
        setAntecedentesClinicos([...antecedentesClinicos, newRecord]);
        break;
      case "Antecedentes Quirúrgicos":
        setAntecedentesQuirurgicos([...antecedentesQuirurgicos, newRecord]);
        break;
      case "Antecedentes Psiquiátricos":
        setAntecedentesPsiquiatricos([...antecedentesPsiquiatricos, newRecord]);
        break;
      case "Traumatismos":
        setTraumatismos([...traumatismos, newRecord]);
        break;
      default:
        break;
    }

    // Limpiar los campos después de guardar
    setSelectedTable("");
    setDescripcion("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6">Antecedentes</h1>

      {/* Tablas de antecedentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Antecedentes Clínicos */}
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Antecedentes Clínicos</h2>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="p-2 md:p-3 text-left">Fecha</th>
                  <th className="p-2 md:p-3 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {antecedentesClinicos.map((antecedente, idx) => (
                  <tr key={idx} className="border-b border-gray-600 hover:bg-gray-600 transition-colors duration-300">
                    <td className="py-2 md:py-3 px-2 md:px-4">{antecedente.fecha}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4">{antecedente.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Antecedentes Quirúrgicos */}
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Antecedentes Quirúrgicos</h2>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="p-2 md:p-3 text-left">Fecha</th>
                  <th className="p-2 md:p-3 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {antecedentesQuirurgicos.map((antecedente, idx) => (
                  <tr key={idx} className="border-b border-gray-600 hover:bg-gray-600 transition-colors duration-300">
                    <td className="py-2 md:py-3 px-2 md:px-4">{antecedente.fecha}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4">{antecedente.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Antecedentes Psiquiátricos */}
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Antecedentes Psiquiátricos</h2>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="p-2 md:p-3 text-left">Fecha</th>
                  <th className="p-2 md:p-3 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {antecedentesPsiquiatricos.map((antecedente, idx) => (
                  <tr key={idx} className="border-b border-gray-600 hover:bg-gray-600 transition-colors duration-300">
                    <td className="py-2 md:py-3 px-2 md:px-4">{antecedente.fecha}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4">{antecedente.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traumatismos */}
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Traumatismos</h2>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="p-2 md:p-3 text-left">Fecha</th>
                  <th className="p-2 md:p-3 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {traumatismos.map((trauma, idx) => (
                  <tr key={idx} className="border-b border-gray-600 hover:bg-gray-600 transition-colors duration-300">
                    <td className="py-2 md:py-3 px-2 md:px-4">{trauma.fecha}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4">{trauma.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sección para añadir */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Añadir Antecedente</h2>
        <label className="block mb-4">
          <span className="text-lg font-semibold">Seleccionar tabla:</span>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Selecciona una tabla</option>
            <option value="Antecedentes Clínicos">Antecedentes Clínicos</option>
            <option value="Antecedentes Quirúrgicos">Antecedentes Quirúrgicos</option>
            <option value="Antecedentes Psiquiátricos">Antecedentes Psiquiátricos</option>
            <option value="Traumatismos">Traumatismos</option>
          </select>
        </label>
        <label className="block mb-4">
          <span className="text-lg font-semibold">Descripción:</span>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
            placeholder="Describe el antecedente..."
          />
        </label>
        <div className="text-right">
          <button
            onClick={handleGuardar}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition duration-200"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Antecedentes;
