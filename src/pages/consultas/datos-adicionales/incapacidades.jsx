import React, { useState } from "react";

const Incapacidades = () => {
  const [autorizarIncapacidad, setAutorizarIncapacidad] = useState(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [historialIncapacidades, setHistorialIncapacidades] = useState([]);

  const handleAutorizarChange = (value) => {
    setAutorizarIncapacidad(value);
    if (value === "no") {
      setFechaInicio("");
      setFechaFin("");
      setDiagnostico("");
    }
  };

  const guardarIncapacidad = () => {
    if (fechaInicio && fechaFin && diagnostico) {
      const nuevaIncapacidad = {
        fechaSolicitud: new Date().toLocaleDateString(),
        diagnostico: diagnostico,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
      };

      setHistorialIncapacidades([...historialIncapacidades, nuevaIncapacidad]);
      setFechaInicio("");
      setFechaFin("");
      setDiagnostico("");
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Incapacidades
      </h3>

      {/* Botón para seleccionar si se autoriza la incapacidad */}
      <div className="mb-6">
        <p className="text-white font-semibold mb-2">
          ¿Autorizar incapacidad?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className={`px-4 py-2 rounded-md ${autorizarIncapacidad === "si" ? "bg-green-600" : "bg-gray-600"
              } text-white`}
            onClick={() => handleAutorizarChange("si")}
          >
            Sí
          </button>
          <button
            className={`px-4 py-2 rounded-md ${autorizarIncapacidad === "no" ? "bg-red-600" : "bg-gray-600"
              } text-white`}
            onClick={() => handleAutorizarChange("no")}
          >
            No
          </button>
        </div>
      </div>

      {/* Mostrar opciones si se selecciona "Sí" */}
      {autorizarIncapacidad === "si" && (
        <>
          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Fecha Inicial:
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
            />
          </div>

          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Fecha Final:
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
            />
          </div>

          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Diagnóstico:
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
              placeholder="Escribe aquí el diagnóstico..."
            />
          </div>

          <button
            onClick={guardarIncapacidad}
            className="bg-blue-600 text-white px-4 py-2 rounded-md mt-4 hover:bg-blue-500"
          >
            Guardar Incapacidad
          </button>
        </>
      )}

      {/* Tabla de historial de incapacidades */}
      {historialIncapacidades.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">
            Historial de Incapacidades
          </h3>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="p-2 md:p-3 text-left">Fecha de Solicitud</th>
                  <th className="p-2 md:p-3 text-left">Diagnóstico</th>
                  <th className="p-2 md:p-3 text-left">Fecha de Inicio</th>
                  <th className="p-2 md:p-3 text-left">Fecha de Fin</th>
                </tr>
              </thead>
              <tbody>
                {historialIncapacidades.map((item, index) => (
                  <tr key={index} className="border-b border-gray-600">
                    <td className="p-2 md:p-3">{item.fechaSolicitud}</td>
                    <td className="p-2 md:p-3">{item.diagnostico}</td>
                    <td className="p-2 md:p-3">{item.fechaInicio}</td>
                    <td className="p-2 md:p-3">{item.fechaFin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incapacidades;
