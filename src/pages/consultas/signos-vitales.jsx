/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaHeartbeat,
  FaTemperatureHigh,
  FaTint,
  FaRuler,
  FaWeight,
  FaNotesMedical,
} from "react-icons/fa";

import {
  FaUser,
  FaBirthdayCake,
  FaIdCard,
  FaBuilding,
  FaUsers,
} from "react-icons/fa";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useRouter } from "next/router";
import ConsultasCanceladas from "./consultas-adicionales/consultas-canceladas";
import ConsultasAtendidas from "./consultas-adicionales/consultas-atendidas";

//* Inicializa SweetAlert2 con React
const MySwal = withReactContent(Swal);

//* Define las rutas de los sonidos de éxito y error
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

//! Reproduce un sonido de éxito/error
const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

//* Función para calcular la edad en años, meses y días
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento)
    return { display: "0 años, 0 meses, 0 días", dbFormat: "0 años y 0 meses" };

  try {
    //* Verifica si la fecha de nacimiento está en el formato `DD/MM/YYYY` o `YYYY-MM-DD`
    let dia, mes, año;
    if (fechaNacimiento.includes("/")) {
      [dia, mes, año] = fechaNacimiento.split(" ")[0].split("/");
    } else if (fechaNacimiento.includes("-")) {
      [año, mes, dia] = fechaNacimiento.split("T")[0].split("-");
    } else {
      throw new Error("Formato de fecha desconocido");
    }

    const fechaFormateada = `${año}-${mes}-${dia}`;
    const hoy = new Date();
    const nacimiento = new Date(fechaFormateada);

    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (meses < 0 || (meses === 0 && dias < 0)) {
      años--;
      meses += 12;
    }
    if (dias < 0) {
      meses--;
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }

    const displayFormat = `${años} años, ${meses} meses, ${dias} días`;
    const dbFormat = `${años} años y ${meses} meses`;

    return { display: displayFormat, dbFormat };
  } catch (error) {
    console.error("Error al calcular la edad:", error);
    return { display: "0 años, 0 meses, 0 días", dbFormat: "0 años y 0 meses" };
  }
};

