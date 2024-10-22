import React, { useState } from "react";

const PaseEspecialidad = () => {
  // Estado para controlar si se debe pasar a especialidad
  const [pasarEspecialidad, setPasarEspecialidad] = useState(null);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Estado para el historial de especialidades
  const [historialEspecialidades, setHistorialEspecialidades] = useState([]);

  // Lista de especialidades
  const especialidades = [
    "Cardiología",
    "Neurología",
    "Dermatología",
    "Oftalmología",
    "Ortopedia",
    "Pediatría",
  ];

  // Manejar el pase a especialidad
  const handlePaseEspecialidadChange = (value) => {
    setPasarEspecialidad(value);
    if (value === "no") {
      setEspecialidadSeleccionada("");
      setObservaciones("");
    }
  };

  // Manejar el guardado de la especialidad
  const guardarEspecialidad = () => {
    if (especialidadSeleccionada && observaciones) {
      const nuevaEspecialidad = {
        fecha: new Date().toLocaleDateString(),
        especialidad: especialidadSeleccionada,
        observaciones: observaciones,
      };

      setHistorialEspecialidades([...historialEspecialidades, nuevaEspecialidad]);
      setEspecialidadSeleccionada("");
      setObservaciones("");
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
      <h3 className="text-3xl font-bold mb-6 text-white">Pase a Especialidad</h3>

      {/* Botón para seleccionar si pasa a especialidad */}
      <div className="mb-6">
        <p className="text-white font-semibold mb-2">¿Debe pasar a alguna especialidad?</p>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md ${pasarEspecialidad === "si" ? "bg-green-600" : "bg-gray-600"} text-white`}
            onClick={() => handlePaseEspecialidadChange("si")}
          >
            Sí
          </button>
          <button
            className={`px-4 py-2 rounded-md ${pasarEspecialidad === "no" ? "bg-red-600" : "bg-gray-600"} text-white`}
            onClick={() => handlePaseEspecialidadChange("no")}
          >
            No
          </button>
        </div>
      </div>

      {/* Mostrar opciones si se selecciona "Sí" */}
      {pasarEspecialidad === "si" && (
        <>
          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">Especialidad:</label>
            <select
              value={especialidadSeleccionada}
              onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-3"
            >
              <option value="">Seleccionar Especialidad</option>
              {especialidades.map((especialidad, index) => (
                <option key={index} value={especialidad}>
                  {especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">Observaciones:</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-3"
              placeholder="Escribe aquí las observaciones..."
            />
          </div>

          <button
            onClick={guardarEspecialidad}
            className="bg-blue-600 text-white px-4 py-2 rounded-md mt-4 hover:bg-blue-500"
          >
            Guardar Pase a Especialidad
          </button>
        </>
      )}

      {/* Tabla de historial de especialidades */}
      {historialEspecialidades.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-white">Historial de Especialidades</h3>
          <table className="min-w-full bg-gray-700 rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Especialidad</th>
                <th className="p-3 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {historialEspecialidades.map((item, index) => (
                <tr key={index} className="border-b border-gray-600">
                  <td className="p-3">{item.fecha}</td>
                  <td className="p-3">{item.especialidad}</td>
                  <td className="p-3">{item.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaseEspecialidad;
