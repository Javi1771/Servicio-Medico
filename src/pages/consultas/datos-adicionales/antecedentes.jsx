import React, { useState, useEffect } from "react";

const Antecedentes = ({ clavenomina, nombrePaciente }) => {
  const [descripcion, setDescripcion] = useState("");
  const [tipoAntecedente, setTipoAntecedente] = useState("");
  const [fechaInicioEnfermedad, setFechaInicioEnfermedad] = useState("");
  const [antecedentes, setAntecedentes] = useState([]);

  // Cargar antecedentes desde la API
  useEffect(() => {
    const fetchAntecedentes = async () => {
      try {
        const response = await fetch(
          `/api/obtenerAntecedentes?clavenomina=${clavenomina}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Datos obtenidos de la API:", data);
          setAntecedentes(data);
        } else {
          console.error("Error al obtener antecedentes:", await response.text());
          setAntecedentes([]);
        }
      } catch (error) {
        console.error("Error al cargar los antecedentes:", error);
      }
    };

    fetchAntecedentes();
  }, [clavenomina]);

  // Guardar un nuevo antecedente
  const handleGuardarAntecedente = async () => {
    if (!descripcion || !tipoAntecedente || !fechaInicioEnfermedad) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      const response = await fetch("/api/guardarAntecedente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion,
          clavenomina,
          nombrePaciente,
          tipoAntecedente,
          fechaInicioEnfermedad,
        }),
      });

      if (response.ok) {
        const newAntecedente = await response.json();
        console.log("Nuevo antecedente guardado:", newAntecedente);
        alert("Antecedente guardado correctamente.");
        setAntecedentes([...antecedentes, newAntecedente]);
        setDescripcion("");
        setTipoAntecedente("");
        setFechaInicioEnfermedad("");
      } else {
        console.error("Error al guardar el antecedente:", await response.text());
        alert("Error al guardar el antecedente.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error en la solicitud.");
    }
  };

  const renderTable = (title, filterType) => {
    const filteredAntecedentes = antecedentes.filter(
      (ant) =>
        ant.tipo_antecedente?.trim().toLowerCase() ===
        filterType.trim().toLowerCase()
    );

    return (
      <div className="bg-gray-900 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-purple-400">
          {title}
        </h2>
        <div className="overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-2 md:p-3 text-sm md:text-base font-semibold">
                  Fecha de Registro
                </th>
                <th className="p-2 md:p-3 text-sm md:text-base font-semibold">
                  Fecha de Inicio
                </th>
                <th className="p-2 md:p-3 text-sm md:text-base font-semibold">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAntecedentes.length > 0 ? (
                filteredAntecedentes.map((ant, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                  >
                    <td className="py-2 px-3 border-t border-gray-800 text-gray-300">
                      {new Date(ant.fecha_registro).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 border-t border-gray-800 text-gray-300">
                      {new Date(
                        ant.fecha_inicio_enfermedad
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 border-t border-gray-800 text-gray-300">
                      {ant.descripcion}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-3 text-gray-400"
                  >
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-6">Antecedentes</h1>

      {/* Sección de tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {renderTable("Antecedentes Clínicos", "Clínico")}
        {renderTable("Antecedentes Quirúrgicos", "Quirúrgico")}
        {renderTable("Antecedentes Psiquiátricos", "Psiquiátrico")}
        {renderTable("Traumatismos", "Traumatismo")}
      </div>

      {/* Formulario general para añadir antecedentes */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Añadir Antecedente</h2>
        <div className="mb-4">
        </div>
        <label className="block mb-4">
          <span className="text-lg font-semibold">Tipo de Antecedente:</span>
          <select
            value={tipoAntecedente}
            onChange={(e) => setTipoAntecedente(e.target.value)}
            className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Clínico">Clínico</option>
            <option value="Quirúrgico">Quirúrgico</option>
            <option value="Psiquiátrico">Psiquiátrico</option>
            <option value="Traumatismo">Traumatismo</option>
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
        <label className="block mb-4">
          <span className="text-lg font-semibold">Fecha Inicio de Tratamiento:</span>
          <input
            type="date"
            value={fechaInicioEnfermedad}
            onChange={(e) => setFechaInicioEnfermedad(e.target.value)}
            className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
          />
        </label>
        <div className="text-right">
          <button
            onClick={handleGuardarAntecedente}
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
