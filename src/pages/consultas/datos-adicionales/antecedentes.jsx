import React, { useState, useEffect } from "react";
import { showCustomAlert } from "../../../utils/alertas";
import { FaCalendarAlt } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const Antecedentes = ({ clavenomina, clavepaciente }) => {
  const [descripcion, setDescripcion] = useState("");
  const [tipoAntecedente, setTipoAntecedente] = useState("");
  const [fechaInicioEnfermedad, setFechaInicioEnfermedad] = useState(null);
  const [antecedentes, setAntecedentes] = useState([]);
  const [isFechaInicioOpen, setIsFechaInicioOpen] = useState(false);

  //* Cargar antecedentes desde la API
  useEffect(() => {
    const fetchAntecedentes = async () => {
      if (!clavenomina || !clavepaciente) {
        console.warn(
          "Faltan parámetros requeridos (clavenomina o clavepaciente). Evitando llamada a la API."
        );
        setAntecedentes([]);
        return;
      }

      try {
        const queryParams = new URLSearchParams({
          clavenomina: clavenomina,
          clavepaciente: clavepaciente,
        });

        const response = await fetch(
          `/api/antecedentes/obtenerAntecedentes?${queryParams.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setAntecedentes(data);
        } else {
          const errorText = await response.text();
          await showCustomAlert(
            "error",
            "Error al obtener antecedentes",
            errorText,
            "Aceptar"
          );

          setAntecedentes([]);
        }
      } catch (error) {
        console.error("Error al cargar los antecedentes:", error);
      }
    };

    fetchAntecedentes();
  }, [clavenomina, clavepaciente]);

  //* Guardar un nuevo antecedente
  const handleGuardarAntecedente = async () => {
    if (!descripcion || !tipoAntecedente || !fechaInicioEnfermedad) {
      await showCustomAlert(
        "warning",
        "Campos incompletos",
        "Todos los campos son obligatorios. Asegúrate de completar la información.",
        "Aceptar"
      );

      return;
    }

    try {
      const response = await fetch("/api/antecedentes/guardarAntecedente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion,
          clavenomina,
          clavepaciente,
          tipoAntecedente,
          fechaInicioEnfermedad,
        }),
      });

      if (response.ok) {
        const newAntecedente = await response.json();
        setAntecedentes([...antecedentes, newAntecedente]);
        setDescripcion("");
        setTipoAntecedente("");
        setFechaInicioEnfermedad(null);

        await showCustomAlert(
          "success",
          "Guardado con éxito",
          "El antecedente fue guardado correctamente.",
          "Aceptar"
        );
      } else {
        const errorText = await response.text();

        await showCustomAlert(
          "error",
          "Error al guardar",
          errorText,
          "Aceptar"
        );
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
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
                filteredAntecedentes.map((ant) => (
                  <tr key={ant.id_antecedente}>
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
                  <td colSpan="3" className="text-center py-3 text-gray-400">
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
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          Añadir Antecedente
        </h2>
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
          <span className="text-lg font-semibold mb-2 block">
            Año de Inicio de Tratamiento:
          </span>
          <div className="relative">
            <div
              className="flex items-center bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-full p-4 shadow-md cursor-pointer"
              onClick={() => setIsFechaInicioOpen(!isFechaInicioOpen)}
            >
              <FaCalendarAlt className="text-cyan-400 mr-4" size={28} />
              <span className="text-cyan-200 font-medium">
                {fechaInicioEnfermedad
                  ? fechaInicioEnfermedad.getFullYear()
                  : "📅 Selecciona un año"}
              </span>
            </div>
            {isFechaInicioOpen && (
              <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500">
                <Calendar
                  onChange={(date) => {
                    setFechaInicioEnfermedad(date);
                    setIsFechaInicioOpen(false);
                  }}
                  value={fechaInicioEnfermedad}
                  className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-cyan-300"
                  view="decade" //* Muestra solo la vista de selección de años
                  maxDetail="decade" //! Evita que el usuario seleccione meses o días
                  minDetail="decade" //* Mantiene la vista en selección de años
                  tileClassName={() =>
                    "text-gray-500 bg-gray-800 border border-gray-700 rounded-md"
                  }
                  navigationLabel={({ date }) => (
                    <p className="text-lg font-bold text-cyan-400">
                      {date.getFullYear()}
                    </p>
                  )}
                  nextLabel={<span className="text-cyan-400">→</span>}
                  prevLabel={<span className="text-cyan-400">←</span>}
                  next2Label={null}
                  prev2Label={null}
                />
              </div>
            )}
          </div>
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
