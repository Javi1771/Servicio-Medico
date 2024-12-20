/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

//* Función para formatear la fecha
const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";
  const opciones = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const fechaFormateada = new Date(fecha).toLocaleString("es-MX", opciones);
  return fechaFormateada;
};

const Medicamentos = ({
  clavenomina,
  clavepaciente,
  claveConsulta,
  claveEspecialidad,
}) => {
  const [medicamentos, setMedicamentos] = useState([
    { ean: "", medicamento: "", piezas: "", indicaciones: "", tratamiento: "" },
  ]);
  const [listaMedicamentos, setListaMedicamentos] = useState([]);
  const [historialMedicamentos, setHistorialMedicamentos] = useState([]);
  const [botonHabilitado, setBotonHabilitado] = useState(false);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe("medicamentos-channel");
    channel.bind("historial-updated", (data) => {
      if (data.clavepaciente === clavepaciente) {
        setHistorialMedicamentos(data.historial);
        console.log("Historial actualizado vía Pusher:", data.historial);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [clavepaciente]);

  //* Cargar lista de medicamentos desde el backend
  useEffect(() => {
    fetch("/api/medicamentos/listar")
      .then((res) => res.json())
      .then((data) => setListaMedicamentos(data))
      .catch((err) => console.error("Error al cargar medicamentos:", err));
  }, []);

  //* Verificar si todos los campos están completos
  useEffect(() => {
    const camposCompletos = medicamentos.every(
      (med) =>
        med.medicamento && med.piezas > 0 && med.indicaciones && med.tratamiento
    );
    setBotonHabilitado(camposCompletos);
  }, [medicamentos]);

  const handleMedicamentoChange = (index, field, value) => {
    const nuevosMedicamentos = [...medicamentos];
    nuevosMedicamentos[index][field] = value;

    //* Agregar el EAN automáticamente al seleccionar un medicamento
    if (field === "medicamento") {
      const seleccionado = listaMedicamentos.find((m) => m.sustancia === value);
      nuevosMedicamentos[index].ean = seleccionado?.ean || "";
    }

    setMedicamentos(nuevosMedicamentos);
  };

  const agregarMedicamento = () =>
    setMedicamentos([
      ...medicamentos,
      {
        ean: "",
        medicamento: "",
        piezas: "",
        indicaciones: "",
        tratamiento: "",
      },
    ]);

  const quitarMedicamento = (index) =>
    setMedicamentos(medicamentos.filter((_, i) => i !== index));

  //* Agregar useEffect para cargar el historial al montar el componente
  useEffect(() => {
    if (clavenomina && clavepaciente) {
      const url = `/api/medicamentos/historial?${new URLSearchParams({
        clavepaciente,
        clavenomina,
      }).toString()}`;
  
      console.log("URL que se está solicitando:", url);
  
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
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
  

  const guardarMedicamentoEnHistorial = async () => {
    try {
      const fechaActual = new Date().toISOString();
      const medicamentosGuardados = [];

      for (const med of medicamentos) {
        if (
          med.medicamento &&
          med.indicaciones &&
          med.tratamiento &&
          med.piezas > 0
        ) {
          const datos = {
            ...med,
            clavenomina,
            claveConsulta,
            fecha: fechaActual,
            clavepaciente,
            claveEspecialidad,
          };

          //* Log para verificar los datos antes de enviarlos
          console.log("Datos enviados al backend:", datos);

          //* Guardar en el backend
          const response = await fetch("/api/medicamentos/guardar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(
              "Error en el servidor al guardar medicamento:",
              errorData
            );
            throw new Error("Error al guardar en el servidor");
          }

          //* Log para confirmar el guardado exitoso en el servidor
          console.log(
            "Medicamento guardado exitosamente en el servidor:",
            datos
          );

          //* Guardar localmente para actualizar el historial después
          medicamentosGuardados.push({
            ...med,
            fecha: fechaActual,
            diagnostico: "General",
          });
        }
      }

      //* Actualizar historial después de guardar en el servidor
      const historialResponse = await fetch(
        `/api/medicamentos/historial?${new URLSearchParams({
          clavepaciente: clavepaciente,
          clavenomina: clavenomina,
        }).toString()}`
      );
      
      const historialData = await historialResponse.json();

      if (historialData.ok) {
        console.log(
          "Historial actualizado exitosamente:",
          historialData.historial
        );
        setHistorialMedicamentos(historialData.historial || []);
      } else {
        console.error("Error al actualizar el historial:", historialData.error);
        setHistorialMedicamentos((prevHistorial) => [
          ...prevHistorial,
          ...medicamentosGuardados,
        ]);
      }

      //* Resetear medicamentos después de guardar
      setMedicamentos([
        {
          ean: "",
          medicamento: "",
          piezas: "",
          indicaciones: "",
          tratamiento: "",
        },
      ]);

      //* Mostrar alerta de éxito
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Medicamentos guardados</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Los medicamentos se han guardado exitosamente en el historial.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });
    } catch (error) {
      console.error("Error al guardar medicamentos:", error);

      //! Mostrar alerta de error
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar los medicamentos. Inténtalo nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    }
  };

  return (
    <div className="bg-gray-800 p-4 md:p-8 rounded-lg shadow-lg">
      <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">
        Prescripción de Medicamentos
      </h3>

      {medicamentos.map((med, index) => (
        <div
          key={index}
          className="mb-4 md:mb-6 bg-gray-700 p-4 rounded-lg shadow-inner"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white font-semibold">Medicamento:</label>
              <select
                value={med.medicamento}
                onChange={(e) =>
                  handleMedicamentoChange(index, "medicamento", e.target.value)
                }
                className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mt-2"
              >
                <option value="">Seleccionar Medicamento</option>
                {listaMedicamentos.map((m, i) => (
                  <option key={i} value={m.sustancia}>
                    {m.sustancia}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white font-semibold">Piezas:</label>
              <input
                type="number"
                value={med.piezas}
                onChange={(e) =>
                  handleMedicamentoChange(
                    index,
                    "piezas",
                    parseInt(e.target.value, 10)
                  )
                }
                className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mt-2"
                min="1"
                placeholder="Cantidad a otorgar"
              />
            </div>
            <div>
              <label className="text-white font-semibold">Indicaciones:</label>
              <textarea
                value={med.indicaciones}
                onChange={(e) =>
                  handleMedicamentoChange(index, "indicaciones", e.target.value)
                }
                className="block w-full rounded-lg bg-gray-600 border-gray-500 text-white p-2 md:p-3 mt-2"
                placeholder="Escribe las indicaciones"
              />
            </div>
            <div>
              <label className="text-white font-semibold">Tratamiento:</label>
              <textarea
                value={med.tratamiento}
                onChange={(e) =>
                  handleMedicamentoChange(index, "tratamiento", e.target.value)
                }
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
              Agregar Medicamento
            </button>
            {medicamentos.length > 1 && (
              <button
                onClick={() => quitarMedicamento(index)}
                className="bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-500"
              >
                Quitar Medicamento
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Botón de Guardar Medicamento en Historial */}
      <div className="text-right mt-12 mb-12">
        <button
          onClick={guardarMedicamentoEnHistorial}
          disabled={!botonHabilitado}
          className={`px-4 py-2 rounded-md shadow-md ${
            botonHabilitado
              ? "bg-purple-600 text-white hover:bg-purple-500"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          Guardar Medicamento en Historial
        </button>
      </div>

      {/* Historial de Medicamentos Otorgados */}
      <div className="bg-gray-900 p-6 md:p-8 rounded-xl shadow-2xl mb-6">
        <h2 className="text-2xl md:text-4xl font-semibold mb-6 text-center text-purple-400">
          Historial de Medicamentos Otorgados
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-lg text-left">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-b border-gray-700">
                <th className="p-4 text-sm font-semibold text-left">Fecha</th>
                <th className="p-4 text-sm font-semibold text-left">
                  Nómina del Paciente
                </th>
                <th className="p-4 text-sm font-semibold text-left">
                  Medicamento
                </th>
                <th className="p-4 text-sm font-semibold text-left">Piezas</th>
                <th className="p-4 text-sm font-semibold text-left">
                  Indicaciones
                </th>
                <th className="p-4 text-sm font-semibold text-left">
                  Tratamiento
                </th>
                <th className="p-4 text-sm font-semibold text-left">
                  Diagnóstico
                </th>
                <th className="p-4 text-sm font-semibold text-left">
                  Motivo de Consulta
                </th>
                <th className="p-4 text-sm font-semibold text-left">
                  Especialidad del Médico
                </th>
              </tr>
            </thead>
            <tbody>
              {historialMedicamentos.length > 0 ? (
                historialMedicamentos.map((h, i) => (
                  <tr
                    key={i}
                    className="hover:bg-purple-600 hover:bg-opacity-50 transition-colors duration-300"
                  >
                    <td className="p-4 border-t border-gray-800">
                      {formatearFecha(h.fecha)}
                    </td>
                    <td className="p-4 border-t border-gray-800">
                      {h.clavenomina}
                    </td>
                    <td className="p-4 border-t border-gray-800">
                      {h.medicamento}
                    </td>
                    <td className="p-4 border-t border-gray-800">{h.piezas}</td>
                    <td className="p-4 border-t border-gray-800">
                      {h.indicaciones}
                    </td>
                    <td className="p-4 border-t border-gray-800">
                      {h.tratamiento}
                    </td>
                    <td className="p-4 border-t border-gray-800">
                      {h.diagnostico || "No registrado"}
                    </td>
                    <td className="p-4 border-t border-gray-800">
                      {h.motivoconsulta || "No registrado"}
                    </td>
                    <td className="p-4 border-t border-gray-800">
                      {h.nombre_especialidad || "No asignado"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="p-4 text-center border-t border-gray-800"
                  >
                    No hay medicamentos registrados en el historial.
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
