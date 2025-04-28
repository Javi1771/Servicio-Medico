/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import { FormularioContext } from "/src/context/FormularioContext";
import MedicamentoDropdown from "../components/MedicamentoDropdown";
import HistorialMedicamentos from "../components/HistorialMedicamentos";
import TratamientoInput from "../components/TratamientoInput";
import Swal from "sweetalert2";
import { FiPackage, FiRefreshCw } from "react-icons/fi";
import { FaCalendarAlt } from "react-icons/fa";

const Medicamentos = ({ clavenomina, clavepaciente, claveConsulta }) => {
  // defaultMed incluye ahora tratamientoDias para controlar la lógica de resurtir
  const defaultMed = {
    medicamento: "",
    indicaciones: "",
    tratamiento: "",
    tratamientoDias: 30,    // ← Nuevo campo
    piezas: "",
    resurtir: "no",
    mesesResurtir: null,
  };

  const [medicamentos, setMedicamentos] = useState([]);
  const [listaMedicamentos, setListaMedicamentos] = useState([]);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true);
  const [decisionTomada, setDecisionTomada] = useState("no");
  const { updateFormulario } = useContext(FormularioContext);

  const phraseTemplates = ["Durante __ días.", "Por __ días.", "En __ días."];
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";
  const playSound = (ok) => new Audio(ok ? successSound : errorSound).play();

  useEffect(() => {
    setLoadingMedicamentos(true);
    fetch("/api/medicamentos/listar")
      .then((r) => r.json())
      .then((data) => {
        setListaMedicamentos(data);
        setLoadingMedicamentos(false);
      })
      .catch(() => setLoadingMedicamentos(false));
  }, []);

  useEffect(() => {
    const sd = localStorage.getItem("decisionTomada");
    const sm = JSON.parse(localStorage.getItem("medicamentos")) || [];
    if (sd) setDecisionTomada(sd);
    if (sm.length) setMedicamentos(sm);
  }, []);

  useEffect(() => {
    if (decisionTomada === "si")
      localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
  }, [medicamentos, decisionTomada]);

  useEffect(() => {
    const completos =
      decisionTomada === "no" ||
      (decisionTomada === "si" &&
        medicamentos.every(
          (m) =>
            m.medicamento &&
            m.indicaciones &&
            m.tratamiento &&
            m.tratamientoDias &&
            m.piezas &&
            (m.resurtir === "no" || (m.resurtir === "si" && m.mesesResurtir))
        ));
    updateFormulario("Medicamentos", completos);
  }, [medicamentos, decisionTomada, updateFormulario]);

  useEffect(() => {
    localStorage.setItem("decisionTomada", decisionTomada);
  }, [decisionTomada]);

  const handleDecision = (d) => {
    setDecisionTomada(d);
    if (d === "no") {
      setMedicamentos([]);
      localStorage.removeItem("medicamentos");
    } else {
      const saved = JSON.parse(localStorage.getItem("medicamentos")) || [];
      setMedicamentos(saved.length ? saved : [{ ...defaultMed }]);
    }
    localStorage.setItem("decisionTomada", d);
  };

  //* Cambia un campo de un medicamento y limpia resurtir si tratamientoDias < 30
  const handleMedicamentoChange = (i, field, val) => {
    setMedicamentos((prev) => {
      const tmp = [...prev];
      tmp[i][field] = val;

      //! Si cambian los días de tratamiento a menos de 30, resetear resurtir
      if (field === "tratamientoDias" && Number(val) < 30) {
        tmp[i].resurtir = "no";
        tmp[i].mesesResurtir = null;
      }

      return tmp;
    });
  };


  const agregarMedicamento = () =>
    setMedicamentos([...medicamentos, { ...defaultMed }]);
  const quitarMedicamento = (i) =>
    setMedicamentos(medicamentos.filter((_, idx) => idx !== i));

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
        Prescripción de Medicamentos
      </h3>

      {/* Pregunta inicial */}
      <div className="mb-8">
        <p className="text-white font-semibold mb-2">
          ¿Se darán medicamentos en esta consulta?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleDecision("si")}
            className={`px-4 py-2 rounded-md text-white ${
              decisionTomada === "si" ? "bg-green-600" : "bg-gray-600"
            }`}
          >
            Sí
          </button>
          <button
            onClick={() => handleDecision("no")}
            className={`px-4 py-2 rounded-md text-white ${
              decisionTomada === "no" ? "bg-red-600" : "bg-gray-600"
            }`}
          >
            No
          </button>
        </div>
      </div>

      {/* Formulario de Medicamentos */}
      {decisionTomada === "si" &&
        medicamentos.map((med, idx) => (
          <div
            key={idx}
            className="mb-6 bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-lg shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Medicamento */}
              <div>
                <label className="text-lg font-semibold text-gray-200">
                  Medicamento
                </label>
                <MedicamentoDropdown
                  listaMedicamentos={listaMedicamentos}
                  value={med.medicamento}
                  playSound={playSound}
                  onChangeMedicamento={(v) =>
                    handleMedicamentoChange(idx, "medicamento", v)
                  }
                  isLoading={loadingMedicamentos}
                />
              </div>

              {/* Indicaciones */}
              <div>
                <label className="text-lg font-semibold text-gray-200 uppercase">
                  Indicaciones
                </label>
                <textarea
                  value={med.indicaciones}
                  onChange={(e) =>
                    handleMedicamentoChange(
                      idx,
                      "indicaciones",
                      e.target.value.slice(0, 90).toUpperCase()
                    )
                  }
                  maxLength={90}
                  className="mt-2 w-full h-32 md:h-40 rounded-lg bg-gray-700 border border-gray-600 text-white p-3 uppercase focus:ring-2 focus:ring-purple-600"
                  placeholder="ESCRIBE AQUÍ..."
                />
                <p className="text-sm text-gray-400 mt-1 uppercase">
                  {med.indicaciones.length}/90
                </p>
              </div>

              {/* Tratamiento */}
              <div>
                <label className="text-lg font-semibold text-gray-200">
                  Tratamiento
                </label>
                <TratamientoInput
                  med={med}
                  index={idx}
                  handleMedicamentoChange={handleMedicamentoChange}
                  phraseTemplates={phraseTemplates}
                />
              </div>

              {/* Piezas */}
              <div>
                <label className="flex items-center text-lg font-semibold text-gray-200 mb-2">
                  Piezas
                </label>
                <input
                  type="number"
                  value={med.piezas}
                  onChange={(e) =>
                    handleMedicamentoChange(idx, "piezas", e.target.value)
                  }
                  className="w-full h-12 rounded-lg bg-gray-700 border border-gray-600 text-white p-3 focus:ring-2 focus:ring-purple-600"
                  placeholder="Cantidad"
                />

                {/* Solo mostrar Resurtir si tratamientoDias === 30 */}
                {med.tratamientoDias === 30 && (
                  <>
                    <div className="mt-4 flex items-center justify-between bg-gray-700 p-3 rounded-lg border border-gray-600">
                      <div className="flex items-center space-x-2">
                        <FiRefreshCw className="text-green-400" />
                        <span className="text-gray-200 font-medium">
                          Resurtir
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleMedicamentoChange(idx, "resurtir", "si")
                          }
                          className={`w-10 h-6 rounded-full transition-colors ${
                            med.resurtir === "si"
                              ? "bg-green-500 hover:bg-green-400"
                              : "bg-gray-600 hover:bg-gray-500"
                          }`}
                        />
                        <button
                          onClick={() => {
                            handleMedicamentoChange(idx, "resurtir", "no");
                            handleMedicamentoChange(
                              idx,
                              "mesesResurtir",
                              null
                            );
                          }}
                          className={`w-10 h-6 rounded-full transition-colors ${
                            med.resurtir === "no"
                              ? "bg-red-500 hover:bg-red-400"
                              : "bg-gray-600 hover:bg-gray-500"
                          }`}
                        />
                      </div>
                    </div>

                    {med.resurtir === "si" && (
                      <div className="mt-4">
                        <label className="flex items-center text-gray-200 font-medium mb-1">
                          <FaCalendarAlt className="mr-2 text-purple-400" />
                          ¿Cuántos meses?
                        </label>
                        <select
                          value={med.mesesResurtir ?? ""}
                          onChange={(e) =>
                            handleMedicamentoChange(
                              idx,
                              "mesesResurtir",
                              Number(e.target.value)
                            )
                          }
                          className="w-full h-10 rounded-lg bg-gray-700 border border-gray-600 text-white p-2 focus:ring-2 focus:ring-purple-600"
                        >
                          <option value="">Selecciona</option>
                          <option value={1}>1 mes</option>
                          <option value={2}>2 meses</option>
                          <option value={3}>3 meses</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quitar */}
            {medicamentos.length > 1 && (
              <div className="text-right mt-4">
                <button
                  onClick={() => quitarMedicamento(idx)}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-500"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>
        ))}

      {/* Agregar Medicamento */}
      {decisionTomada === "si" && (
        <div className="text-right">
          <button
            onClick={agregarMedicamento}
            className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow"
          >
            + Agregar Medicamento
          </button>
        </div>
      )}

      {/* Historial */}
      <HistorialMedicamentos
        clavenomina={clavenomina}
        clavepaciente={clavepaciente}
      />
    </div>
  );
};

export default Medicamentos;
