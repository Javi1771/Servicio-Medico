/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { showCustomAlert } from "../../utils/alertas";
import {
  FaUser,
  FaHeartbeat,
  FaUserMd,
  FaCalendarAlt,
  FaChevronLeft,
} from "react-icons/fa";
import DatosAdicionales from "./components/datos-adicionales";
import AccionesConsulta from "../consultas/AccionesConsulta";

const formatearFecha = (fecha) => {
  if (!fecha) return "N/A";
  const opciones = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const fechaLocal = new Date(fecha);
  return fechaLocal.toLocaleString("es-MX", opciones);
};

const safeDecodeBase64 = (str) => {
  try {
    return atob(str);
  } catch (error) {
    console.error("Error al decodificar Base64:", error);
    return null;
  }
};

const DetallesEspecialidad = () => {
  const router = useRouter();

  const encryptedClaveConsulta = router.query.claveconsulta;
  const claveconsulta = encryptedClaveConsulta
    ? safeDecodeBase64(encryptedClaveConsulta)
    : null;

  const [paciente, setPaciente] = useState(null);
  const [subPantalla, setSubPantalla] = useState("Diagnóstico");
  const [loading, setLoading] = useState(true);

  const [formCompleto, setFormCompleto] = useState(false);
  const [claveEspecialidad, setClaveEspecialidad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("");
  const [pasarEspecialidad, setPasarEspecialidad] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [nombreMedico, setNombreMedico] = useState("");

  useEffect(() => {
    if (claveconsulta) {
      obtenerDatosPaciente(claveconsulta);
    }
  }, [claveconsulta]);

  const obtenerDatosPaciente = async (claveconsulta) => {
    try {
      const response = await fetch(
        `/api/especialidades/detalles-especialidad?claveconsulta=${claveconsulta}`
      );
      const data = await response.json();

      if (response.ok) {
        setPaciente(data.data);
        setPacienteSeleccionado(data.data); //* Ajustar para subpantallas
        setLoading(false);
      } else {
        await showCustomAlert(
          "error",
          "Error al cargar pacientes",
          "No se pudo cargar la información. Inténtalo nuevamente.",
          "Aceptar"
        );
      }
    } catch (error) {
      await showCustomAlert(
        "error",
        "Error al cargar pacientes",
        "No se pudo cargar la información. Inténtalo nuevamente.",
        "Aceptar"
      );
    }
  };

  const limpiarFormulario = () => {
    setFormCompleto(false);
    setClaveEspecialidad("");
    setObservaciones("");
    setEspecialidadSeleccionada("");
    setPasarEspecialidad("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <p className="text-white text-lg">Cargando información...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <p className="text-white text-lg">
          No se encontró información del paciente.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-800 text-gray-200 px-4 py-8 md:px-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 via-blue-500 to-teal-400 rounded-xl shadow-xl p-8 mb-12">
        <h1 className="text-5xl font-extrabold text-white flex items-center justify-center gap-4">
          <FaHeartbeat className="text-teal-300" />
          Detalles del Paciente
        </h1>
      </header>

      {/* Botón Regresar */}
      <div className="text-center mb-12">
        <button
          onClick={() => router.push("/especialista/consulta-especialista")}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300"
        >
          <FaChevronLeft /> Regresar
        </button>
      </div>

      {/* Contenido */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <FaUser className="text-yellow-300" /> Datos del Paciente
            </h2>
            <p>
              <span className="font-semibold">Nombre:</span>{" "}
              {paciente.nombrepaciente || "No disponible"}
            </p>
            <p>
              <span className="font-semibold">Edad:</span>{" "}
              {paciente.edad || "No disponible"}
            </p>
            <p>
              <span className="font-semibold">Parentesco:</span>{" "}
              {paciente.parentesco_desc || "No disponible"}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="text-yellow-300" /> Detalles de la
              Consulta
            </h2>
            <p>
              <span className="font-semibold">Fecha de Consulta:</span>{" "}
              {formatearFecha(paciente.fechaconsulta)}
            </p>
          </div>
        </div>
      </section>

      {/* Información adicional */}
      <section className="mb-12">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
            <FaUserMd className="text-yellow-300" /> Información del Proveedor
          </h2>
          <p>
            <span className="font-semibold">Nombre del Proveedor:</span>{" "}
            {paciente.nombreproveedor || "No disponible"}
          </p>
          <p>
            <span className="font-semibold">Especialidad:</span>{" "}
            {paciente.especialidad || "No disponible"}
          </p>
        </div>
      </section>

      <section className="mb-12">
        <DatosAdicionales
          subPantalla={subPantalla}
          handleSubPantallaChange={setSubPantalla}
          claveConsulta={claveconsulta}
          numeroDeNomina={paciente.clavenomina}
          clavepaciente={paciente.clavepaciente}
          nombrePaciente={paciente.nombrepaciente}
          nombreMedico={nombreMedico}
          claveEspecialidad={claveEspecialidad}
          pasarEspecialidad={pasarEspecialidad}
          setPasarEspecialidad={setPasarEspecialidad}
          especialidadSeleccionada={especialidadSeleccionada}
          setEspecialidadSeleccionada={setEspecialidadSeleccionada}
          observaciones={observaciones}
          setObservaciones={setObservaciones}
        />
      </section>

      <section className="mb-12">
        <AccionesConsulta
          formCompleto={formCompleto}
          limpiarFormulario={limpiarFormulario}
          claveConsulta={claveconsulta}
          clavepaciente={paciente.clavepaciente}
          clavenomina={paciente.clavenomina}
        />
      </section>
    </div>
  );
};

export default DetallesEspecialidad;
