/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Image from "next/image";

import {
  FaUser,
  FaUserTie,
  FaHeartbeat,
  FaNotesMedical,
  FaSpinner,
} from "react-icons/fa";
import { GiStomach, GiMedicalDrip } from "react-icons/gi";
import { TbTemperature } from "react-icons/tb";

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
      const ultimoDiaMesAnterior = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        0
      ).getDate();
      dias += ultimoDiaMesAnterior;
    }

    const display = `${años} años, ${meses} meses, ${dias} días`;
    const dbFormat = `${años} años y ${meses} meses`;
    return { display, dbFormat };
  } catch (error) {
    console.error("Error al calcular la edad:", error);
    return { display: "0 años, 0 meses, 0 días", dbFormat: "0 años y 0 meses" };
  }
};

export default function SignosVitalesFacial() {
  const router = useRouter();
  const { nomina, idBeneficiario } = router.query;

  //* Beneficiario
  const [beneficiario, setBeneficiario] = useState(null);
  const [isLoadingBenef, setIsLoadingBenef] = useState(true);

  //* Empleado
  const [employeeData, setEmployeeData] = useState({
    photo: "/user_icon_.png",
    name: "",
    age: "",
    department: "",
    workstation: "",
    grupoNomina: "",
    cuotaSindical: "",
  });
  const [isLoadingEmployee, setIsLoadingEmployee] = useState(true);

  //* Signos vitales
  const [signosVitales, setSignosVitales] = useState({
    ta: "",
    fc: "",
    altura: "",
    temperatura: "",
    oxigenacion: "",
    peso: "",
    glucosa: "",
  });

  //* Control de guardado y redirección
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  //* Cargar beneficiario y empleado al montar
  useEffect(() => {
    if (!router.isReady) return;
    if (!nomina || !idBeneficiario) return;

    const decNomina = atob(nomina);
    const decIdBenef = atob(idBeneficiario);

    fetchBeneficiarioFacial(decNomina, decIdBenef);
    fetchEmpleado(decNomina);
  }, [router.isReady, nomina, idBeneficiario]);

  //* Obtiene al beneficiario (beneficiarioFacial)
  const fetchBeneficiarioFacial = async (decNomina, decIdBenef) => {
    try {
      const response = await fetch("/api/beneficiarios/beneficiarioFacial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomina: decNomina,
          ID_BENEFICIARIO: Number(decIdBenef),
        }),
      });
      if (!response.ok) {
        throw new Error("Error al obtener el beneficiario.");
      }

      const data = await response.json();
      if (!data.beneficiarios || data.beneficiarios.length === 0) {
        throw new Error(
          "No se encontró beneficiario con los datos proporcionados."
        );
      }

      const b = data.beneficiarios[0];
      const ahora = new Date();

      //? 0) Si no es hijo (parentesco !== 2), permitir sin más chequeos
      if (Number(b.PARENTESCO) !== 2) {
        setBeneficiario(b);
        setIsLoadingBenef(false);
        return;
      }

      //? 1) Si es discapacitado
      if (Number(b.ESDISCAPACITADO) === 1) {
        if (!b.URL_INCAP) {
          playSound(false);
          MySwal.fire({
            icon: "info",
            title:
              "<span style='color: #00bcd4; font-weight: bold; font-size: 1.5em;'>ℹ️ Falta incapacidad</span>",
            html: `<p style='color: #fff; font-size: 1.1em;'>El beneficiario <strong>${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}</strong> es discapacitado y no ha subido su documento de incapacidad.</p>`,
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
        setBeneficiario(b);
        setIsLoadingBenef(false);
        return;
      }

      //? 2) No es discapacitado → debe ser estudiante
      if (Number(b.ESESTUDIANTE) === 0) {
        playSound(false);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ No es estudiante</span>",
          html: `<p style='color: #fff; font-size: 1.1em;'>El beneficiario <strong>${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}</strong> no está registrado como estudiante.</p>`,
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText:
            "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
          },
        }).then(() => {
          router.back();
        });
        return;
      }

      //? 3) Es estudiante → validar vigencia de estudios
      if (b.VIGENCIA_ESTUDIOS) {
        const vig = new Date(b.VIGENCIA_ESTUDIOS);
        if (vig.getTime() < ahora.getTime()) {
          playSound(false);
          MySwal.fire({
            icon: "warning",
            title:
              "<span style='color: #ff9800; font-weight: bold; font-size: 1.5em;'>⚠️ Constancia vencida</span>",
            html: `<p style='color: #fff; font-size: 1.1em;'>El beneficiario <strong>${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}</strong> tiene la constancia de estudios vencida.</p>`,
            background: "linear-gradient(145deg, #4a2600, #220f00)",
            confirmButtonColor: "#ff9800",
            confirmButtonText:
              "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
            customClass: {
              popup:
                "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,152,0,0.9)] rounded-lg",
            },
          }).then(() => {
            router.back();
          });
          return;
        }
      }

      //? 4) Todo OK: asignar beneficiario
      setBeneficiario(b);
      setIsLoadingBenef(false);
    } catch (error) {
      console.error("Error beneficiario:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al obtener datos</span>",
        html: `<p style='color: #fff; font-size: 1.1em;'>${
          error.message || "No se pudo cargar la información del beneficiario."
        }</p>`,
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      setIsLoadingBenef(false);
    }
  };

  //* Obtiene los datos del empleado asociado (mismo num_nom)
  const fetchEmpleado = async (decNomina) => {
    setIsLoadingEmployee(true);
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: decNomina }),
      });
      if (!response.ok) {
        throw new Error("Error al buscar la nómina del empleado.");
      }

      const data = await response.json();
      if (!data || !data.nombre || !data.departamento) {
        playSound(false);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Nómina no encontrada</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>El número de nómina no existe. Intenta nuevamente.</p>",
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText:
            "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
          },
        });
        setIsLoadingEmployee(false);
        return;
      }

      //* Calcular edad
      const { display } = data.fecha_nacimiento
        ? calcularEdad(data.fecha_nacimiento)
        : { display: "0 años, 0 meses, 0 días" };

      setEmployeeData({
        photo: "/user_icon_.png",
        name: `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${
          data.a_materno ?? ""
        }`,
        age: display,
        department: data.departamento ?? "",
        workstation: data.puesto ?? "",
        grupoNomina: data.grupoNomina ?? "",
        cuotaSindical: data.cuotaSindical ?? "",
      });
      setIsLoadingEmployee(false);
    } catch (error) {
      console.error("Error empleado:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al buscar la nómina</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al buscar la nómina del empleado.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      setIsLoadingEmployee(false);
    }
  };

  //* Actualiza estatus (atendida)
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
      playSound(true);
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Estatus actualizado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La consulta fue marcada como atendida.</p>",
        background: "linear-gradient(145deg, #003300, #001a00)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0_0_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });
    } catch (error) {
      console.error("Error al actualizar estatus:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al actualizar estatus</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo actualizar el estatus. Intenta nuevamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0_0_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    }
  };

  //* Guardar la consulta
  const handleSave = async () => {
    if (!beneficiario) {
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>Beneficiario no válido</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>No se ha podido cargar al beneficiario correctamente.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0_0_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      return;
    }

    setIsSaving(true);

    try {
      const decNomina = atob(nomina);
      const decIdBenef = atob(idBeneficiario);

      //* Fecha/hora actual
      const now = new Date();
      const fechaConsulta = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
        now.getHours()
      ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
        now.getSeconds()
      ).padStart(2, "0")}`;

      //* Determina el sindicato
      const sindicato =
        employeeData.grupoNomina === "NS"
          ? employeeData.cuotaSindical === "S"
            ? "SUTSMSJR"
            : employeeData.cuotaSindical === ""
            ? "SITAM"
            : null
          : null;

      const consultaData = {
        fechaconsulta: fechaConsulta,
        clavenomina: decNomina,

        //* Signos Vitales
        presionarterialpaciente: signosVitales.ta,
        temperaturapaciente: signosVitales.temperatura,
        pulsosxminutopaciente: signosVitales.fc,
        respiracionpaciente: signosVitales.oxigenacion,
        estaturapaciente: signosVitales.altura,
        pesopaciente: signosVitales.peso,
        glucosapaciente: signosVitales.glucosa,

        //* Beneficiario
        nombrepaciente: `${beneficiario.NOMBRE} ${beneficiario.A_PATERNO} ${beneficiario.A_MATERNO}`,
        edad: beneficiario.EDAD,
        elpacienteesempleado: "N",
        parentesco: beneficiario.ID_PARENTESCO || 0,
        clavepaciente: decIdBenef,

        //* Departamento y Sindicato traídos del Empleado
        departamento: employeeData.department || "",
        sindicato,

        //* Estatus inicial
        clavestatus: 1,
      };

      const resp = await fetch("/api/pacientes-consultas/saveConsulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaData),
      });

      if (!resp.ok) {
        throw new Error("Error al guardar la consulta");
      }

      const responseData = await resp.json();
      //* Marcamos estatus como atendida
      await actualizarEstado(responseData.claveConsulta);

      //* Alerta de éxito
      playSound(true);
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>Consulta Guardada</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La consulta ha sido registrada y atendida exitosamente.</p>",
        background: "linear-gradient(145deg, #003300, #001a00)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0_0_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      }).then(() => {
        //* Después de la alerta, mostramos "Redirigiendo..." y navegamos
        setIsRedirecting(true);
        router.push("/consultas/signos-vitales");
      });
    } catch (error) {
      console.error("Error al guardar la consulta:", error);
      playSound(false);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al intentar guardar la consulta.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0_0_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  //* Render de cargas
  if (!router.isReady || isLoadingBenef || isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p className="text-lg animate-bounce">
          Cargando datos del beneficiario/empleado...
        </p>
      </div>
    );
  }
  if (!beneficiario) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-red-500">
        <p className="text-xl font-bold">No se pudo cargar la información.</p>
      </div>
    );
  }

  //* Estructura del Beneficiario
  const { FOTO_URL, NOMBRE, A_PATERNO, A_MATERNO, EDAD, PARENTESCO_DESC } =
    beneficiario;

  return (
    <>
      {/* Fondo principal con gradiente y animación */}
      <div className="relative min-h-screen bg-gradient-to-tr from-purple-900 via-black to-blue-900 text-white py-16 px-8 overflow-hidden">
        {/* Figuras decorativas animadas */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="w-[70vw] h-[70vw] bg-purple-700 opacity-20 rounded-full absolute top-[-35vw] left-[-35vw] blur-3xl animate-pulse" />
          <div className="w-[60vw] h-[60vw] bg-blue-700 opacity-20 rounded-full absolute bottom-[-30vw] right-[-30vw] blur-2xl animate-pulse" />
        </div>

        <div className="relative max-w-6xl mx-auto backdrop-blur-lg bg-opacity-30 bg-black rounded-3xl shadow-2xl p-10 sm:p-16 z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-2 text-center uppercase tracking-wider flex items-center justify-center space-x-3">
            <FaNotesMedical className="text-yellow-400" />
            <span>Signos Vitales</span>
          </h1>
          <p className="text-md sm:text-lg text-center mb-10 text-gray-200">
            Fecha: {new Date().toLocaleDateString()}
          </p>

          {/* GRID principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Datos del Paciente */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-2xl shadow-xl border border-gray-600">
              <div className="text-2xl font-bold mb-4 text-teal-300 text-center uppercase flex items-center justify-center space-x-2">
                <FaUser className="text-2xl" />
                <h2>Datos del Paciente</h2>
              </div>
              <div className="flex items-center space-x-4">
                <Image
                  src={FOTO_URL || "/user_icon_.png"}
                  alt="Foto Paciente"
                  width={100}
                  height={100}
                  className="w-28 h-28 rounded-full border-4 border-teal-400 shadow-lg object-cover"
                />
                <div>
                  <p className="text-xl font-semibold text-teal-200 mb-1">
                    {NOMBRE} {A_PATERNO} {A_MATERNO}
                  </p>
                  <p className="text-sm text-gray-300">
                    Edad: <span className="font-medium">{EDAD}</span>
                  </p>
                  {PARENTESCO_DESC && (
                    <p className="text-sm text-gray-300">
                      Parentesco:{" "}
                      <span className="font-medium">{PARENTESCO_DESC}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Datos del Empleado */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-2xl shadow-xl border border-gray-600">
              <div className="text-2xl font-bold mb-4 text-pink-300 text-center uppercase flex items-center justify-center space-x-2">
                <FaUserTie className="text-2xl" />
                <h2>Datos del Empleado</h2>
              </div>
              <div className="flex items-center space-x-4">
                <Image
                  src={employeeData.photo || "/user_icon_.png"}
                  alt="Foto Empleado"
                  width={100}
                  height={100}
                  className="w-28 h-28 rounded-full border-4 border-pink-400 shadow-lg object-cover"
                />
                <div>
                  <p className="text-xl font-semibold text-pink-200 mb-1">
                    {employeeData.name}
                  </p>
                  <p className="text-sm text-gray-300">
                    Edad:{" "}
                    <span className="font-medium">{employeeData.age}</span>
                  </p>
                  <p className="text-sm text-gray-300">
                    Departamento:{" "}
                    <span className="font-medium">
                      {employeeData.department}
                    </span>
                  </p>
                  <p className="text-sm text-gray-300">
                    Puesto:{" "}
                    <span className="font-medium">
                      {employeeData.workstation}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULARIO Signos Vitales */}
          <div className="bg-gradient-to-tr from-gray-800 to-gray-700 p-8 rounded-2xl shadow-xl border border-gray-700">
            <div className="text-2xl sm:text-3xl font-bold mb-6 text-center text-yellow-300 uppercase flex items-center justify-center space-x-2">
              <FaHeartbeat className="text-3xl" />
              <h3>Captura de Signos Vitales</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* T/A */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <GiMedicalDrip className="text-lg text-yellow-200" />
                  <span>T/A:</span>
                </label>
                <input
                  type="text"
                  name="ta"
                  value={signosVitales.ta}
                  onChange={(e) =>
                    setSignosVitales({ ...signosVitales, ta: e.target.value })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="120/80"
                />
              </div>

              {/* FC */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <FaHeartbeat className="text-lg text-red-400" />
                  <span>Frecuencia Cardiaca (FC):</span>
                </label>
                <input
                  type="text"
                  name="fc"
                  value={signosVitales.fc}
                  onChange={(e) =>
                    setSignosVitales({ ...signosVitales, fc: e.target.value })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="80"
                />
              </div>

              {/* Temperatura */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <TbTemperature className="text-lg text-red-300" />
                  <span>Temperatura (°C):</span>
                </label>
                <input
                  type="text"
                  name="temperatura"
                  value={signosVitales.temperatura}
                  onChange={(e) =>
                    setSignosVitales({
                      ...signosVitales,
                      temperatura: e.target.value,
                    })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="37.5"
                />
              </div>

              {/* Oxigenación */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <FaHeartbeat className="text-lg text-green-300" />
                  <span>Oxigenación (%):</span>
                </label>
                <input
                  type="text"
                  name="oxigenacion"
                  value={signosVitales.oxigenacion}
                  onChange={(e) =>
                    setSignosVitales({
                      ...signosVitales,
                      oxigenacion: e.target.value,
                    })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="98"
                />
              </div>

              {/* Altura */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <GiStomach className="text-lg text-purple-300" />
                  <span>Altura (cm):</span>
                </label>
                <input
                  type="text"
                  name="altura"
                  value={signosVitales.altura}
                  onChange={(e) =>
                    setSignosVitales({
                      ...signosVitales,
                      altura: e.target.value,
                    })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="170"
                />
              </div>

              {/* Peso */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <FaNotesMedical className="text-lg text-pink-300" />
                  <span>Peso (kg):</span>
                </label>
                <input
                  type="text"
                  name="peso"
                  value={signosVitales.peso}
                  onChange={(e) =>
                    setSignosVitales({
                      ...signosVitales,
                      peso: e.target.value,
                    })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="70"
                />
              </div>

              {/* Glucosa */}
              <div className="flex flex-col">
                <label className="mb-1 font-semibold flex items-center space-x-2">
                  <FaNotesMedical className="text-lg text-yellow-300" />
                  <span>Glucosa (mg/dL):</span>
                </label>
                <input
                  type="text"
                  name="glucosa"
                  value={signosVitales.glucosa}
                  onChange={(e) =>
                    setSignosVitales({
                      ...signosVitales,
                      glucosa: e.target.value,
                    })
                  }
                  className="p-3 rounded-md bg-gray-600 text-white border border-gray-500 focus:outline-none focus:border-yellow-400 transition duration-200"
                  placeholder="90"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`mt-8 w-full py-3 rounded-md font-bold text-lg transition-all duration-300 transform ${
                !isSaving
                  ? "bg-yellow-500 hover:bg-yellow-400 hover:scale-105 shadow-lg shadow-yellow-500/50"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? "Guardando..." : "Guardar Signos Vitales"}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Loader si isSaving o isRedirecting */}
      {(isSaving || isRedirecting) && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">
            {isRedirecting ? "Redirigiendo..." : "Guardando..."}
          </p>
        </div>
      )}
    </>
  );
}
