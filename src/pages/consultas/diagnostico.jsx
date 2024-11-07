// Diagnostico.jsx
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import DatosAdicionales from "./datos-adicionales/datos-adicionales";

const Diagnostico = () => {
  const [nombreMedico, setNombreMedico] = useState("Dr. Goku");
  const [claveConsulta, setClaveConsulta] = useState("");
  const [fecha, setFecha] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
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
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [mostrarEmergente, setMostrarEmergente] = useState(false);
  const [empleadoData, setEmpleadoData] = useState(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState("empleado");
  const [pasarEspecialidad, setPasarEspecialidad] = useState(null);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [incapacidades, setIncapacidades] = useState([]);
  const [historialConsultas, setHistorialConsultas] = useState([]);
  const [padecimientosCriticos, setPadecimientosCriticos] = useState([]);
  const [antecedentes, setAntecedentes] = useState([]);
  const [datosEditados, setDatosEditados] = useState({
    signosVitales: {},
    alergias: "",
  });

  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    setFecha(formattedDate);

    cargarPacientesDelDia();
  }, []);

  const cargarPacientesDelDia = async () => {
    try {
      const response = await fetch("/api/consultasHoy");
      const data = await response.json();
      if (response.ok) {
        setPacientes(data.consultas);
      } else {
        console.error("Error al cargar consultas del día:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar consultas del día:", error);
    }
  };

  const handlePacienteClick = async (paciente) => {
    setPacienteSeleccionado(paciente);
    setMostrarEmergente(true);
    setClaveConsulta(paciente.claveconsulta);

    setSignosVitales({
      ta: paciente.presionarterialpaciente,
      temperatura: paciente.temperaturapaciente,
      fc: paciente.pulsosxminutopaciente,
      oxigenacion: paciente.respiracionpaciente,
      altura: paciente.estaturapaciente,
      peso: paciente.pesopaciente,
      glucosa: paciente.glucosapaciente,
    });

    setAlergias(paciente.alergias || "");
    setDatosEditados({ signosVitales: paciente.signosVitales || {}, alergias: paciente.alergias || "" });

    if (paciente.parentesco_desc) {
      setConsultaSeleccionada("beneficiario");
      setSelectedBeneficiary({
        ...paciente,
        PARENTESCO_DESC: paciente.parentesco_desc,
      });
    } else {
      setConsultaSeleccionada("empleado");
      setSelectedBeneficiary(null);
    }

    await obtenerDatosEmpleado(paciente.clavenomina);
  };

  const obtenerDatosEmpleado = async (num_nom) => {
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmpleadoData({
          nombreCompleto: `${data.nombre} ${data.a_paterno} ${data.a_materno}`,
          departamento: data.departamento,
        });
      } else {
        console.error("Error al obtener datos del empleado:", await response.json());
      }
    } catch (error) {
      console.error("Error al conectar con el servicio de empleado:", error);
    }
  };

  const recolectarDatos = () => {
    return {
      claveConsulta,
      diagnostico,
      motivoConsulta,
      signosVitales,
      alergias,
      observaciones,
      especialidadSeleccionada,
      pasarEspecialidad,
    };
  };

  const handleGuardar = async () => {
    const datos = recolectarDatos();

    try {
      const responseDiagnostico = await fetch("/api/diagnostico_observaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claveConsulta: datos.claveConsulta,
          diagnostico: datos.diagnostico,
          motivoconsulta: datos.motivoConsulta,
          observaciones: datos.observaciones,
        }),
      });

      if (datos.pasarEspecialidad === "si" && datos.especialidadSeleccionada) {
        const responseEspecialidad = await fetch("/api/guardarEspecialidad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta: datos.claveConsulta,
            claveEspecialidad: datos.especialidadSeleccionada,
            observaciones: datos.observaciones,
          }),
        });

        if (!responseEspecialidad.ok) throw new Error("Error al guardar especialidad");
      }

      if (responseDiagnostico.ok) {
        alert("Todos los datos fueron guardados correctamente.");
        setPacienteSeleccionado(null);
      } else {
        console.error("Error al guardar datos del diagnóstico:", await responseDiagnostico.json());
        alert("Error al guardar datos del diagnóstico.");
      }
    } catch (error) {
      console.error("Error en la solicitud de guardado:", error);
      alert("Error al conectar con el servicio de guardado.");
    }
  };

  const handleCancelar = () => {
    setDatosEditados({ signosVitales, alergias });
    setPacienteSeleccionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/consulta.png"
            alt="Consulta Icono"
            width={150}
            height={150}
            className="h-24 w-24 md:h-36 md:w-36"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold">Consulta General</h1>
        </div>
        <div className="text-sm md:text-lg mt-4 md:mt-0">
          <span className="font-semibold">Médico: </span>
          {nombreMedico}
        </div>
      </div>

      <div className="mb-8 overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg shadow-lg">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">Número de Nómina</th>
              <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">Paciente</th>
              <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">Edad</th>
              <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">Secretaría</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((paciente) => (
              <tr
                key={paciente.id}
                className="hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
                onClick={() => handlePacienteClick(paciente)}
              >
                <td className="py-2 md:py-3 px-2 md:px-4 text-left">{paciente.clavenomina}</td>
                <td className="py-2 md:py-3 px-2 md:px-4 text-left">{paciente.nombrepaciente}</td>
                <td className="py-2 md:py-3 px-2 md:px-4 text-left">{paciente.edad}</td>
                <td className="py-2 md:py-3 px-2 md:px-4 text-left">{paciente.departamento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pacienteSeleccionado && (
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
          <div className="mb-4 md:mb-8">
            <ul className="list-disc pl-5 text-sm md:text-base">
              <li className="flex items-center">
                <span className="font-semibold">Folio:</span>
                <span className="ml-1">{claveConsulta}</span>
              </li>
              <li className="flex items-center">
                <span className="font-semibold">Fecha:</span>
                <span className="ml-1">{fecha}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 mb-8">
            <div>
              <Image
                src={fotoEmpleado || "/user_icon_.png"}
                alt="Empleado"
                width={160}
                height={160}
                className="h-24 w-24 md:h-40 md:w-40 object-cover rounded-full bg-gray-600"
              />
            </div>
            <div className="bg-gray-700 p-4 rounded flex-1 shadow-lg transition duration-300 hover:shadow-xl">
              <h2 className="text-md md:text-lg font-bold mb-2">Datos del Paciente</h2>
              <p>Paciente: {pacienteSeleccionado?.nombrepaciente || "No disponible"}</p>
              <p>Edad: {pacienteSeleccionado?.edad || "Desconocida"}</p>
              <p>Parentesco: {consultaSeleccionada === "beneficiario" && selectedBeneficiary
                  ? selectedBeneficiary.PARENTESCO_DESC
                  : "Empleado(a)"}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg flex-1 shadow-lg transition duration-300 hover:shadow-xl">
              <h2 className="text-md md:text-lg font-bold mb-2">Datos del Empleado</h2>
              <p>Nómina: {pacienteSeleccionado?.clavenomina || "No disponible"}</p>
              <p>Trabajador: {empleadoData?.nombreCompleto || "No disponible"}</p>
              <p>Departamento: {empleadoData?.departamento || "No asignado"}</p>
            </div>
          </div>

          <div className="mt-4 md:mt-6 mb-6 md:mb-12">
            <h3 className="text-lg md:text-2xl font-bold mb-4">Signos Vitales</h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(signosVitales).map(([key, value]) => (
                <label key={key} className="text-sm md:text-base">
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
            </form>
          </div>

          <DatosAdicionales
            subPantalla={subPantalla}
            handleSubPantallaChange={setSubPantalla}
            setDiagnostico={setDiagnostico} 
            setMotivoConsulta={setMotivoConsulta} 
            claveConsulta={claveConsulta}
            pasarEspecialidad={pasarEspecialidad}
            setPasarEspecialidad={setPasarEspecialidad}
            especialidadSeleccionada={especialidadSeleccionada}
            setEspecialidadSeleccionada={setEspecialidadSeleccionada}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
          />

          <div className="flex space-x-2 md:space-x-4 mt-4">
            <button
              onClick={handleGuardar}
              className="px-3 py-2 md:px-4 md:py-2 bg-green-500 text-white rounded-md"
            >
              Guardar
            </button>
            <button
              onClick={handleCancelar}
              className="px-3 py-2 md:px-4 md:py-2 bg-red-500 text-white rounded-md"
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
