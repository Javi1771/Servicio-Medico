/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Image from "next/image";

const EnfermedadesCronicas = () => {
  const [enfermedad, setEnfermedad] = useState("");
  const [catalogoEnfermedades] = useState(["Diabetes", "Hipertensión", "Asma"]);
  const [padecimientos, setPadecimientos] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [mostrarKPIs, setMostrarKPIs] = useState(false);
  const [kpis, setKPIs] = useState([]);
  const [nuevoKPI, setNuevoKPI] = useState({
    kpi: "",
    valorActual: "",
    valorObjetivo: "",
  });
  const [historialKPI, setHistorialKPI] = useState([]);
  const [verDetalleKPI, setVerDetalleKPI] = useState(false);
  const [detalleKPI, setDetalleKPI] = useState(null);

  const handleAgregarEnfermedad = () => {
    if (!enfermedad) {
      alert("Por favor, selecciona o escribe una enfermedad.");
      return;
    }
    setMostrarMotivo(true);
  };

  const handleGuardarMotivo = () => {
    if (!motivo) {
      alert("Por favor, especifica un motivo.");
      return;
    }
    setPadecimientos([
      ...padecimientos,
      { fecha: new Date().toLocaleDateString(), enfermedad, observaciones: motivo },
    ]);
    setMostrarMotivo(false);
    setMotivo("");
  };

  const handleCancelarMotivo = () => {
    setMostrarMotivo(false);
    setMotivo("");
  };

  const handleAñadirKPI = () => {
    setMostrarKPIs(true);
  };

  const handleGuardarKPI = () => {
    if (!nuevoKPI.kpi || !nuevoKPI.valorActual || !nuevoKPI.valorObjetivo) {
      alert("Por favor, completa todos los campos de KPI.");
      return;
    }
    setHistorialKPI([
      ...historialKPI,
      { fecha: new Date().toLocaleDateString(), ...nuevoKPI },
    ]);
    setMostrarKPIs(false);
    setNuevoKPI({ kpi: "", valorActual: "", valorObjetivo: "" });
  };

  const handleVerKPI = (kpi) => {
    setDetalleKPI(kpi);
    setVerDetalleKPI(true);
  };

  const handleCalificar = () => {
    setVerDetalleKPI(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 md:p-8">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl md:text-4xl font-extrabold mr-4">
          Enfermedades Crónicas
        </h1>
      </div>

      {/* Apartado de Enfermedad */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">Enfermedad:</span>
          <select
            value={enfermedad}
            onChange={(e) => setEnfermedad(e.target.value)}
            className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
          >
            <option value="">Selecciona una enfermedad...</option>
            {catalogoEnfermedades.map((enf, idx) => (
              <option key={idx} value={enf}>
                {enf}
              </option>
            ))}
          </select>
        </label>
        <div className="text-right">
          <button
            onClick={handleAgregarEnfermedad}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition duration-200"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Padecimientos Actuales */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
          Padecimientos Actuales
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="p-2 md:p-3">Fecha Registro</th>
                <th className="p-2 md:p-3">Enfermedad</th>
                <th className="p-2 md:p-3">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {padecimientos.map((padecimiento, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-600 transition-colors duration-300"
                >
                  <td className="py-2 md:py-3 px-2 md:px-4">{padecimiento.fecha}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{padecimiento.enfermedad}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    {padecimiento.observaciones}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPIs */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl md:text-3xl font-bold mb-4">Detalle</h2>
        <label className="block mb-4">
          <span className="text-lg md:text-xl font-semibold">KPIs:</span>
          <input
            type="text"
            className="mt-2 p-2 md:p-3 rounded-lg bg-gray-700 text-white w-full"
            placeholder="Escribe el KPI..."
          />
        </label>
        <div className="text-right">
          <button
            onClick={handleAñadirKPI}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition duration-200"
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Historial de KPIs */}
      <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl md:text-3xl font-bold mb-4">Historial de KPIs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg shadow-lg text-left">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="p-2 md:p-3">Fecha</th>
                <th className="p-2 md:p-3">KPI</th>
                <th className="p-2 md:p-3">Valor Actual</th>
                <th className="p-2 md:p-3">Valor Objetivo</th>
                <th className="p-2 md:p-3">Registró</th>
                <th className="p-2 md:p-3">Calificación</th>
                <th className="p-2 md:p-3">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {historialKPI.map((kpi, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                  onClick={() => handleVerKPI(kpi)}
                >
                  <td className="py-2 md:py-3 px-2 md:px-4">{kpi.fecha}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{kpi.kpi}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{kpi.valorActual}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">{kpi.valorObjetivo}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">Médico</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">8/10</td>
                  <td className="py-2 md:py-3 px-2 md:px-4">Sin observaciones</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventanas emergentes */}
      {mostrarMotivo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Especificar Motivo</h3>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white mb-4"
              placeholder="Escribe el motivo..."
            />
            <div className="flex justify-between">
              <button
                onClick={handleGuardarMotivo}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
              >
                Guardar
              </button>
              <button
                onClick={handleCancelarMotivo}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarKPIs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center mb-4">
              <h3 className="text-2xl md:text-3xl font-bold mr-2">Registro de KPIs</h3>
              <Image src="/corazon.png" alt="Corazón" width={50} height={50} />
            </div>
            <label className="block mb-4">
              <span className="text-lg font-semibold">KPI:</span>
              <select
                value={nuevoKPI.kpi}
                onChange={(e) => setNuevoKPI({ ...nuevoKPI, kpi: e.target.value })}
                className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
              >
                <option value="">Seleccionar KPI</option>
                {catalogoEnfermedades.map((enf, idx) => (
                  <option key={idx} value={enf}>
                    {enf}
                  </option>
                ))}
              </select>
            </label>
            <label className="block mb-4">
              <span className="text-lg font-semibold">Valor Actual:</span>
              <input
                type="text"
                value={nuevoKPI.valorActual}
                onChange={(e) => setNuevoKPI({ ...nuevoKPI, valorActual: e.target.value })}
                className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
              />
            </label>
            <label className="block mb-4">
              <span className="text-lg font-semibold">Valor Objetivo:</span>
              <input
                type="text"
                value={nuevoKPI.valorObjetivo}
                onChange={(e) => setNuevoKPI({ ...nuevoKPI, valorObjetivo: e.target.value })}
                className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
              />
            </label>
            <div className="flex justify-between">
              <button
                onClick={handleGuardarKPI}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarKPIs(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {verDetalleKPI && detalleKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center mb-4">
              <h3 className="text-2xl md:text-3xl font-bold mr-2">Registro de KPIs</h3>
              <Image src="/corazon.png" alt="Corazón" width={50} height={50} />
            </div>
            <p>
              <strong>KPI:</strong> {detalleKPI.kpi}
            </p>
            <p>
              <strong>Valor Actual:</strong> {detalleKPI.valorActual}
            </p>
            <p>
              <strong>Valor Objetivo:</strong> {detalleKPI.valorObjetivo}
            </p>
            <label className="block mt-4 mb-4">
              <span className="text-lg font-semibold">Calificación Valor Alcanzado:</span>
              <input
                type="text"
                className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full"
                placeholder="Escribe la calificación..."
              />
            </label>
            <label className="block mb-4">
              <span className="text-lg font-semibold">¿Se cumplió el objetivo?:</span>
              <select className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full">
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </label>
            <label className="block mb-4">
              <span className="text-lg font-semibold">Observaciones:</span>
              <textarea className="mt-2 p-3 rounded-lg bg-gray-700 text-white w-full" />
            </label>
            <div className="flex justify-between">
              <button
                onClick={handleCalificar}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500"
              >
                Calificar
              </button>
              <button
                onClick={() => setVerDetalleKPI(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnfermedadesCronicas;
