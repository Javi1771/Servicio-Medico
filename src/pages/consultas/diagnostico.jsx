/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import DatosAdicionales from "./datos-adicionales/datos-adicionales";

const Diagnostico = () => {
  // Estados para manejar datos
  const [nombreMedico, setNombreMedico] = useState("Dr. Goku");
  const [folio, setFolio] = useState(1);
  const [fecha, setFecha] = useState("");
  const [signosVitales, setSignosVitales] = useState({
    ta: "",
    temperatura: "",
    fc: "",
    oxigenacion: "",
    altura: "",
    peso: "",
    glucosa: "",
  });
  const [alergias, setAlergias] = useState("");
  const [fotoEmpleado, setFotoEmpleado] = useState(null);
  const [subPantalla, setSubPantalla] = useState("Diagnóstico");

  // Estados para datos del paciente seleccionado y visibilidad
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [mostrarEmergente, setMostrarEmergente] = useState(false);

  // Estado para manejar los cambios temporales antes de guardar
  const [datosEditados, setDatosEditados] = useState({
    signosVitales: {},
    alergias: "",
  });

  useEffect(() => {
    // Obtener la fecha actual
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    setFecha(formattedDate);

    // Simula una llamada a la base de datos
    const fetchData = async () => {
      const fetchedSignosVitales = {
        ta: "120/80 mmHg",
        temperatura: "36.6 °C",
        fc: "70 bpm",
        oxigenacion: "98 %",
        altura: "175 cm",
        peso: "70 kg",
        glucosa: "90 mg/dL",
      };
      const fetchedAlergias = ""; // Obtener de la base de datos

      setSignosVitales(fetchedSignosVitales);
      setAlergias(fetchedAlergias);
      setDatosEditados({ signosVitales: fetchedSignosVitales, alergias: fetchedAlergias });
    };

    fetchData();
  }, []);

  const handleSubPantallaChange = (pantalla) => {
    setSubPantalla(pantalla);
  };

  const handlePacienteClick = (paciente) => {
    setPacienteSeleccionado(paciente);
    setMostrarEmergente(true);
  };

  const closeEmergente = () => {
    setMostrarEmergente(false);
  };

  const handleChange = (e) => {
    setDatosEditados({ ...datosEditados, [e.target.name]: e.target.value });
  };

  const handleGuardar = () => {
    setAlergias(datosEditados.alergias);
    alert("Datos guardados");

    // Regresar a la vista de la tabla y ocultar emergente
    setPacienteSeleccionado(null);
  };

  const handleCancelar = () => {
    setDatosEditados({ signosVitales, alergias });

    // Regresar a la vista de la tabla y ocultar emergente
    setPacienteSeleccionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-12 py-8">
      {/* Encabezado de la pantalla */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/consulta.png"
            alt="Consulta Icono"
            width={150}
            height={150}
            className="h-36 w-36"
          />
          <h1 className="text-5xl font-extrabold">Consulta General</h1>
        </div>
        <div className="text-lg">
          <span className="font-semibold">Médico: </span>
          {nombreMedico}
        </div>
      </div>

      {/* Tabla de pacientes */}
      <div className="mb-8">
        <table className="min-w-full bg-gray-800 rounded-lg shadow-lg mb-8">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="py-3 px-4 text-left">Número de Nómina</th>
              <th className="py-3 px-4 text-left">Paciente</th>
              <th className="py-3 px-4 text-left">Edad</th>
              <th className="py-3 px-4 text-left">Secretaría</th>
            </tr>
          </thead>
          <tbody>
            <tr
              className="hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
              onClick={() =>
                handlePacienteClick({
                  nombre: "Juan Pérez",
                  edad: "30",
                  parentesco: "Hermano",
                })
              }
            >
              <td className="py-3 px-4 text-left">001</td>
              <td className="py-3 px-4 text-left">Juan Pérez</td>
              <td className="py-3 px-4 text-left">30</td>
              <td className="py-3 px-4 text-left">Salud</td>
            </tr>
            <tr
              className="hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
              onClick={() =>
                handlePacienteClick({
                  nombre: "Pancho Juarez",
                  edad: "41",
                  parentesco: "Trabajador",
                })
              }
            >
              <td className="py-3 px-4 text-left">002</td>
              <td className="py-3 px-4 text-left">Pancho Juarez</td>
              <td className="py-3 px-4 text-left">41</td>
              <td className="py-3 px-4 text-left">Salud</td>
            </tr>
            {/* Más filas según sea necesario */}
          </tbody>
        </table>
      </div>

      {/* Información del paciente y empleado, signos vitales, y acciones */}
      {pacienteSeleccionado && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          {/* Folio y fecha */}
          <div className="mb-8">
            <ul className="list-disc pl-5">
              <li className="flex items-center">
                <span className="font-semibold">Folio:</span>
                <span className="ml-1">{folio}</span>
              </li>
              <li className="flex items-center">
                <span className="font-semibold">Fecha:</span>
                <span className="ml-1">{fecha}</span>
              </li>
            </ul>
          </div>

          {/* Información del paciente y empleado */}
          <div className="flex space-x-8 mb-8">
            <div>
              <Image
                src={fotoEmpleado || "/user_icon_.png"}
                alt="Empleado"
                width={160}
                height={160}
                className="h-40 w-40 object-cover rounded-full bg-gray-600"
              />
            </div>
            <div className="bg-gray-700 p-4 rounded flex-1 shadow-lg transition duration-300 hover:shadow-xl">
              <h2 className="text-lg font-bold mb-2">Datos del Paciente</h2>
              <p>Paciente: {pacienteSeleccionado?.nombre}</p>
              <p>Edad: {pacienteSeleccionado?.edad}</p>
              <p>Parentesco: {pacienteSeleccionado?.parentesco}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg flex-1 shadow-lg transition duration-300 hover:shadow-xl">
              <h2 className="text-lg font-bold mb-2">Datos del Empleado</h2>
              <p>Nómina:</p>
              <p>Trabajador:</p>
              <p>Departamento:</p>
            </div>
          </div>

          {/* Formulario de signos vitales (editable en alergias) */}
          <div className="mt-6 mb-12">
            <h3 className="text-2xl font-bold mb-4">Signos Vitales</h3>
            <form className="grid grid-cols-2 gap-4">
              {Object.entries(signosVitales).map(([key, value]) => (
                <label key={key}>
                  {key.toUpperCase()}:
                  <input
                    type="text"
                    name={key}
                    value={value}
                    readOnly
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
              ))}
              <label>
                ALERGIAS:
                <input
                  type="text"
                  name="alergias"
                  value={datosEditados.alergias}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                />
              </label>
            </form>
          </div>

          {/* Botones emergentes y contenido */}
          <DatosAdicionales
            subPantalla={subPantalla}
            handleSubPantallaChange={handleSubPantallaChange}
          />

          {/* Botones Guardar y Cancelar */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleGuardar}
              className="px-4 py-2 bg-green-500 text-white rounded-md"
            >
              Guardar
            </button>
            <button
              onClick={handleCancelar}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagnostico;
