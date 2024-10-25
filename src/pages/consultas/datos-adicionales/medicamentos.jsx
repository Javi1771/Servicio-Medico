import React, { useState } from "react";

const Medicamentos = () => {
  const [medicamentos, setMedicamentos] = useState([{ medicamento: "", indicaciones: "", tratamiento: "" }]);
  const [mostrarNuevoMedicamento, setMostrarNuevoMedicamento] = useState(false);
  const [nuevoMedicamento, setNuevoMedicamento] = useState({ nombre: "", tipo: "" });
  const [historialMedicamentos, setHistorialMedicamentos] = useState([
    {
      fecha: "2024-10-01",
      medicamento: "Ibuprofeno",
      indicaciones: "Cada 8 horas",
      tratamiento: "5 días",
      diagnostico: "Dolor de cabeza",
    },
  ]);

  const tiposDeMedicamento = ["Controlado", "Especialidad", "Genérico", "Patente"];
  const listaMedicamentos = ["Ibuprofeno", "Paracetamol", "Amoxicilina"];

  const handleMedicamentoChange = (index, field, value) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index][field] = value;
    setMedicamentos(nuevosMedicamentos);
  };

  const agregarMedicamento = () => setMedicamentos([...medicamentos, { medicamento: "", indicaciones: "", tratamiento: "" }]);
  const quitarMedicamento = (index) => setMedicamentos(medicamentos.filter((_, i) => i !== index));

  const handleNuevoMedicamentoChange = (field, value) => setNuevoMedicamento({ ...nuevoMedicamento, [field]: value });

  const guardarNuevoMedicamento = () => {
    if (nuevoMedicamento.nombre && nuevoMedicamento.tipo) {
      listaMedicamentos.push(nuevoMedicamento.nombre);
      setMostrarNuevoMedicamento(false);
      setNuevoMedicamento({ nombre: "", tipo: "" });
    } else {
      alert("Por favor, completa todos los campos.");
    }
  };

  const guardarMedicamentoEnHistorial = () => {
    const fechaActual = new Date().toLocaleDateString();
    medicamentos.forEach((medicamento) => {
      if (medicamento.medicamento && medicamento.indicaciones && medicamento.tratamiento) {
        const nuevoMedicamento = {
          fecha: fechaActual,
          ...medicamento,
          diagnostico: "General",
        };
        setHistorialMedicamentos((prevHistorial) => [...prevHistorial, nuevoMedicamento]);
      }
    });
    setMedicamentos([{ medicamento: "", indicaciones: "", tratamiento: "" }]);
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Prescripción de Medicamentos</h3>

      {medicamentos.map((medicamento, index) => (
        <div key={index} className="mb-4 md:mb-6 bg-gray-700 p-4 rounded-lg shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white font-semibold">Medicamento:</label>
              <select
                value={medicamento.medicamento}
                onChange={(e) => handleMedicamentoChange(index, "medicamento", e.target.value)}
                className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mt-2"
              >
                <option value="">Seleccionar Medicamento</option>
                {listaMedicamentos.map((med, i) => (
                  <option key={i} value={med}>
                    {med}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-white font-semibold">Indicaciones:</label>
              <textarea
                value={medicamento.indicaciones}
                onChange={(e) => handleMedicamentoChange(index, "indicaciones", e.target.value)}
                className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mt-2"
                placeholder="Escribe las indicaciones"
              />
            </div>

            <div>
              <label className="text-white font-semibold">Tratamiento:</label>
              <textarea
                value={medicamento.tratamiento}
                onChange={(e) => handleMedicamentoChange(index, "tratamiento", e.target.value)}
                className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mt-2"
                placeholder="Escribe el tratamiento"
              />
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={agregarMedicamento}
              className="bg-green-600 text-white px-4 py-2 rounded-md shadow hover:bg-green-500"
            >
              Agregar
            </button>
            {medicamentos.length > 1 && (
              <button
                onClick={() => quitarMedicamento(index)}
                className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-500"
              >
                Quitar
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="text-right">
        <button
          onClick={() => setMostrarNuevoMedicamento(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md mt-4 shadow hover:bg-blue-500"
        >
          Agregar Un Nuevo Medicamento No Existente
        </button>
      </div>

      <div className="text-right mt-6">
        <button
          onClick={guardarMedicamentoEnHistorial}
          className="bg-purple-600 text-white px-4 py-2 rounded-md shadow hover:bg-purple-500"
        >
          Guardar Medicamento en Historial
        </button>
      </div>

      {mostrarNuevoMedicamento && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Nuevo Medicamento</h3>
            <label className="text-white font-semibold">Nombre:</label>
            <input
              type="text"
              value={nuevoMedicamento.nombre}
              onChange={(e) => handleNuevoMedicamentoChange("nombre", e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mb-4"
              placeholder="Nombre del medicamento"
            />
            <label className="text-white font-semibold">Tipo:</label>
            <select
              value={nuevoMedicamento.tipo}
              onChange={(e) => handleNuevoMedicamentoChange("tipo", e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mb-4"
            >
              <option value="">Seleccionar tipo</option>
              {tiposDeMedicamento.map((tipo, index) => (
                <option key={index} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <div className="flex justify-between mt-4">
              <button
                onClick={guardarNuevoMedicamento}
                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-400"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarNuevoMedicamento(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {historialMedicamentos.length > 0 && (
        <div className="bg-gray-700 p-4 md:p-6 rounded-lg shadow-lg mt-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Historial de Medicamentos Otorgados</h3>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
            <table className="min-w-full bg-gray-800 rounded-lg shadow-lg text-left table-auto">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="p-2 md:p-3">Fecha de Otorgamiento</th>
                  <th className="p-2 md:p-3">Medicamento</th>
                  <th className="p-2 md:p-3">Indicaciones de Uso</th>
                  <th className="p-2 md:p-3">Tratamiento</th>
                  <th className="p-2 md:p-3">Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {historialMedicamentos.map((med, index) => (
                  <tr key={index} className="hover:bg-gray-600 transition-colors duration-300">
                    <td className="py-2 md:py-3 px-2 md:px-4 whitespace-normal">{med.fecha}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 whitespace-normal">{med.medicamento}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 whitespace-normal">{med.indicaciones}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 whitespace-normal">{med.tratamiento}</td>
                    <td className="py-2 md:py-3 px-2 md:px-4 whitespace-normal">{med.diagnostico}</td>
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

export default Medicamentos;
