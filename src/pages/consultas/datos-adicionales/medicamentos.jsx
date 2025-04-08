/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { FormularioContext } from "/src/context/FormularioContext";
import MedicamentoDropdown from "../components/MedicamentoDropdown";
import HistorialMedicamentos from "../components/HistorialMedicamentos";
import Swal from "sweetalert2";

const Medicamentos = ({ clavenomina, clavepaciente, claveConsulta }) => {
  const [medicamentos, setMedicamentos] = useState([]);
  const [listaMedicamentos, setListaMedicamentos] = useState([]);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true);
  const [decisionTomada, setDecisionTomada] = useState("no");

  const { updateFormulario } = useContext(FormularioContext);

  //* Sonidos
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  //* Cargar lista de medicamentos (endpoint)
  useEffect(() => {
    setLoadingMedicamentos(true);
    fetch("/api/medicamentos/listar")
      .then((res) => res.json())
      .then((data) => {
        setListaMedicamentos(data);
        setLoadingMedicamentos(false);
      })
      .catch((err) => {
        console.error("Error al cargar medicamentos:", err);
        setLoadingMedicamentos(false);
      });
  }, []);

  //* Recuperar decisión y medicamentos del localStorage
  useEffect(() => {
    const savedDecision = localStorage.getItem("decisionTomada");
    const savedMedicamentos =
      JSON.parse(localStorage.getItem("medicamentos")) || [];
    if (savedDecision) setDecisionTomada(savedDecision);
    if (savedMedicamentos.length > 0) setMedicamentos(savedMedicamentos);
  }, []);

  //* Guardar medicamentos en localStorage si la decisión es "si"
  useEffect(() => {
    if (decisionTomada === "si") {
      localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
    }
  }, [medicamentos, decisionTomada]);

  //* Verificar si todos los campos están completos
  useEffect(() => {
    const camposCompletos =
      decisionTomada === "no" ||
      (decisionTomada === "si" &&
        medicamentos.every(
          (med) =>
            med.medicamento && med.indicaciones && med.tratamiento && med.piezas
        ));
    updateFormulario("Medicamentos", camposCompletos);
  }, [medicamentos, decisionTomada, updateFormulario]);

  //* Guardar la decisión en localStorage
  useEffect(() => {
    localStorage.setItem("decisionTomada", decisionTomada);
  }, [decisionTomada]);

  //* Manejar el cambio de decisión (Sí/No)
  const handleDecision = (decision) => {
    setDecisionTomada(decision);
    if (decision === "no") {
      setMedicamentos([]);
      localStorage.removeItem("medicamentos");
    } else {
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

  //* Manejar cambio en la selección o texto de cada medicamento
  const handleMedicamentoChange = (index, field, value) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index][field] = value;
    setMedicamentos(nuevosMedicamentos);
  };

  //* Agregar un nuevo objeto medicamento
  const agregarMedicamento = () =>
    setMedicamentos([
      ...medicamentos,
      { medicamento: "", indicaciones: "", tratamiento: "", piezas: "" },
    ]);

  //! Quitar un medicamento del array
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
                <MedicamentoDropdown
                  listaMedicamentos={listaMedicamentos}
                  value={med.medicamento}
                  playSound={playSound}
                  onChangeMedicamento={(claveMed) =>
                    handleMedicamentoChange(index, "medicamento", claveMed)
                  }
                  isLoading={loadingMedicamentos}
                />
              </div>

              {/* Indicaciones */}
              <div>
                <label className="text-lg font-semibold text-gray-200 uppercase">
                  INDICACIONES:
                </label>
                <textarea
                  value={med.indicaciones}
                  onChange={(e) =>
                    handleMedicamentoChange(
                      index,
                      "indicaciones",
                      e.target.value.slice(0, 60).toUpperCase()
                    )
                  }
                  maxLength={60}
                  className="mt-2 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3 uppercase"
                  placeholder="ESCRIBE AQUÍ LAS INDICACIONES..."
                />
                <p className="text-sm text-gray-400 mt-1 uppercase">
                  {med.indicaciones.length}/60 CARACTERES
                </p>
              </div>

              {/* Tratamiento */}
              <div>
                <label className="text-lg font-semibold text-gray-200 uppercase">
                  TRATAMIENTO:
                </label>
                <textarea
                  value={med.tratamiento}
                  onChange={(e) =>
                    handleMedicamentoChange(
                      index,
                      "tratamiento",
                      e.target.value.slice(0, 30).toUpperCase()
                    )
                  }
                  maxLength={30}
                  className="mt-2 block w-full h-32 md:h-40 rounded-lg bg-gray-700 border-gray-600 text-white p-3 uppercase"
                  placeholder="ESCRIBE AQUÍ EL TRATAMIENTO..."
                />
                <p className="text-sm text-gray-400 mt-1 uppercase">
                  {med.tratamiento.length}/30 CARACTERES
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

      {/* Componente separado para el Historial */}
      <HistorialMedicamentos
        clavenomina={clavenomina}
        clavepaciente={clavepaciente}
      />
    </div>
  );
};

export default Medicamentos;
