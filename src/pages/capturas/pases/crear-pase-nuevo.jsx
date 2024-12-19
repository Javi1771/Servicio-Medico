/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCalendarAlt } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const MySwal = withReactContent(Swal);

const showErrorAlert = (title, message) => {
  MySwal.fire({
    icon: "error",
    title: (
      <span style={{ color: "#ff1744", fontWeight: "bold", fontSize: "1.5em" }}>
        {title}
      </span>
    ),
    html: <p style={{ color: "#fff", fontSize: "1.1em" }}>{message}</p>,
    background: "linear-gradient(145deg, #4a0000, #220000)",
    confirmButtonColor: "#ff1744",
    confirmButtonText:
      "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup:
        "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
    },
  });
};

const showSuccessAlert = (title, message) => {
  MySwal.fire({
    icon: "success",
    title: (
      <span style={{ color: "#00e676", fontWeight: "bold", fontSize: "1.5em" }}>
        {title}
      </span>
    ),
    html: <p style={{ color: "#fff", fontSize: "1.1em" }}>{message}</p>,
    background: "linear-gradient(145deg, #004d40, #00251a)",
    confirmButtonColor: "#00e676",
    confirmButtonText:
      "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup:
        "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
    },
  });
};

const showInfoAlert = (title, message) => {
  MySwal.fire({
    icon: "info",
    title: (
      <span style={{ color: "#00bcd4", fontWeight: "bold", fontSize: "1.5em" }}>
        {title}
      </span>
    ),
    html: <p style={{ color: "#fff", fontSize: "1.1em" }}>{message}</p>,
    background: "linear-gradient(145deg, #004d40, #00251a)",
    confirmButtonColor: "#00bcd4",
    confirmButtonText:
      "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup:
        "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,188,212,0.9)] rounded-lg",
    },
  });
};

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
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState("");
  const [fechaCita, setFechaCita] = useState(null);
  const [isFechaCitaOpen, setIsFechaCitaOpen] = useState(false);

  const [claveusuario, setClaveUsuario] = useState("");
  const [costo, setCosto] = useState("");

  const resetState = () => {
    setEmployeeData({});
    setBeneficiaryData([]);
    setSelectedPersona("empleado");
    setSelectedBeneficiary(null);
    setSelectedEspecialidad("");
    setSelectedProveedor("");
  };

  const handleSearch = async () => {
    if (!nomina.trim()) {
      showErrorAlert(
        "⚠️ Número de nómina requerido",
        "Por favor, ingresa un número de nómina."
      );
      return;
    }

    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: nomina }),
      });

      if (!response.ok) throw new Error("Error al realizar la búsqueda");

      const employee = await response.json();
      if (!employee || Object.keys(employee).length === 0) {
        showErrorAlert(
          "⚠️ Empleado no encontrado",
          "El número de nómina no está registrado."
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

      const beneficiariesResponse = await fetch(
        "/api/beneficiarios/beneficiario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nomina }),
        }
      );

      const beneficiaries = await beneficiariesResponse.json();
      // Aquí no mostramos la alerta, la mostraremos solo cuando el usuario dé clic en Beneficiario
      setBeneficiaryData(beneficiaries.beneficiarios || []);
    } catch (error) {
      console.error("Error al buscar empleado o beneficiarios:", error);
      showErrorAlert(
        "❌ Error en la búsqueda",
        "Hubo un problema al buscar los datos. Intenta nuevamente."
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
      showErrorAlert("Error", "No se pudieron cargar las especialidades.");
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

      if (!response.ok) throw new Error("Error al obtener proveedores");

      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      showErrorAlert("Error", "No se pudieron cargar los proveedores.");
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  useEffect(() => {
    // Obtener cookies
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

  const handlePersonaChange = async (persona) => {
    if (persona === "beneficiario") {
      // Al dar clic en Beneficiario, si no hay beneficiarios, mostrar alerta y regresar a Empleado
      if (beneficiaryData.length === 0) {
        showInfoAlert(
          "ℹ️ Sin beneficiarios",
          "El empleado no tiene beneficiarios registrados."
        );
        setSelectedPersona("empleado");
        return;
      }
    }
    setSelectedPersona(persona);
    if (persona === "beneficiario" && beneficiaryData.length > 0) {
      setSelectedBeneficiary(beneficiaryData[0]);
    }
  };

  const handleBeneficiarySelect = (index) => {
    setSelectedBeneficiary(beneficiaryData[index]);
  };

  const obtenerSindicato = (grupoNomina, cuotaSindical) => {
    // Mostrar solo si es NS y S (SUTSMSJR) o "" (SITAM)
    if (grupoNomina === "NS") {
      if (cuotaSindical === "S") return "SUTSMSJR";
      if (cuotaSindical === "") return "SITAM";
    }
    return null;
  };

  const handleSave = async () => {
    try {
      const fechaActual = new Date();
      const fechaconsulta = fechaActual.toISOString().split("T")[0];

      let claveproveedor = selectedProveedor;
      let clavenomina = nomina;
      let clavepaciente = "";
      let nombrepaciente = "";
      let edad = "";
      let clavestatus = 1;
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
        const year = fechaCita.getFullYear();
        const month = String(fechaCita.getMonth() + 1).padStart(2, "0");
        const day = String(fechaCita.getDate()).padStart(2, "0");
        const hours = String(fechaCita.getHours()).padStart(2, "0");
        const minutes = String(fechaCita.getMinutes()).padStart(2, "0");
        const seconds = "00";
        fechacitaFormatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
        sindicato, // Se asigna solo si es SUTSMSJR o SITAM, si es null no pasa nada
      };

      const response1 = await fetch("/api/especialidades/guardarPaseNuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyConsultas),
      });

      if (!response1.ok) {
        showErrorAlert("Error", "No se pudo guardar en la tabla 'consultas'.");
        return;
      }

      // Mostrar éxito y restablecer formulario
      showSuccessAlert(
        "Éxito",
        "La información se guardó correctamente en la base de datos."
      );

      // Restablecer el formulario
      setNomina("");
      resetState();
      setFechaCita(null);
    } catch (error) {
      console.error("Error al guardar:", error);
      showErrorAlert("Error", "Ocurrió un error al guardar la información.");
    }
  };

  const handleSalir = () => {
    window.history.back();
  };

  const openFechaCitaModal = () => {
    if (!fechaCita) {
      setFechaCita(new Date());
    }
    setIsFechaCitaOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-blue-900 to-teal-500 text-white py-8 px-12 flex flex-col items-center overflow-hidden">
      <div className="max-w-7xl w-full bg-gray-900 bg-opacity-90 rounded-3xl shadow-2xl p-12 border border-teal-500 border-opacity-40">
        {/* Título Principal */}
        <h1 className="text-5xl font-extrabold text-center text-teal-300 mb-10 tracking-wider">
          Crear Pase Nuevo
        </h1>

        <hr className="border-teal-400 opacity-40 my-6" />

        {/* Sección de Búsqueda */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-teal-300 mb-4 text-center tracking-wider">
            Búsqueda de Paciente
          </h2>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="text"
              value={nomina}
              onChange={(e) => setNomina(e.target.value)}
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

        {Object.keys(employeeData).length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl transition-opacity opacity-100 border border-gray-700 border-opacity-60">
            {/* Información del Paciente */}
            <section className="mb-10">
              <h2 className="text-3xl font-bold text-teal-300 mb-8 text-center tracking-wider">
                Información del{" "}
                {selectedPersona === "empleado" ? "Empleado" : "Beneficiario"}
              </h2>
              <div className="flex flex-col lg:flex-row items-center lg:items-start lg:space-x-8 mb-10">
                <div className="flex-shrink-0 mb-6 lg:mb-0 flex justify-center items-center">
                  <Image
                    src={
                      selectedPersona === "beneficiario" && selectedBeneficiary
                        ? "/user_icon_.png"
                        : employeeData.photo
                    }
                    alt="Foto"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-teal-400 shadow-lg transition-transform hover:scale-110"
                  />
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

              {selectedPersona === "beneficiario" &&
                beneficiaryData.length > 0 && (
                  <div className="mb-10 flex flex-col items-center">
                    <label className="block text-teal-300 font-semibold mb-2 text-center">
                      Seleccionar Beneficiario:
                    </label>
                    <select
                      className="w-full md:w-1/2 p-3 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-md hover:shadow-xl transition"
                      onChange={(e) => handleBeneficiarySelect(e.target.value)}
                    >
                      {beneficiaryData.map((beneficiary, index) => (
                        <option key={index} value={index}>
                          {`${beneficiary.NOMBRE} ${beneficiary.A_PATERNO} ${beneficiary.A_MATERNO} - ${beneficiary.PARENTESCO_DESC}`}
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
                onClick={handleSalir}
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
