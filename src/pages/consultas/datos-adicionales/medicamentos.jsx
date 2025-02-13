/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { FormularioContext } from "/src/context/FormularioContext";

const Medicamentos = ({ clavenomina, clavepaciente, claveConsulta }) => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [listaMedicamentos, setListaMedicamentos] = useState([]);
  const [historialMedicamentos, setHistorialMedicamentos] = useState([]);
  const [decisionTomada, setDecisionTomada] = useState("no");

  const { updateFormulario } = useContext(FormularioContext);

  //? 1) Cargar lista de medicamentos desde el backend
  useEffect(() => {
    fetch("/api/medicamentos/listar")
      .then((res) => res.json())
      .then((data) => setListaMedicamentos(data))
      .catch((err) => console.error("Error al cargar medicamentos:", err));
  }, []);

  //? 2) Cargar historial de medicamentos desde el backend
  useEffect(() => {
    if (clavenomina && clavepaciente) {
      const url = `/api/medicamentos/historial?${new URLSearchParams({
        clavepaciente,
        clavenomina,
      }).toString()}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          console.log("Historial de medicamentos recibido:", data);
          if (data.ok) {
            setHistorialMedicamentos(data.historial || []);
          } else {
            console.error("Error al cargar el historial:", data.error);
            setHistorialMedicamentos([]);
          }
        })
        .catch((err) => console.error("Error al cargar historial:", err));
    }
  }, [clavenomina, clavepaciente]);

  //? 3) Verificar si todos los campos están completos
  useEffect(() => {
    const camposCompletos =
      decisionTomada === "no" ||
      (decisionTomada === "si" &&
        medicamentos.every(
          (med) =>
            med.medicamento && med.indicaciones && med.tratamiento && med.piezas //* Se exige que se ingrese también la cantidad de piezas
        ));
    updateFormulario("Medicamentos", camposCompletos);
  }, [medicamentos, decisionTomada, updateFormulario]);

  //? 4) Guardar medicamentos en localStorage si la decisión es "si"
  useEffect(() => {
    if (decisionTomada === "si") {
      localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
    }
  }, [medicamentos, decisionTomada]);

  //? 5) Manejo del cambio de decisión (Sí/No)
  const handleDecision = (decision) => {
    console.log(`🛠️ Decisión tomada: ${decision}`);
    setDecisionTomada(decision);
    if (decision === "no") {
      console.log("🧹 Limpiando medicamentos porque la decisión es 'No'");
      setMedicamentos([]);
      localStorage.removeItem("medicamentos");
    } else {
      console.log(
        "➕ Agregando un medicamento inicial porque la decisión es 'Sí'"
      );
      const savedMedicamentos =
        JSON.parse(localStorage.getItem("medicamentos")) || [];
      setMedicamentos(
        savedMedicamentos.length > 0
          ? savedMedicamentos
          : [{ medicamento: "", indicaciones: "", tratamiento: "", piezas: "" }]
      );
    }
    localStorage.setItem("decisionTomada", decision);
  };

  //? 6) Al montar, recuperar decisión, medicamentos e historial del localStorage (si hay)
  useEffect(() => {
    const savedDecision = localStorage.getItem("decisionTomada");
    const savedMedicamentos =
      JSON.parse(localStorage.getItem("medicamentos")) || [];
    const savedHistorial =
      JSON.parse(localStorage.getItem("historialMedicamentos")) || [];
    if (savedDecision) setDecisionTomada(savedDecision);
    if (savedMedicamentos.length > 0) setMedicamentos(savedMedicamentos);
    if (savedHistorial.length > 0) setHistorialMedicamentos(savedHistorial);
  }, []);

  //? 7) Guardar el historial de medicamentos en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem(
      "historialMedicamentos",
      JSON.stringify(historialMedicamentos)
    );
  }, [historialMedicamentos]);

  //? 8) Manejar cambio en la selección o texto de cada medicamento
  const handleMedicamentoChange = (index, field, value) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index][field] = value;
    setMedicamentos(nuevosMedicamentos);
  };

  //? 9) Guardar la decisión en localStorage
  useEffect(() => {
    localStorage.setItem("decisionTomada", decisionTomada);
  }, [decisionTomada]);

  //? 10) Agregar un nuevo objeto medicamento
  const agregarMedicamento = () =>
    setMedicamentos([
      ...medicamentos,
      { medicamento: "", indicaciones: "", tratamiento: "", piezas: "" },
    ]);

  //? 11) Quitar un medicamento del array
  const quitarMedicamento = (index) =>
    setMedicamentos(medicamentos.filter((_, i) => i !== index));

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Prescripción de Medicamentos
      </h3>

      {/* Pregunta inicial (Sí/No) */}
      <div className="mb-6">
        <p className="text-white font-semibold mb-2">
          ¿Se darán medicamentos en esta consulta?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className={`px-4 py-2 rounded-md ${
              decisionTomada === "si" ? "bg-green-600" : "bg-gray-600"
            } text-white`}
            onClick={() => handleDecision("si")}
          >
            Sí
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              decisionTomada === "no" ? "bg-red-600" : "bg-gray-600"
            } text-white`}
            onClick={() => handleDecision("no")}
          >
            No
          </button>
        </div>
      </div>

      {/* Formulario para medicamentos si la respuesta es "sí" */}
      {decisionTomada === "si" &&
        medicamentos.map((med, index) => (
          <div
            key={index}
            className="mb-6 bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-lg shadow-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Selección de Medicamento */}
              <div>
                <label className="text-lg font-semibold text-gray-200">
                  Medicamento:
                </label>
                <select
                  value={med.medicamento}
                  onChange={(e) =>
                    handleMedicamentoChange(
                      index,
                      "medicamento",
                      e.target.value
                    )
                  }
                  className="mt-2 block w-full h-12 rounded-lg bg-gray-700 border-gray-600 text-white p-3 focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">Seleccionar Medicamento</option>
                  {listaMedicamentos.map((m) => (
                    <option key={m.CLAVEMEDICAMENTO} value={m.CLAVEMEDICAMENTO}>
                      {m.MEDICAMENTO}
                    </option>
                  ))}
                </select>
              </div>
              {/* Indicaciones */}
              <div>
                <label className="text-lg font-semibold text-gray-200">
                  Indicaciones:
                </label>
                <textarea
                  value={med.indicaciones}
                  onChange={(e) =>
                    handleMedicamentoChange(
                      index,
                      "indicaciones",
                      e.target.value.slice(0, 60)
                    )
                  }
                  maxLength={60}
                  className="mt-2 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
                  placeholder="Escribe aquí las indicaciones..."
                />
                <p className="text-sm text-gray-400 mt-1">
                  {med.indicaciones.length}/60 caracteres
                </p>
              </div>

              {/* Tratamiento */}
              <div>
                <label className="text-lg font-semibold text-gray-200">
                  Tratamiento:
                </label>
                <textarea
                  value={med.tratamiento}
                  onChange={(e) =>
                    handleMedicamentoChange(
                      index,
                      "tratamiento",
                      e.target.value.slice(0, 30)
                    )
                  }
                  maxLength={30}
                  className="mt-2 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3"
                  placeholder="Escribe aquí el tratamiento..."
                />
                <p className="text-sm text-gray-400 mt-1">
                  {med.tratamiento.length}/30 caracteres
                </p>
              </div>

              {/* Campo Piezas */}
              <div>
                <label className="text-lg font-semibold text-gray-200">
                  Piezas:
                </label>
                <input
                  type="number"
                  value={med.piezas}
                  onChange={(e) =>
                    handleMedicamentoChange(index, "piezas", e.target.value)
                  }
                  className="mt-2 block w-full h-12 rounded-lg bg-gray-700 border-gray-600 text-white p-3 focus:ring-2 focus:ring-purple-600"
                  placeholder="Cantidad"
                />
              </div>
            </div>
            {/* Botón para quitar este medicamento (si hay más de uno) */}
            {medicamentos.length > 1 && (
              <div className="text-right">
                <button
                  onClick={() => quitarMedicamento(index)}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg shadow hover:bg-red-500"
                >
                  Quitar Medicamento
                </button>
              </div>
            )}
          </div>
        ))}

      {/* Botón para agregar medicamento si la respuesta es "sí" */}
      {decisionTomada === "si" && (
        <div className="text-right">
          <button
            onClick={agregarMedicamento}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
          >
            + Agregar Medicamento
          </button>
        </div>
      )}

      {/* Historial de Medicamentos */}
      <div className="bg-gray-900 p-8 rounded-xl shadow-2xl mt-10">
        <h3 className="text-3xl font-semibold text-center text-purple-400 mb-6">
          Historial de Medicamentos
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="py-4 px-6 text-base font-semibold">
                  Medicamento
                </th>
                <th className="py-4 px-6 text-base font-semibold">
                  Indicaciones
                </th>
                <th className="py-4 px-6 text-base font-semibold">
                  Tratamiento
                </th>
                <th className="py-4 px-6 text-base font-semibold">Piezas</th>
                <th className="py-4 px-6 text-base font-semibold">Proveedor</th>
                <th className="py-4 px-6 text-base font-semibold">
                  Especialidad
                </th>
                <th className="py-4 px-6 text-base font-semibold">
                  Fecha Emisión
                </th>
              </tr>
            </thead>
            <tbody>
              {historialMedicamentos.length > 0 ? (
                historialMedicamentos.map((item, i) => (
                  <tr
                    key={i}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                  >
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.medicamento}
                    </td>
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.indicaciones}
                    </td>
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.tratamiento}
                    </td>
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.piezas || ""}
                    </td>
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.nombreproveedor || ""}
                    </td>
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.especialidad || ""}
                    </td>
                    <td className="py-4 px-6 border-t border-gray-800 text-gray-300">
                      {item.fechaEmision}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-6 text-center text-gray-400 border-t border-gray-800"
                  >
                    No hay medicamentos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Medicamentos;
