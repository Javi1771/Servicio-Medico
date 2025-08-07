/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import Image from "next/image";
import { FaCalendarAlt } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useRouter } from "next/router";
import HistorialTable from "./historial-pases-nuevos";
import { showCustomAlert } from "../../../utils/alertas";

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) {
    return { display: "0 años, 0 meses, 0 días" };
  }

  try {
    const [año, mes, dia] = fechaNacimiento.includes("/")
      ? fechaNacimiento.split(" ")[0].split("/").reverse()
      : fechaNacimiento.split("T")[0].split("-");
    const nacimiento = new Date(año, mes - 1, dia);
    const hoy = new Date();

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

    return { display: `${años} años, ${meses} meses, ${dias} días` };
  } catch (error) {
    console.error("Error al calcular la edad:", error);
    return { display: "0 años, 0 meses, 0 días" };
  }
};

const CrearPaseNuevo = () => {
  const [nomina, setNomina] = useState("");
  const [employeeData, setEmployeeData] = useState({});
  const [beneficiaryData, setBeneficiaryData] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("empleado");
  const [selectedBeneficiaryIndex, setSelectedBeneficiaryIndex] = useState(-1);
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState("");
  const [fechaCita, setFechaCita] = useState(null);
  const [isFechaCitaOpen, setIsFechaCitaOpen] = useState(false);
  const [hideHistorial, setHideHistorial] = useState(false);

  const [claveusuario, setClaveUsuario] = useState("");
  const [costo, setCosto] = useState("");
  const router = useRouter();

  //* Beneficiario seleccionado para usar en el render
  const selectedBeneficiary = useMemo(
    () =>
      selectedBeneficiaryIndex > -1
        ? beneficiaryData[selectedBeneficiaryIndex]
        : null,
    [selectedBeneficiaryIndex, beneficiaryData]
  );

  const handleRegresar = () => {
    router.push("/capturas/pases-a-especialidades");
  };

  const resetState = () => {
    setEmployeeData({});
    setBeneficiaryData([]);
    setSelectedPersona("empleado");
    setSelectedBeneficiaryIndex(-1);
    setSelectedEspecialidad("");
    setSelectedProveedor("");
  };

  //* Función para validar automáticamente al cargar la lista de beneficiarios
  const validateBeneficiariesOnLoad = async (beneficiaryData) => {
    if (!beneficiaryData || beneficiaryData.length === 0) {
      return;
    }

    const fechaActual = new Date();
    const beneficiariosValidosConIndice = [];

    beneficiaryData.forEach((beneficiario, index) => {
      if (Number(beneficiario.PARENTESCO) !== 2) {
        beneficiariosValidosConIndice.push({ beneficiario, index });
        return;
      }

      if (beneficiario.F_NACIMIENTO) {
        const [fechaParte] = beneficiario.F_NACIMIENTO.split(" ");
        const nacimiento = new Date(fechaParte);
        const diffMs = fechaActual - nacimiento;
        const edadAnios = new Date(diffMs).getUTCFullYear() - 1970;

        if (edadAnios <= 15) {
          beneficiariosValidosConIndice.push({ beneficiario, index });
          return;
        }

        if (Number(beneficiario.ESDISCAPACITADO) === 0) {
          return;
        }

        if (!beneficiario.URL_INCAP) {
          return;
        }

        if (Number(beneficiario.ESESTUDIANTE) === 0) {
          return;
        }

        if (beneficiario.VIGENCIA_ESTUDIOS) {
          const vigencia = new Date(beneficiario.VIGENCIA_ESTUDIOS);
          if (vigencia.getTime() >= fechaActual.getTime()) {
            beneficiariosValidosConIndice.push({ beneficiario, index });
          }
          return;
        }

        beneficiariosValidosConIndice.push({ beneficiario, index });
      }
    });

    if (beneficiariosValidosConIndice.length === 0) {
      setConsultaSeleccionada("empleado");

      await showCustomAlert(
        "info",
        "Redirección automática",
        "No hay beneficiarios válidos disponibles. Se ha seleccionado automáticamente la consulta para el empleado.",
        "Continuar",
        {
          timer: 2500,
          timerProgressBar: true,
          showConfirmButton: false,
        }
      );
      return;
    }

    const primerValido = beneficiariosValidosConIndice[0];
    setSelectedBeneficiaryIndex(primerValido.index);
    window.beneficiariosValidos = beneficiariosValidosConIndice;
  };

  const handleSearch = async () => {
    if (!nomina.trim()) {
      await showCustomAlert(
        "error",
        "Número de nómina requerido",
        "Por favor, ingresa el número de nómina antes de guardar.",
        "Aceptar"
      );
      return;
    }

    try {
      //? 1️⃣ Buscar el empleado
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: nomina }),
      });

      if (!response.ok) throw new Error("Error al realizar la búsqueda");

      const employee = await response.json();
      if (!employee || Object.keys(employee).length === 0) {
        await showCustomAlert(
          "error",
          "Error al buscar la nómina",
          "Hubo un problema al buscar la nómina. Intenta nuevamente.",
          "Aceptar"
        );
        resetState();
        return;
      }

      const { display: employeeAge } = calcularEdad(employee.fecha_nacimiento);
      setEmployeeData({
        name: `${employee.nombre} ${employee.a_paterno} ${employee.a_materno}`,
        age: employeeAge,
        department: employee.departamento,
        position: employee.puesto,
        grupoNomina: employee.grupoNomina,
        cuotaSindical: employee.cuotaSindical,
        photo: "/user_icon_.png",
      });

      //? 2️⃣ Obtener beneficiarios ya filtrados del backend
      const beneficiariesResponse = await fetch(
        "/api/beneficiarios/beneficiario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nomina }),
        }
      );

      if (!beneficiariesResponse.ok) {
        await showCustomAlert(
          "info",
          "Redirección automática",
          "No hay beneficiarios válidos disponibles. Se ha seleccionado automáticamente la consulta para el empleado.",
          "Continuar"
        );
        setBeneficiaryData([]);
        setHideHistorial(true);
        return;
      }

      const beneficiaries = await beneficiariesResponse.json();

      if (
        !beneficiaries.beneficiarios ||
        beneficiaries.beneficiarios.length === 0
      ) {
        await showCustomAlert(
          "info",
          "Redirección automática",
          "No hay beneficiarios válidos disponibles. Se ha seleccionado automáticamente la consulta para el empleado.",
          "Continuar"
        );
        setBeneficiaryData([]);
      } else {
        setBeneficiaryData(beneficiaries.beneficiarios);
        validateBeneficiariesOnLoad(beneficiaries.beneficiarios);
      }

      setHideHistorial(true);
    } catch (error) {
      console.error("Error al buscar empleado o beneficiarios:", error);
      await showCustomAlert(
        "error",
        "Error al buscar",
        "Hubo un problema al buscar. Intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch("/api/especialidades/especialidades");
      if (!response.ok) throw new Error("Error al cargar especialidades");
      const data = await response.json();
      setEspecialidades(data);
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
      await showCustomAlert(
        "error",
        "Error al buscar las especialidades",
        "Hubo un problema al buscar las especialidades. Intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  const handleEspecialidadChange = async (e) => {
    const claveEspecialidad = e.target.value;
    setSelectedEspecialidad(claveEspecialidad);

    try {
      const response = await fetch("/api/especialidades/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveEspecialidad }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener proveedores");
      }

      const json = await response.json();

      if (!json.success) {
        setProveedores([]);
        return;
      }

      setProveedores(json.data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      await showCustomAlert(
        "error",
        "Error",
        "Hubo un problema al buscar los proveedores. Intenta nuevamente.",
        "Aceptar"
      );
      setProveedores([]);
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  useEffect(() => {
    const allCookies = document.cookie.split(";");
    let userClaveUsuario = "";
    let userCosto = "";

    for (let i = 0; i < allCookies.length; i++) {
      const cookie = allCookies[i].trim();
      if (cookie.startsWith("claveusuario=")) {
        userClaveUsuario = cookie.substring(
          "claveusuario=".length,
          cookie.length
        );
      } else if (cookie.startsWith("costo=")) {
        userCosto = cookie.substring("costo=".length, cookie.length);
      }
    }

    setClaveUsuario(userClaveUsuario);
    setCosto(userCosto);
  }, []);

  //* Función auxiliar para regresar al beneficiario válido
  const regresarABeneficiarioValido = () => {
    if (window.beneficiariosValidos && window.beneficiariosValidos.length > 0) {
      const primerValido = window.beneficiariosValidos[0];
      setSelectedBeneficiaryIndex(primerValido.index);
    }
  };

  const handlePersonaChange = async (persona) => {
    if (persona === "beneficiario") {
      if (beneficiaryData.length === 0) {
        await showCustomAlert(
          "info",
          "Sin beneficiarios",
          "Este empleado no tiene beneficiarios validos registrados en el sistema.",
          "Aceptar"
        );
        setSelectedPersona("empleado");
        return;
      }

      if (window.beneficiariosValidos?.length > 0) {
        setSelectedBeneficiaryIndex(window.beneficiariosValidos[0].index);
      } else {
        await showCustomAlert(
          "info",
          "Sin beneficiarios",
          "No hay beneficiarios válidos disponibles. Se ha seleccionado automáticamente la consulta para el empleado.",
          "Aceptar"
        );
        setSelectedPersona("empleado");
      }
    } else {
      setSelectedBeneficiaryIndex(-1);
    }

    setSelectedPersona(persona);
  };

  const handleBeneficiarySelect = async (index) => {
    index = Number(index);
    const selected = beneficiaryData[index];
    const fechaActual = new Date();

    if (Number(selected.PARENTESCO) !== 2) {
      setSelectedBeneficiaryIndex(index);
      return;
    }

    if (selected.F_NACIMIENTO) {
      const [fechaParte] = selected.F_NACIMIENTO.split(" ");
      const nacimiento = new Date(fechaParte);
      const diffMs = fechaActual - nacimiento;
      const edadAnios = new Date(diffMs).getUTCFullYear() - 1970;

      if (edadAnios <= 15) {
        setSelectedBeneficiaryIndex(index);
        return;
      }
    }

    if (Number(selected.ESDISCAPACITADO) === 1) {
      if (!selected.URL_INCAP) {
        showCustomAlert(
          "info",
          "Falta incapacidad",
          `El beneficiario <strong>${selected.NOMBRE} ${selected.A_PATERNO} ${selected.A_MATERNO}</strong> es discapacitado y aún no ha subido su documento de incapacidad.`,
          "Aceptar"
        ).then(() => {
          regresarABeneficiarioValido();
        });
        regresarABeneficiarioValido();
      }
      setSelectedBeneficiaryIndex(index);
      return;
    }

    if (Number(selected.ESESTUDIANTE) === 0) {
      showCustomAlert(
        "error",
        "Datos incompletos",
        `El beneficiario <strong>${selected.NOMBRE} ${selected.A_PATERNO} ${selected.A_MATERNO}</strong> no está registrado como estudiante ni como discapacitado.
        <p style='color: #ffcdd2; font-size: 1em; margin-top: 10px;'>⚠️ Debe completar sus datos en el empadronamiento para tener acceso.</p>`,
        "Entendido"
      ).then(() => {
        regresarABeneficiarioValido();
      });

      regresarABeneficiarioValido();
      return;
    }

    if (selected.VIGENCIA_ESTUDIOS) {
      const vigencia = new Date(selected.VIGENCIA_ESTUDIOS);
      if (vigencia.getTime() < fechaActual.getTime()) {
        await showCustomAlert(
          "warning",
          "Constancia vencida",
          `El beneficiario <strong>${selected.NOMBRE} ${selected.A_PATERNO} ${selected.A_MATERNO}</strong> tiene la constancia de estudios vencida. Se ha regresado al beneficiario válido.`,
          "Aceptar"
        ).then(() => {
          regresarABeneficiarioValido();
        });

        regresarABeneficiarioValido();
        return;
      }
    }

    setSelectedBeneficiaryIndex(index);
  };

  const obtenerSindicato = (grupoNomina, cuotaSindical) => {
    if (grupoNomina === "NS") {
      if (cuotaSindical === "S") return "SUTSMSJR";
      if (cuotaSindical === "") return "SITAM";
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedEspecialidad) {
      await showCustomAlert(
        "error",
        "Error",
        "Por favor selecciona una especialidad.",
        "Aceptar"
      );
      return;
    }

    if (!selectedProveedor) {
      await showCustomAlert(
        "error",
        "Error",
        "Por favor selecciona un proveedor.",
        "Aceptar"
      );
      return;
    }

    if (!fechaCita) {
      await showCustomAlert(
        "error",
        "Error",
        "Por favor selecciona una fecha para la cita.",
        "Aceptar"
      );
      return;
    }

    try {
      const fechaActual = new Date();

      const fechaconsulta = `${fechaActual.toISOString().split("T")[0]} 
        ${String(fechaActual.getHours()).padStart(2, "0")}:${String(
        fechaActual.getMinutes()
      ).padStart(2, "0")}:${String(fechaActual.getSeconds()).padStart(2, "0")}`;

      let claveproveedor = selectedProveedor;
      let clavenomina = nomina;
      let clavepaciente = "";
      let nombrepaciente = "";
      let edad = "";
      let clavestatus = 2;
      let elpacienteesempleado = "";
      let parentescoValor = 0;
      let departamento = employeeData.department;
      let especialidadinterconsulta = selectedEspecialidad;
      let fechacitaFormatted = "";

      const sindicato = obtenerSindicato(
        employeeData.grupoNomina,
        employeeData.cuotaSindical
      );

      if (fechaCita) {
        const fechaAjustada = new Date(
          fechaCita.getTime() - fechaCita.getTimezoneOffset() * 60000
        );
        fechacitaFormatted = `${fechaAjustada.getFullYear()}-${String(
          fechaAjustada.getMonth() + 1
        ).padStart(2, "0")}-${String(fechaAjustada.getDate()).padStart(
          2,
          "0"
        )} ${String(fechaAjustada.getHours()).padStart(2, "0")}:${String(
          fechaAjustada.getMinutes()
        ).padStart(2, "0")}:00`;
      }

      let costoValor = costo;
      let claveUsuarioValor = claveusuario;

      if (selectedPersona === "empleado") {
        clavepaciente = nomina;
        nombrepaciente = employeeData.name;
        edad = employeeData.age;
        elpacienteesempleado = "S";
        parentescoValor = 0;
      } else {
        if (selectedBeneficiary) {
          clavepaciente = selectedBeneficiary.ID_BENEFICIARIO;
          nombrepaciente = `${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`;
          edad = selectedBeneficiary.EDAD;
          elpacienteesempleado = "N";
          parentescoValor = selectedBeneficiary.ID_PARENTESCO || 0;
        }
      }

      const bodyConsultas = {
        fechaconsulta,
        claveproveedor,
        clavenomina,
        clavepaciente,
        nombrepaciente,
        edad,
        clavestatus,
        elpacienteesempleado,
        parentesco: parentescoValor,
        claveusuario: claveUsuarioValor,
        departamento,
        especialidadinterconsulta,
        costo: costoValor,
        fechacita: fechacitaFormatted,
        sindicato,
      };

      const response = await fetch("/api/especialidades/guardarPaseNuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyConsultas),
      });

      if (!response.ok) {
        throw new Error("Error al guardar en la base de datos.");
      }

      const data = await response.json();
      const claveConsulta = data.claveConsulta;

      await showCustomAlert(
        "success",
        "Consulta guardada correctamente",
        "La consulta ha sido registrada y atendida exitosamente.",
        "Aceptar"
      );

      setNomina("");
      resetState();
      setFechaCita(null);

      const encryptedClaveConsulta = btoa(claveConsulta.toString());

      router.push(
        `/capturas/recetas/ver-recetas-pases?claveconsulta=${encryptedClaveConsulta}`
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      await showCustomAlert(
        "error",
        "Error",
        "Hubo un problema al guardar el pase. Intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-blue-900 to-teal-500 text-white py-8 px-12 flex flex-col items-center overflow-hidden">
      <div className="max-w-7xl w-full bg-gray-900 bg-opacity-90 rounded-3xl shadow-2xl p-12 border border-teal-500 border-opacity-40">
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={handleRegresar}
            className="px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
          >
            ← Regresar
          </button>
          <h1 className="text-5xl font-extrabold text-center text-teal-300 tracking-wider">
            Crear Pase Nuevo
          </h1>
          <div className="w-32"></div>
        </div>

        <hr className="border-teal-400 opacity-40 my-6" />

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-teal-300 mb-4 text-center tracking-wider">
            Búsqueda de Paciente
          </h2>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="text"
              value={nomina}
              onChange={(e) => setNomina(e.target.value.toUpperCase())}
              placeholder="Número de Nómina"
              className="flex-1 p-4 text-lg rounded-full bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-4 focus:ring-teal-400 transition-shadow shadow-lg placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-teal-400 to-teal-600 px-6 py-3 rounded-full font-semibold text-lg text-gray-900 shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105 flex items-center hover:ring-2 hover:ring-teal-300"
            >
              <AiOutlineUserAdd className="inline-block mr-2 text-xl" />
              Buscar
            </button>
          </div>
        </section>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            hideHistorial ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
          }`}
        >
          <HistorialTable />
        </div>

        {Object.keys(employeeData).length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl transition-opacity opacity-100 border border-gray-700 border-opacity-60">
            {/* Información del Paciente */}
            <section className="mb-10">
              <h2 className="text-3xl font-bold text-teal-300 mb-8 text-center tracking-wider">
                Información del{" "}
                {selectedPersona === "empleado" ? "Empleado" : "Beneficiario"}
              </h2>

              <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-8 mb-10">
                {/* 📸 Imagen del Paciente */}
                <div className="flex-shrink-0 mb-6 lg:mb-0 flex justify-center items-center relative">
                  {selectedPersona === "beneficiario" && selectedBeneficiary ? (
                    <Image
                      src={selectedBeneficiary.FOTO_URL || "/user_icon_.png"}
                      alt="Foto del Beneficiario"
                      width={120}
                      height={120}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-yellow-400 shadow-xl transition-transform transform hover:scale-110"
                    />
                  ) : selectedPersona === "empleado" &&
                    Object.keys(employeeData).length > 0 ? (
                    <Image
                      src={employeeData.photo || "/user_icon_.png"}
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

                  {/* 📷 Indicador de foto */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                    📷 Foto
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-lg font-semibold">
                    <span className="text-teal-300">Nombre:</span>{" "}
                    <span className="text-white">
                      {selectedPersona === "beneficiario" && selectedBeneficiary
                        ? `${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`
                        : employeeData.name}
                    </span>
                  </p>
                  <p className="text-lg font-semibold">
                    <span className="text-teal-300">Edad:</span>{" "}
                    <span className="text-white">
                      {selectedPersona === "beneficiario" && selectedBeneficiary
                        ? selectedBeneficiary.EDAD
                        : employeeData.age}
                    </span>
                  </p>
                  <p className="text-lg font-semibold">
                    <span className="text-teal-300">Parentesco:</span>{" "}
                    <span className="text-white">
                      {selectedPersona === "beneficiario" && selectedBeneficiary
                        ? selectedBeneficiary.PARENTESCO_DESC
                        : "Empleado"}
                    </span>
                  </p>
                  {selectedPersona === "empleado" && (
                    <p className="text-lg font-semibold">
                      <span className="text-teal-300">Puesto:</span>{" "}
                      <span className="text-white">
                        {employeeData.position || "No especificado"}
                      </span>
                    </p>
                  )}

                  {/* Mostrar sindicato solo si NS y S= SUTSMSJR o ""=SITAM */}
                  {employeeData.grupoNomina === "NS" &&
                    (employeeData.cuotaSindical === "S" ||
                      employeeData.cuotaSindical === "") && (
                      <div className="relative group">
                        {/* Sindicato Card */}
                        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-lg border border-gray-700 hover:shadow-2xl transition-shadow duration-300 hover:border-teal-400 hover:border-opacity-80">
                          <div className="flex items-center space-x-5">
                            <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                              <span className="text-3xl text-white">🏢</span>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-teal-400 mb-1">
                                Sindicato
                              </h3>
                              <p className="text-lg text-gray-300 font-medium tracking-wide">
                                {employeeData.cuotaSindical === "S"
                                  ? "SUTSMSJR"
                                  : "SITAM"}
                              </p>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-1/2 w-3/4 h-1 bg-gradient-to-r from-teal-400 to-cyan-400 transform -translate-x-1/2 rounded-full opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Botones Empleado/Beneficiario */}
              <div className="flex justify-center space-x-6 mb-8">
                <button
                  className={`px-6 py-3 rounded-full font-semibold text-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-xl ${
                    selectedPersona === "empleado"
                      ? "bg-teal-500 text-gray-900"
                      : "bg-gray-700 text-gray-400 hover:bg-teal-400 hover:text-white"
                  }`}
                  onClick={() => handlePersonaChange("empleado")}
                >
                  Empleado
                </button>
                <button
                  className={`px-6 py-3 rounded-full font-semibold text-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-xl ${
                    selectedPersona === "beneficiario"
                      ? "bg-teal-500 text-gray-900"
                      : "bg-gray-700 text-gray-400 hover:bg-teal-400 hover:text-white"
                  }`}
                  onClick={() => handlePersonaChange("beneficiario")}
                >
                  Beneficiario
                </button>
              </div>

              {beneficiaryData.length > 0 &&
                selectedPersona === "beneficiario" && (
                  <div className="mb-10 flex flex-col items-center">
                    <label className="block text-teal-300 font-semibold mb-2 text-center">
                      Seleccionar Beneficiario:
                    </label>
                    <select
                      id="beneficiarioSelect"
                      className="w-full md:w-1/2 p-3 rounded-md bg-gray-800 text-white 
                              focus:outline-none focus:ring-2 focus:ring-teal-400 
                              shadow-md hover:shadow-xl transition"
                      value={selectedBeneficiaryIndex}
                      onChange={(e) =>
                        handleBeneficiarySelect(parseInt(e.target.value, 10))
                      }
                    >
                      {beneficiaryData.map((beneficiary, index) => (
                        <option key={index} value={index}>
                          {`${beneficiary.NOMBRE} ${beneficiary.A_PATERNO} ${beneficiary.A_MATERNO} 
           - ${beneficiary.PARENTESCO_DESC}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
            </section>

            {/* Diagnóstico y Observaciones */}
            <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl mb-10 border border-gray-700 hover:border-teal-500 hover:border-opacity-80 transition-all">
              <h2 className="text-3xl font-bold text-teal-300 mb-6 text-center tracking-wider">
                Diagnóstico y Observaciones
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
                    Especialidad:
                  </label>
                  <select
                    className="w-full p-3 rounded-md bg-gray-800 text-white mb-6 shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400 hover:shadow-xl transition"
                    onChange={handleEspecialidadChange}
                    value={selectedEspecialidad}
                  >
                    <option value="">Seleccione una especialidad</option>
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

                <div>
                  <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
                    Especialista:
                  </label>
                  <select
                    className="w-full p-3 rounded-md bg-gray-800 text-white mb-6 shadow-md focus:outline-none focus:ring-2 focus:ring-teal-400 hover:shadow-xl transition"
                    onChange={(e) => setSelectedProveedor(e.target.value)}
                    value={selectedProveedor}
                  >
                    <option value="">Seleccione un médico especialista</option>
                    {proveedores.map((proveedor) => (
                      <option
                        key={proveedor.claveproveedor}
                        value={proveedor.claveproveedor}
                      >
                        {proveedor.nombreproveedor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Fecha y Hora de la Cita */}
            <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-xl border border-gray-700 hover:border-teal-500 hover:border-opacity-80 transition-all">
              <h2 className="text-3xl font-bold text-teal-300 mb-6 text-center tracking-wider">
                Fecha y Hora de la Cita
              </h2>

              <div className="flex justify-center mb-6">
                <div
                  className="flex items-center bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-full p-4 shadow-md cursor-pointer w-full md:w-1/2 hover:shadow-xl transition-transform transform hover:scale-105"
                  onClick={() => {
                    if (!fechaCita) {
                      setFechaCita(new Date());
                    }
                    setIsFechaCitaOpen(true);
                  }}
                >
                  <FaCalendarAlt className="text-cyan-400 mr-4" size={28} />
                  <span className="text-cyan-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {fechaCita
                      ? (() => {
                          const options = {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          };
                          const dateStr = fechaCita.toLocaleString(
                            "es-ES",
                            options
                          );
                          let hours = fechaCita.getHours();
                          let minutes = fechaCita.getMinutes();
                          const ampm = hours >= 12 ? "PM" : "AM";
                          hours = hours % 12;
                          if (hours === 0) hours = 12;
                          const hoursStr = String(hours).padStart(2, "0");
                          const minutesStr = String(minutes).padStart(2, "0");
                          const timeStr = `${hoursStr}:${minutesStr} ${ampm}`;
                          return `${dateStr}, ${timeStr}`;
                        })()
                      : "📓 Selecciona una fecha y hora"}
                  </span>
                </div>
              </div>

              {isFechaCitaOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                  <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500 w-full max-w-md overflow-auto max-h-[80vh]">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4 text-center tracking-wider">
                      Selecciona la fecha y la hora
                    </h3>
                    <Calendar
                      onChange={(date) => {
                        const selectedDate = new Date(date);
                        setFechaCita(selectedDate);
                      }}
                      value={fechaCita}
                      className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-cyan-300 mx-auto mb-6 hover:shadow-xl"
                      tileDisabled={({ date }) =>
                        date < new Date().setHours(0, 0, 0, 0)
                      } //* Deshabilitar días pasados
                      tileClassName={() =>
                        "text-gray-500 bg-gray-800 border border-gray-700 rounded-md hover:border-cyan-400"
                      }
                      navigationLabel={({ date }) => (
                        <p className="text-lg font-bold text-cyan-400">
                          {date.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      nextLabel={<span className="text-cyan-400">&#8594;</span>}
                      prevLabel={<span className="text-cyan-400">&#8592;</span>}
                      next2Label={null}
                      prev2Label={null}
                    />

                    <div className="mt-6 text-center space-y-4">
                      <label className="block text-teal-300 font-semibold mb-2">
                        Selecciona la hora (formato 12 horas):
                      </label>
                      <div className="flex justify-center space-x-2">
                        {/* Horas */}
                        <select
                          className="p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 hover:shadow-md transition"
                          onChange={(e) => {
                            const updatedDate = new Date(fechaCita);
                            let hours = parseInt(e.target.value, 10);
                            let currentMinutes = updatedDate.getMinutes();
                            let ampm =
                              updatedDate.getHours() >= 12 ? "PM" : "AM";
                            if (ampm === "AM") {
                              if (hours === 12) hours = 0;
                            } else {
                              if (hours !== 12) hours += 12;
                            }
                            updatedDate.setHours(hours);
                            updatedDate.setMinutes(currentMinutes);
                            setFechaCita(updatedDate);
                          }}
                          value={
                            fechaCita
                              ? (() => {
                                  let h = fechaCita.getHours();
                                  const ampm = h >= 12 ? "PM" : "AM";
                                  if (ampm === "PM" && h !== 12) h -= 12;
                                  if (ampm === "AM" && h === 0) h = 12;
                                  return h;
                                })()
                              : 12
                          }
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i} value={i + 1}>
                              {i + 1}
                            </option>
                          ))}
                        </select>

                        {/* Minutos */}
                        <select
                          className="p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 hover:shadow-md transition"
                          onChange={(e) => {
                            const updatedDate = new Date(fechaCita);
                            let newMinutes = parseInt(e.target.value, 10);
                            updatedDate.setMinutes(newMinutes);
                            setFechaCita(updatedDate);
                          }}
                          value={fechaCita ? fechaCita.getMinutes() : 0}
                        >
                          {[...Array(60)].map((_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, "0")}
                            </option>
                          ))}
                        </select>

                        {/* AM/PM */}
                        <select
                          className="p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-400 hover:shadow-md transition"
                          onChange={(e) => {
                            const updatedDate = new Date(fechaCita);
                            let h = updatedDate.getHours();
                            const ampm = e.target.value;

                            if (ampm === "AM" && h >= 12) {
                              h -= 12;
                            } else if (ampm === "PM" && h < 12) {
                              h += 12;
                            }
                            updatedDate.setHours(h);
                            setFechaCita(updatedDate);
                          }}
                          value={
                            fechaCita
                              ? fechaCita.getHours() >= 12
                                ? "PM"
                                : "AM"
                              : "AM"
                          }
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center space-x-4">
                      <button
                        className="bg-green-500 px-6 py-3 rounded-full font-semibold text-black hover:shadow-lg transition-transform transform hover:scale-105 hover:ring-2 hover:ring-green-300"
                        onClick={() => setIsFechaCitaOpen(false)}
                      >
                        Aceptar
                      </button>
                      <button
                        className="bg-red-600 px-6 py-3 rounded-full font-semibold text-white hover:shadow-lg transition-transform transform hover:scale-105 hover:ring-2 hover:ring-red-300"
                        onClick={() => {
                          setIsFechaCitaOpen(false);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Botones Salir y Guardar */}
            <div className="mt-10 flex justify-center space-x-10">
              <button
                onClick={handleRegresar}
                className="bg-red-600 px-8 py-3 rounded-full font-semibold text-lg text-white shadow-lg hover:shadow-2xl transition-transform transform hover:scale-110 hover:ring-2 hover:ring-red-300"
              >
                Salir
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 px-8 py-3 rounded-full font-semibold text-lg text-black shadow-lg hover:shadow-2xl transition-transform transform hover:scale-110 hover:ring-2 hover:ring-green-300"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrearPaseNuevo;
