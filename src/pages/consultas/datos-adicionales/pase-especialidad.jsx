/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";

const PaseEspecialidad = ({
  claveConsulta,
  pasarEspecialidad,
  setPasarEspecialidad,
  especialidadSeleccionada,
  setEspecialidadSeleccionada,
  observaciones,
  setObservaciones,
  setFormularioCompleto, 
}) => {
  const [especialidades, setEspecialidades] = useState([]); 

  //* Carga las especialidades al montar el componente
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await fetch("/api/especialidades/especialidades");
        const data = await response.json();
        if (Array.isArray(data)) {
          setEspecialidades(data); //* Actualiza el estado con los datos recibidos
        } else {
          console.error("Los datos de especialidades no son un array:", data);
          setEspecialidades([]);
        }
      } catch (error) {
        console.error("Error al cargar especialidades:", error);
      }
    };
    fetchEspecialidades();
  }, [claveConsulta]);

  //* Verifica si el formulario está completo
  useEffect(() => {
    const verificarFormularioCompleto = () => {
      const camposRequeridosLlenos =
        claveConsulta && especialidadSeleccionada && observaciones;
      setFormularioCompleto(camposRequeridosLlenos);
    };

    verificarFormularioCompleto();
  }, [claveConsulta, especialidadSeleccionada, observaciones, setFormularioCompleto]);

  //* Resetea los campos si claveConsulta cambia
  useEffect(() => {
    setPasarEspecialidad("");
    setEspecialidadSeleccionada("");
    setObservaciones("");
  }, [claveConsulta, setEspecialidadSeleccionada, setObservaciones, setPasarEspecialidad]);

  const handleGuardarEspecialidad = async () => {
    try {
      const response = await fetch("/api/especialidades/guardarEspecialidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claveConsulta,
          claveEspecialidad: especialidadSeleccionada,
          observaciones,
        }),
      });

      if (!response.ok) {
        console.error("Error al guardar especialidad:", await response.json());
      } else {
        console.log("Especialidad guardada correctamente.");
      }
    } catch (error) {
      console.error("Error al guardar la especialidad:", error);
    }
  };

  const handlePaseEspecialidadChange = async (value) => {
    setPasarEspecialidad(value);
    console.log("Clave Consulta:", claveConsulta, "Valor de Pase:", value);

    try {
      const response = await fetch("/api/especialidades/actualizarConsultaEspecialidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claveConsulta,
          seasignoaespecialidad: value === "si" ? "S" : "N",
        }),
      });

      if (!response.ok) {
        console.error("Error al actualizar consulta:", await response.json());
      }
    } catch (error) {
      console.error("Error en la solicitud de actualización de consulta:", error);
    }

    if (value === "no") {
      setEspecialidadSeleccionada("");
      setObservaciones("");
    }
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Pase a Especialidad
      </h3>

      <div className="mb-6">
        <p className="text-white font-semibold mb-2">
          ¿Debe pasar a alguna especialidad?
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className={`px-4 py-2 rounded-md ${
              pasarEspecialidad === "si" ? "bg-green-600" : "bg-gray-600"
            } text-white`}
            onClick={() => handlePaseEspecialidadChange("si")}
          >
            Sí
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              pasarEspecialidad === "no" ? "bg-red-600" : "bg-gray-600"
            } text-white`}
            onClick={() => handlePaseEspecialidadChange("no")}
          >
            No
          </button>
        </div>
      </div>

      {pasarEspecialidad === "si" && (
        <>
          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Especialidad:
            </label>
            <select
              value={especialidadSeleccionada}
              onChange={(e) => setEspecialidadSeleccionada(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
            >
              <option value="">Seleccionar Especialidad</option>
              {especialidades.map((especialidad) => (
                <option
                  key={especialidad.claveespecialidad}
                  value={especialidad.claveespecialidad}
                >
                  {especialidad.especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="text-white font-semibold mb-2 block">
              Observaciones:
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3"
              placeholder="Escribe aquí las observaciones..."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PaseEspecialidad;