const SignosVitales = () => {
  const router = useRouter();
  const [patientData, setPatientData] = useState({
    photo: "/user_icon_.png",
    name: "",
    age: "",
    department: "",
    workstation: "",
    grupoNomina: "",
    cuotaSindical: "",
  });
  const [nomina, setNomina] = useState("");
  const [showConsulta, setShowConsulta] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [signosVitales, setSignosVitales] = useState({
    ta: "",
    temperatura: "",
    fc: "",
    oxigenacion: "",
    altura: "",
    peso: "",
    glucosa: "",
  });
  const [empleadoEncontrado, setEmpleadoEncontrado] = useState(false);

  const [pacientes, setPacientes] = useState([]);
  const [consultasCanceladas, setConsultasCanceladas] = useState([]);
  const [consultasAtendidas, setConsultasAtendidas] = useState([]);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState("empleado");

  const [isSaving, setIsSaving] = useState(false);

  const handleFaceRecognition = () => {
    router.replace("/consultas/face-test");
  };

  const handleBeneficiarySelect = (index) => {
    const selected = beneficiaryData[index];

    if (selected.VIGENCIA_ESTUDIOS) {
      const vigenciaEstudios = new Date(selected.VIGENCIA_ESTUDIOS);
      const fechaActual = new Date();

      //* Compara las fechas usando getTime() para asegurarte de que se comparan correctamente
      if (vigenciaEstudios.getTime() < fechaActual.getTime()) {
        //! Mostrar alerta si la constancia está vencida
        playSound(false);
        MySwal.fire({
          icon: "warning",
          title:
            "<span style='color: #ff9800; font-weight: bold; font-size: 1.5em;'>⚠️ Constancia vencida</span>",
          html: `<p style='color: #fff; font-size: 1.1em;'>El beneficiario <strong>${selected.NOMBRE} ${selected.A_PATERNO} ${selected.A_MATERNO}</strong> tiene la constancia de estudios vencida. Seleccionando un beneficiario válido...</p>`,
          background: "linear-gradient(145deg, #4a2600, #220f00)",
          confirmButtonColor: "#ff9800",
          confirmButtonText:
            "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,152,0,0.9)] rounded-lg",
          },
        });

        //* Buscar el siguiente beneficiario válido
        const validBeneficiaryIndex = beneficiaryData.findIndex(
          (beneficiary) => {
            if (beneficiary.VIGENCIA_ESTUDIOS) {
              const vigenciaEstudios = new Date(beneficiary.VIGENCIA_ESTUDIOS);
              const fechaActual = new Date();
              return vigenciaEstudios.getTime() >= fechaActual.getTime(); //* Beneficiario con vigencia válida
            }
            return true; //* Beneficiario sin validación de vigencia
          }
        );

        if (validBeneficiaryIndex !== -1) {
          //* Seleccionar automáticamente el primer beneficiario válido
          setSelectedBeneficiary(beneficiaryData[validBeneficiaryIndex]);
          document.querySelector("select").value = validBeneficiaryIndex; //* Actualizar el select
        } else {
          //* Si no hay beneficiarios válidos, limpiar todo
          setSelectedBeneficiary(null);
          setBeneficiaryData([]);
          setConsultaSeleccionada("empleado"); //! Cambiar a "empleado" si no hay beneficiarios
        }

        return;
      }
    }

    //* Si el beneficiario es válido, actualizar la selección
    setSelectedBeneficiary(selected);
  };

  //* Función para cargar la lista de espera
  const cargarPacientesDelDia = async () => {
    try {
      const response = await fetch(
        "/api/pacientes-consultas/consultasHoy?clavestatus=1"
      );
      const data = await response.json();

      if (response.ok && data.consultas?.length > 0) {
        const consultasOrdenadas = data.consultas.sort(
          (a, b) => new Date(a.fechaconsulta) - new Date(b.fechaconsulta)
        );

        setPacientes((prevPacientes) => {
          //? Solo actualiza si los datos son diferentes
          if (
            JSON.stringify(prevPacientes) !== JSON.stringify(consultasOrdenadas)
          ) {
            console.log("Actualizando lista de pacientes...");
            return consultasOrdenadas;
          }
          return prevPacientes; //! No actualiza si los datos son iguales
        });
      }
    } catch (error) {
      console.error("Error al cargar consultas del día:", error);
    }
  };

  const actualizarEstado = async (claveConsulta) => {
    try {
      const response = await fetch(
        "/api/pacientes-consultas/actualizarclavestatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claveConsulta, clavestatus: 1 }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el estatus");
      }

      console.log("Clave de estatus actualizada correctamente a 2");
      playSound(true);
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Estatus actualizado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La consulta fue marcada como atendida.</p>",
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
      console.error("Error al actualizar el estatus:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al actualizar el estatus</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo actualizar el estatus de la consulta. Intenta nuevamente.</p>",
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

  const [beneficiaryData, setBeneficiaryData] = useState([]);

  const handleSave = async () => {
    if (isSaving) return; //! Evitar múltiples ejecuciones si ya está en curso
    setIsSaving(true); //* Activar el estado de guardando

    if (!nomina) {
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Número de nómina requerido</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Por favor, ingresa el número de nómina antes de guardar.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      setIsSaving(false); //! Desactivar el estado de guardando si falla
      return;
    }

    const now = new Date();
    const fechaConsulta = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;

    const consultaData = {
      fechaconsulta: fechaConsulta,
      clavenomina: nomina,
      presionarterialpaciente: signosVitales.ta,
      temperaturapaciente: signosVitales.temperatura,
      pulsosxminutopaciente: signosVitales.fc,
      respiracionpaciente: signosVitales.oxigenacion,
      estaturapaciente: signosVitales.altura,
      pesopaciente: signosVitales.peso,
      glucosapaciente: signosVitales.glucosa,
      nombrepaciente:
        consultaSeleccionada === "beneficiario" && selectedBeneficiary
          ? `${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`
          : patientData.name,
      edad:
        consultaSeleccionada === "beneficiario" && selectedBeneficiary
          ? selectedBeneficiary.EDAD
          : patientData.age,
      elpacienteesempleado: consultaSeleccionada === "empleado" ? "S" : "N",
      parentesco:
        consultaSeleccionada === "beneficiario" && selectedBeneficiary
          ? selectedBeneficiary.ID_PARENTESCO
          : 0,
      clavepaciente:
        consultaSeleccionada === "beneficiario" && selectedBeneficiary
          ? selectedBeneficiary.ID_BENEFICIARIO
          : null,
      departamento: patientData.department || "",
      sindicato:
        patientData.grupoNomina === "NS"
          ? patientData.cuotaSindical === "S"
            ? "SUTSMSJR"
            : patientData.cuotaSindical === ""
            ? "SITAM"
            : null
          : null,
      clavestatus: 1, //* Inicialmente en espera
    };

    try {
      const response = await fetch("/api/pacientes-consultas/saveConsulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaData),
      });

      if (response.ok) {
        const responseData = await response.json();

        await actualizarEstado(responseData.claveConsulta);

        playSound(true);
        MySwal.fire({
          icon: "success",
          title:
            "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Consulta guardada correctamente</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>La consulta ha sido registrada y atendida exitosamente.</p>",
          background: "linear-gradient(145deg, #004d40, #00251a)",
          confirmButtonColor: "#00e676",
          confirmButtonText:
            "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
          },
        });

        handleCloseModal();
        await cargarPacientesDelDia();
      } else {
        throw new Error("Error al guardar consulta");
      }
    } catch (error) {
      console.error("Error al guardar la consulta:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar la consulta</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al intentar guardar la consulta. Por favor, intenta nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    } finally {
      setIsSaving(false); //* Finalizar el estado de guardando
    }
  };

  const handleAdd = () => {
    setShowConsulta(true);
    setPatientData({
      photo: "/user_icon_.png",
      name: "",
      age: "",
      department: "",
      workstation: "",
      grupoNomina: "",
      cuotaSindical: "",
    });
    setSignosVitales({
      ta: "",
      temperatura: "",
      fc: "",
      oxigenacion: "",
      altura: "",
      peso: "",
      glucosa: "",
    });
    setNomina("");
    setEmpleadoEncontrado(false);
  };

  const handleRadioChange = (value) => {
    setConsultaSeleccionada(value);
    if (value === "beneficiario") {
      handleSearchBeneficiary();
    }
  };

  const handleCloseModal = () => {
    setShowConsulta(false);
  };

  //* Calcula y asigna la edad cuando obtienes los datos del empleado o beneficiario
  const handleSearch = async () => {
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: nomina }),
      });

      const data = await response.json();

      if (
        !data ||
        Object.keys(data).length === 0 ||
        !data.nombre ||
        !data.departamento
      ) {
        playSound(false);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Nómina no encontrada</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>El número de nómina ingresado no existe o no se encuentra en el sistema. Intenta nuevamente.</p>",
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText:
            "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
          },
        });

        setEmpleadoEncontrado(false);
        setShowConsulta(false); //! Cierra la ventana emergente si no se encuentra el empleado
        return;
      }

      const { display } = data.fecha_nacimiento
        ? calcularEdad(data.fecha_nacimiento)
        : { display: "0 años, 0 meses, 0 días" };

      setPatientData({
        photo: "/user_icon_.png",
        name: `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${
          data.a_materno ?? ""
        }`,
        age: display,
        department: data.departamento ?? "",
        workstation: data.puesto ?? "",
        grupoNomina: data.grupoNomina ?? "",
        cuotaSindical: data.cuotaSindical ?? "",
        fecha_nacimiento: data.fecha_nacimiento,
      });

      setEmpleadoEncontrado(true);
    } catch (error) {
      console.error("Error al obtener datos del empleado:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al buscar la nómina</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al buscar la nómina. Intenta nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      setEmpleadoEncontrado(false);
      setShowConsulta(false); //! Cierra la ventana emergente en caso de error de red
    }
  };

  const handleSearchBeneficiary = async () => {
    try {
      const response = await fetch("/api/beneficiarios/beneficiario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nomina }),
      });

      const data = await response.json();

      if (data.beneficiarios && data.beneficiarios.length > 0) {
        //* Actualizar beneficiarios directamente con los datos filtrados
        setBeneficiaryData(data.beneficiarios);

        //* Seleccionar automáticamente el primer beneficiario válido
        setSelectedBeneficiary(data.beneficiarios[0]);
        document.querySelector("select").value = 0; //* Actualizar el select
      } else {
        //* No hay beneficiarios
        setBeneficiaryData([]);
        setConsultaSeleccionada("empleado");

        playSound(false);
        MySwal.fire({
          icon: "info",
          title:
            "<span style='color: #00bcd4; font-weight: bold; font-size: 1.5em;'>ℹ️ Sin beneficiarios</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>Este empleado no tiene beneficiarios registrados en el sistema.</p>",
          background: "linear-gradient(145deg, #004d40, #00251a)",
          confirmButtonColor: "#00bcd4",
          confirmButtonText:
            "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,188,212,0.9)] rounded-lg",
          },
        });
      }
    } catch (error) {
      console.error("Error al buscar beneficiarios:", error);
    }
  };

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setSignosVitales((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  useEffect(() => {
    cargarPacientesDelDia();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white">
      {/* Encabezado con botón "Regresar" */}
      <header className="px-4 py-4 md:px-12 flex items-center">
        <Link href="/inicio-servicio-medico">
          <button className="flex items-center px-4 py-2 bg-gradient-to-r from-[#00ffee] to-[#ec0dea] hover:from-[#00d9c1] hover:to-[#e600b8] rounded-full text-white font-semibold shadow-lg shadow-teal-500/50 transition-all duration-300 transform hover:scale-105 hover:rotate-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Regresar
          </button>
        </Link>
      </header>

      {/* Contenido Principal */}
      <main className="px-4 py-8 md:px-12 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <Image
            src="/estetoscopio.png"
            alt="Estetoscopio"
            width={160}
            height={160}
            className="h-24 w-24 md:h-40 md:w-40 object-cover rounded-full bg-gray-600"
          />
          <h1 className="mt-4 text-3xl md:text-5xl font-extrabold text-center">
            Registro de Pacientes
          </h1>
        </div>

        {/* Botones de acción */}
        <div className="mt-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          {/* Agregar Paciente Por Nómina */}
          <button
            onClick={handleAdd}
            className="flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-full text-white font-bold text-sm md:text-lg uppercase bg-gradient-to-r from-[#6b00ff] via-[#b400ff] to-[#ff00ff] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none"
          >
            <svg
              className="w-6 h-6 text-white animate-pulse mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11c2.485 0 4.5-2.015 4.5-4.5S18.485 2 16 2s-4.5 2.015-4.5 4.5S13.515 11 16 11zM6 20h16a1 1 0 001-1v-1c0-2.5-3-5-8-5s-8 2.5-8 5v1a1 1 0 001 1z"
              />
            </svg>
            Agregar Paciente Por Nómina
          </button>

          {/* Agregar Paciente Por Escaneo Facial */}
          <button
            onClick={handleFaceRecognition}
            className="flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-full text-white font-bold text-sm md:text-lg uppercase bg-gradient-to-r from-[#00ff87] via-[#00d4ff] to-[#0095ff] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none"
          >
            <svg
              className="w-6 h-6 text-white animate-spin-slow mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM9 9h6v6H9z"
              />
            </svg>
            Agregar Paciente Por Escaneo Facial
          </button>
        </div>
      </main>

      <div className="w-full space-y-8">
        {/* Tabla de registros */}
        <div className="w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg mb-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-yellow-300 tracking-wide">
            Pacientes en Lista de Espera
          </h1>
          <table className="min-w-full text-gray-300 border-separate border-spacing-y-3">
            <thead>
              <tr className="bg-gray-800 bg-opacity-80 text-sm uppercase tracking-wider font-semibold">
                <th className="py-4 px-6 rounded-l-lg">Número de Nómina</th>
                <th className="py-4 px-6">Paciente</th>
                <th className="py-4 px-6">Edad</th>
                <th className="py-4 px-6 rounded-r-lg">Secretaría</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.length > 0 ? (
                pacientes.map((paciente, index) => (
                  <tr
                    key={index}
                    className="bg-gray-700 bg-opacity-50 hover:bg-gradient-to-r from-yellow-500 to-yellow-700 transition duration-300 ease-in-out rounded-lg shadow-md"
                  >
                    <td className="py-4 px-6 font-medium text-center">
                      {paciente.clavenomina || "N/A"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {paciente.nombrepaciente || "No disponible"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {paciente.edad || "Desconocida"}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {paciente.departamento || "No asignado"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    No hay consultas para el día de hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Renderizar cada tabla de estado específico con el mismo ancho y espaciado */}
        <div className="w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg mb-8">
          <ConsultasCanceladas data={consultasCanceladas} />
        </div>
        <div className="w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg mb-8">
          <ConsultasAtendidas data={consultasAtendidas} />
        </div>
      </div>

      {/* Modal para agregar signos vitales */}
      {showConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-[0_0_20px_5px_rgba(0,255,255,0.7)] w-full max-w-[90vw] md:max-w-[70vw] max-h-[90vh] overflow-y-auto relative 
  scrollbar-thin scrollbar-thumb-glow scrollbar-track-dark custom-scrollbar futuristic-scroll"
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              X
            </button>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Consulta General
            </h2>
            <p className="text-xs md:text-sm mb-2">
              Fecha: {new Date().toLocaleDateString()}
            </p>

            {/* Campo de Número de Nómina */}
            <input
              type="text"
              value={nomina}
              onChange={(e) => setNomina(e.target.value.toUpperCase())} //* Convierte a mayúsculas
              placeholder="Número de Nómina"
              className="mt-2 mb-4 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-400 transition duration-200 w-full"
            />

            <button
              onClick={handleSearch}
              className="bg-blue-600 px-4 md:px-5 py-2 rounded-lg hover:bg-blue-500 transition duration-200 font-semibold w-full"
            >
              Buscar
            </button>

            {/* Contenido deshabilitado hasta que se encuentre el empleado */}
            <fieldset
              disabled={!empleadoEncontrado}
              className={!empleadoEncontrado ? "opacity-50" : ""}
            >
              {/* Sección para seleccionar Empleado o Beneficiario */}
              <fieldset
                disabled={!empleadoEncontrado}
                className={
                  !empleadoEncontrado ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                <div className="flex flex-col items-center mt-8 mb-8 p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-xl border border-white-500 shadow-2xl backdrop-blur-lg w-full max-w-xs sm:max-w-md md:max-w-lg mx-auto neon-container">
                  <p className="text-lg font-semibold mb-6 text-center text-white tracking-wider neon-title">
                    ¿Quién va a consulta?
                  </p>
                  <div className="flex flex-col sm:flex-row sm:justify-center items-center space-y-6 sm:space-y-0 sm:space-x-8 w-full px-6">
                    <label
                      className={`relative flex flex-col items-center p-6 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-lg ${
                        empleadoEncontrado
                          ? consultaSeleccionada === "empleado"
                            ? "shadow-blue-500 scale-105 transition-transform transform"
                            : "hover:shadow-blue-500/80 hover:scale-105 transition-transform transform"
                          : "cursor-not-allowed"
                      } neon-card transition duration-500 ease-out`}
                    >
                      <input
                        type="radio"
                        name="consulta"
                        value="empleado"
                        className="form-radio h-6 w-6 text-blue-500 focus:ring-blue-400 focus:ring-2 cursor-pointer absolute top-4 right-4 opacity-0"
                        checked={consultaSeleccionada === "empleado"}
                        onChange={() => handleRadioChange("empleado")}
                        disabled={!empleadoEncontrado}
                      />
                      <span className="text-white text-lg font-semibold flex items-center space-x-2 neon-text">
                        <span className="text-blue-400 text-2xl glowing-icon">
                          👔
                        </span>
                        <span className="uppercase tracking-wider">
                          Empleado
                        </span>
                      </span>
                    </label>

                    <label
                      className={`relative flex flex-col items-center p-6 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 shadow-lg ${
                        empleadoEncontrado
                          ? consultaSeleccionada === "beneficiario"
                            ? "shadow-yellow-500 scale-105 transition-transform transform"
                            : "hover:shadow-yellow-500/80 hover:scale-105 transition-transform transform"
                          : "cursor-not-allowed"
                      } neon-card transition duration-500 ease-out`}
                    >
                      <input
                        type="radio"
                        name="consulta"
                        value="beneficiario"
                        className="form-radio h-6 w-6 text-yellow-500 focus:ring-yellow-400 focus:ring-2 cursor-pointer absolute top-4 right-4 opacity-0"
                        checked={consultaSeleccionada === "beneficiario"}
                        onChange={() => {
                          handleRadioChange("beneficiario");
                          handleSearchBeneficiary();
                        }}
                        disabled={!empleadoEncontrado}
                      />
                      <span className="text-white text-lg font-semibold flex items-center space-x-2 neon-text">
                        <span className="text-yellow-400 text-2xl glowing-icon">
                          👨‍👩‍👧‍👦
                        </span>
                        <span className="uppercase tracking-wider">
                          Beneficiario
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              </fieldset>
              {consultaSeleccionada === "beneficiario" &&
                beneficiaryData?.length > 0 && (
                  <div className="flex flex-col items-start mt-4 bg-gray-800 p-4 rounded-lg shadow-lg space-y-4">
                    <label className="text-yellow-400 font-semibold">
                      Seleccionar Beneficiario:
                    </label>
                    <select
                      onChange={(e) => handleBeneficiarySelect(e.target.value)}
                      className="bg-gray-700 p-2 rounded-md text-white w-full"
                    >
                      {beneficiaryData.map((beneficiary, index) => (
                        <option key={index} value={index}>
                          {`${beneficiary.NOMBRE} ${beneficiary.A_PATERNO} ${beneficiary.A_MATERNO} - ${beneficiary.PARENTESCO_DESC}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              <div className="flex flex-col md:flex-row md:items-start mt-6 bg-gray-900 p-6 rounded-3xl shadow-2xl border border-teal-500">
                {/* 📸 Imagen del Paciente */}
                <div className="relative">
                  {consultaSeleccionada === "beneficiario" &&
                  selectedBeneficiary ? (
                    <Image
                      src={selectedBeneficiary.FOTO_URL || "/user_icon_.png"}
                      alt="Foto del Beneficiario"
                      width={120}
                      height={120}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-yellow-400 shadow-xl transition-transform transform hover:scale-110"
                    />
                  ) : consultaSeleccionada === "empleado" &&
                    empleadoEncontrado ? (
                    <Image
                      src={empleadoEncontrado.FOTO_URL || "/user_icon_.png"}
                      alt="Foto del Empleado"
                      width={120}
                      height={120}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-blue-400 shadow-xl transition-transform transform hover:scale-110"
                    />
                  ) : (
                    <Image
                      src="/user_icon_.png"
                      alt="Foto no disponible"
                      width={120}
                      height={120}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-500 shadow-xl transition-transform transform hover:scale-110"
                    />
                  )}

                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                    📷 Foto
                  </div>
                </div>

                {/* 🏥 Información del Paciente */}
                <div className="flex-1 ml-6">
                  <div className="mb-4">
                    <p className="text-xl md:text-2xl font-semibold text-teal-300 flex items-center">
                      <FaUser className="mr-3 text-teal-400 text-3xl" />
                      Paciente:{" "}
                      <span className="font-normal text-white ml-2">
                        {consultaSeleccionada === "beneficiario" &&
                        selectedBeneficiary
                          ? `${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`
                          : patientData.name || ""}
                      </span>
                    </p>

                    {/* 🎂 Edad */}
                    <p className="text-lg text-gray-300 flex items-center mt-2">
                      <FaBirthdayCake className="mr-3 text-yellow-400 text-xl" />
                      Edad:{" "}
                      <span className="font-normal text-white ml-2">
                        {consultaSeleccionada === "beneficiario" &&
                        selectedBeneficiary
                          ? selectedBeneficiary.EDAD
                          : patientData.age || ""}
                      </span>
                    </p>

                    {/* 🆔 Puesto y Departamento */}
                    {consultaSeleccionada === "empleado" && (
                      <>
                        <p className="text-lg text-gray-300 flex items-center mt-2">
                          <FaBuilding className="mr-3 text-indigo-400 text-xl" />
                          Puesto:{" "}
                          <span className="font-normal text-white ml-2">
                            {patientData.workstation || ""}
                          </span>
                        </p>
                        <p className="text-lg text-gray-300 flex items-center mt-2">
                          <FaIdCard className="mr-3 text-green-400 text-xl" />
                          Departamento:{" "}
                          <span className="font-normal text-white ml-2">
                            {patientData.department || ""}
                          </span>
                        </p>
                      </>
                    )}

                    {/* 👨‍👩‍👧 Parentesco */}
                    {consultaSeleccionada === "beneficiario" &&
                      selectedBeneficiary && (
                        <p className="text-lg text-gray-300 flex items-center mt-2">
                          <FaUsers className="mr-3 text-pink-400 text-xl" />
                          Parentesco:{" "}
                          <span className="font-normal text-white ml-2">
                            {selectedBeneficiary.PARENTESCO_DESC || ""}
                          </span>
                        </p>
                      )}
                  </div>
                </div>

                {/* 🔥 Sección de Sindicato */}
                {patientData.grupoNomina === "NS" && (
                  <div className="md:ml-auto mt-4 md:mt-0 p-6 bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl shadow-lg border border-yellow-500">
                    <p className="text-xl font-bold text-yellow-400 flex items-center justify-center">
                      🏛️ SINDICALIZADO
                    </p>
                    <p className="text-md md:text-lg text-white text-center mt-2">
                      Sindicato:{" "}
                      <span className="font-semibold text-yellow-300">
                        {patientData.cuotaSindical === "S"
                          ? "SUTSMSJR"
                          : patientData.cuotaSindical === ""
                          ? "SITAM"
                          : "No afiliado"}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10 p-6 bg-gray-900 rounded-3xl shadow-2xl border border-teal-500">
                <h3 className="text-3xl font-extrabold text-center text-teal-300 mb-8 uppercase tracking-wider">
                  🔹 Signos Vitales 🔹
                </h3>

                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* T/A */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaHeartbeat className="text-red-400 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Tensión Arterial
                      </span>
                      <input
                        type="text"
                        name="ta"
                        value={signosVitales.ta}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-teal-400 focus:ring-2 focus:ring-teal-500 transition"
                        placeholder="Ejemplo: 120/80"
                      />
                    </div>
                  </label>

                  {/* Temperatura */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaTemperatureHigh className="text-yellow-400 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Temperatura (°C)
                      </span>
                      <input
                        type="number"
                        name="temperatura"
                        value={signosVitales.temperatura}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500 transition"
                        placeholder="Ejemplo: 36.5"
                      />
                    </div>
                  </label>

                  {/* FC */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaHeartbeat className="text-red-500 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Frecuencia Cardíaca (bpm)
                      </span>
                      <input
                        type="number"
                        name="fc"
                        value={signosVitales.fc}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-red-400 focus:ring-2 focus:ring-red-500 transition"
                        placeholder="Ejemplo: 75"
                      />
                    </div>
                  </label>

                  {/* Oxigenación */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaTint className="text-blue-400 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Oxigenación (%)
                      </span>
                      <input
                        type="number"
                        name="oxigenacion"
                        value={signosVitales.oxigenacion}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Ejemplo: 98"
                      />
                    </div>
                  </label>

                  {/* Altura */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaRuler className="text-green-400 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Altura (cm)
                      </span>
                      <input
                        type="number"
                        name="altura"
                        value={signosVitales.altura}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-green-400 focus:ring-2 focus:ring-green-500 transition"
                        placeholder="Ejemplo: 175"
                      />
                    </div>
                  </label>

                  {/* Peso */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaWeight className="text-orange-400 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Peso (kg)
                      </span>
                      <input
                        type="number"
                        name="peso"
                        value={signosVitales.peso}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-500 transition"
                        placeholder="Ejemplo: 70"
                      />
                    </div>
                  </label>

                  {/* Glucosa */}
                  <label className="flex items-center bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 hover:border-teal-400 transition-all duration-300">
                    <FaNotesMedical className="text-purple-400 text-3xl mr-4" />
                    <div className="flex-1">
                      <span className="block text-teal-300 font-semibold">
                        Glucosa (mg/dL)
                      </span>
                      <input
                        type="number"
                        name="glucosa"
                        value={signosVitales.glucosa}
                        onChange={handleVitalChange}
                        className="mt-1 block w-full rounded-md bg-gray-700 text-white p-2 border border-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-500 transition"
                        placeholder="Ejemplo: 90"
                      />
                    </div>
                  </label>
                </form>

                {/* Botón de Guardar */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleSave}
                    disabled={isSaving} //* Solo se deshabilita mientras se está guardando
                    className={`relative px-8 py-4 text-lg font-bold uppercase rounded-lg 
      bg-gray-900 border border-transparent 
      shadow-[0_0_20px_4px_rgba(255,255,0,0.7)] hover:shadow-[0_0_40px_8px_rgba(255,255,0,0.9)] 
      hover:text-white transition-all duration-300 ease-in-out group 
      ${!isSaving ? "text-yellow-400" : "text-gray-500 cursor-not-allowed"}`}
                  >
                    <span className="absolute inset-0 rounded-lg border-2 border-yellow-500 opacity-50 blur-lg group-hover:opacity-100 group-hover:blur-xl transition-all duration-500"></span>
                    <span className="relative z-10">
                      {isSaving ? "Guardando..." : "💾 Guardar Signos Vitales"}
                    </span>
                  </button>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignosVitales;
