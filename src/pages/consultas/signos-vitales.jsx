import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AiOutlineUserAdd } from "react-icons/ai";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

//* Inicializa SweetAlert2 con React
const MySwal = withReactContent(Swal);

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
  const [consultaSeleccionada, setConsultaSeleccionada] = useState("empleado");

  const isFormComplete = Object.values(signosVitales).every(
    (value) => value.trim() !== ""
  );

  const handleBeneficiarySelect = (index) => {
    setSelectedBeneficiary(beneficiaryData[index]);
  };

  const cargarPacientesDelDia = async () => {
    try {
      const response = await fetch("/api/consultasHoy");
      const data = await response.json();
      if (response.ok) {
        setPacientes(data.consultas); // Asegúrate de que setPacientes esté disponible en el componente
      } else {
        console.error("Error al cargar consultas del día:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar consultas del día:", error);
    }
  };

  const [beneficiaryData, setBeneficiaryData] = useState([]);

  //! handleSave: Utiliza 'dbFormat' solo para el guardado en la base de datos
  const handleSave = async () => {
    if (!nomina) {
      alert("Por favor, ingresa el número de nómina antes de guardar.");
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

    let sindicato = null;
    if (patientData.grupoNomina === "NS") {
      sindicato = patientData.cuotaSindical === "S" ? "SUTSMSJR" : "SITAM";
    }

    const edad =
      consultaSeleccionada === "beneficiario" && selectedBeneficiary
        ? selectedBeneficiary.EDAD
        : patientData.age;

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
      edad,
      elpacienteesempleado: consultaSeleccionada === "empleado" ? "S" : "N",
      parentesco:
        consultaSeleccionada === "beneficiario" && selectedBeneficiary
          ? selectedBeneficiary.ID_PARENTESCO
          : 0,
      departamento: patientData.department || "",
      sindicato: sindicato,
      clavestatus: 1, // Establece clavestatus a 1 para indicar "en espera"
    };

    try {
      const response = await fetch("/api/saveConsulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultaData),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        handleCloseModal();
        cargarPacientesDelDia(); // Actualiza la lista de pacientes después de guardar
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error al guardar la consulta:", error);
      alert("Error al guardar la consulta. Intenta nuevamente.");
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
  //* handleSearch: Utiliza solo 'display' para mostrar en la interfaz
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
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff8080; font-weight: bold; font-size: 1.5em;'>⚠️ Nómina no encontrada</span>",
          html: "<p style='color: #d1d5db; font-size: 1.1em;'>El número de nómina ingresado no existe o no se encuentra en el sistema. Intenta nuevamente.</p>",
          background: "linear-gradient(145deg, #2d3748, #1c2230)",
          confirmButtonColor: "#7fdbff",
          confirmButtonText:
            "<span style='color: #0f172a; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-blue-500 shadow-[0px_0px_15px_5px_rgba(0,255,255,0.3)] rounded-lg",
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
      MySwal.fire({
        icon: "error",
        title: "<span style='color: #ff6347;'>Error al buscar la nómina</span>",
        html: "<span style='color: #b0b0b0;'>Hubo un problema al buscar la nómina. Intenta nuevamente.</span>",
        background: "#1F2937",
        confirmButtonColor: "#FF6347",
        confirmButtonText: "<span style='color: white;'>Aceptar</span>",
      });
      setEmpleadoEncontrado(false);
      setShowConsulta(false); //! Cierra la ventana emergente en caso de error de red
    }
  };

  const handleSearchBeneficiary = async () => {
    try {
      const response = await fetch("/api/beneficiario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nomina }),
      });

      const data = await response.json();

      if (data.beneficiarios && data.beneficiarios.length > 0) {
        setBeneficiaryData(data.beneficiarios);
        setSelectedBeneficiary(data.beneficiarios[0]);
      } else {
        setBeneficiaryData([]);
        setConsultaSeleccionada("empleado"); //* Cambia a "empleado" si no hay beneficiarios
        MySwal.fire({
          icon: "info",
          title:
            "<span style='color: #7fdbff; font-weight: bold; font-size: 1.5em;'>ℹ️ Sin beneficiarios</span>",
          html: "<p style='color: #e5e7eb; font-size: 1.1em;'>Este empleado no tiene beneficiarios registrados en el sistema.</p>",
          background: "linear-gradient(145deg, #2d3748, #1c2230)",
          confirmButtonColor: "#7fdbff",
          confirmButtonText:
            "<span style='color: #0f172a; font-weight: bold;'>OK</span>",
          customClass: {
            popup:
              "border border-purple-500 shadow-[0px_0px_15px_5px_rgba(127,219,255,0.3)] rounded-lg",
          },
        });
      }
    } catch (error) {
      console.error("Error al buscar beneficiario:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: white;'>Error al buscar los beneficiarios</span>",
        html: "<span style='color: white;'>Hubo un problema al buscar los beneficiarios.</span>",
        background: "#1F2937",
        confirmButtonColor: "#FF6347",
        confirmButtonText: "<span style='color: white;'>OK</span>",
      });
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
    const cargarPacientesDelDia = async () => {
      try {
        const response = await fetch("/api/consultasHoy");
        const data = await response.json();
        if (response.ok && data.consultas?.length > 0) {
          console.log("Datos de consultas:", data.consultas); //* Muestra la estructura de los datos en la consola
          setPacientes(data.consultas);
        } else {
          console.warn("No hay consultas disponibles o hubo un error.");
        }
      } catch (error) {
        console.error("Error al cargar consultas:", error);
      }
    };

    cargarPacientesDelDia();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black text-white px-4 py-8 md:px-12 flex flex-col items-center pt-10">
      <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/estetoscopio.png"
            alt="Estetoscopio"
            width={160}
            height={160}
            className="h-24 w-24 md:h-40 md:w-40 object-cover rounded-full bg-gray-600"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold">
            Registro de Pacientes
          </h1>
        </div>

        <div className="flex space-x-4 md:space-x-6 mt-4 md:mt-0">
          <button
            onClick={handleAdd}
            className="flex items-center bg-gradient-to-r from-indigo-600 to-purple-800 hover:from-blue-500 hover:to-purple-600 px-8 py-4 md:px-12 md:py-5 rounded-full shadow-[0_0_20px_rgba(138,43,226,0.5),0_0_15px_rgba(75,0,130,0.5)] transform transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(138,43,226,0.7),0_0_20px_rgba(75,0,130,0.7)] relative overflow-hidden neon-effect"
          >
            <AiOutlineUserAdd className="mr-3 text-2xl md:text-3xl text-white glow-icon" />
            <span className="text-lg md:text-xl font-bold text-white tracking-wide z-10 glow-text">
              Agregar
            </span>

            {/* Efecto de neón en el fondo del botón */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-30 rounded-full animate-pulse-neon" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 transition-all duration-500 neon-hover" />
          </button>
        </div>
      </div>

      {/* Tabla de registro futurista avanzada con efectos neón */}
      <table className="min-w-full bg-gradient-to-bl from-[#0a0b1e] via-[#050515] to-[#0a0b1e] rounded-[20px] shadow-[0_0_80px_rgba(0,255,255,0.7),0_0_50px_rgba(0,0,255,0.3)] mb-12 border-separate border-spacing-y-5 border-spacing-x-5 text-white overflow-hidden neon-border">
        <thead>
          <tr className="bg-gradient-to-r from-[#0078ff] via-[#6a00ff] to-[#23006d] text-gray-200 rounded-xl shadow-[0px_0px_25px_rgba(0,255,255,0.7)]">
            <th className="py-6 px-10 text-left text-md md:text-xl font-bold uppercase tracking-[0.2em] border-b-[3px] border-transparent transition-all duration-300 neon-hover-border glow-hover">
              Número de Nómina
            </th>
            <th className="py-6 px-10 text-left text-md md:text-xl font-bold uppercase tracking-[0.2em] border-b-[3px] border-transparent transition-all duration-300 neon-hover-border glow-hover">
              Paciente
            </th>
            <th className="py-6 px-10 text-left text-md md:text-xl font-bold uppercase tracking-[0.2em] border-b-[3px] border-transparent transition-all duration-300 neon-hover-border glow-hover">
              Edad
            </th>
            <th className="py-6 px-10 text-left text-md md:text-xl font-bold uppercase tracking-[0.2em] border-b-[3px] border-transparent transition-all duration-300 neon-hover-border glow-hover">
              Secretaría
            </th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((paciente, index) => (
            <tr
              key={index}
              className="bg-gradient-to-br from-[#0b0c20] via-[#1d1f3a] to-[#0b0c20] rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_10px_rgba(0,0,255,0.2)] border border-[#0077b6]/50 transition-all duration-500"
            >
              <td className="py-6 px-10 text-left text-lg md:text-xl font-medium text-[#00e4ff] border-b-[1px] border-[#0077b6]/60 rounded-l-xl tracking-wide glow-text transition-all duration-500 hover:text-[#00ffff]">
                {paciente.clavenomina || "N/A"}
              </td>
              <td className="py-6 px-10 text-left text-lg md:text-xl font-medium text-[#00e4ff] border-b-[1px] border-[#0077b6]/60 tracking-wide glow-text transition-all duration-500 hover:text-[#00ffff]">
                {paciente.nombrepaciente || "No disponible"}
              </td>
              <td className="py-6 px-10 text-left text-lg md:text-xl font-medium text-[#00e4ff] border-b-[1px] border-[#0077b6]/60 tracking-wide glow-text transition-all duration-500 hover:text-[#00ffff]">
                {paciente.edad || "Desconocida"}
              </td>
              <td className="py-6 px-10 text-left text-lg md:text-xl font-medium text-[#00e4ff] border-b-[1px] border-[#0077b6]/60 rounded-r-xl tracking-wide glow-text transition-all duration-500 hover:text-[#00ffff]">
                {paciente.departamento || "No asignado"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para agregar signos vitales */}
      {showConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg w-full max-w-[90vw] md:max-w-[70vw] max-h-[90vh] overflow-y-auto relative">
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
              onChange={(e) => setNomina(e.target.value)}
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

              <div className="flex flex-col md:flex-row md:items-start mt-6 bg-gray-900 p-4 rounded-lg shadow-md space-y-4 md:space-y-0 md:space-x-6">
                <Image
                  src={
                    consultaSeleccionada === "beneficiario" &&
                    selectedBeneficiary
                      ? "/user_icon_.png"
                      : patientData.photo || "/user_icon_.png"
                  }
                  alt="Foto del Paciente"
                  width={96}
                  height={96}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-blue-400 shadow-lg"
                />
                <div className="flex-1">
                  <div className="mb-2">
                    <p className="text-lg md:text-xl font-semibold text-gray-200">
                      Paciente:{" "}
                      <span className="font-normal">
                        {consultaSeleccionada === "beneficiario" &&
                        selectedBeneficiary
                          ? `${selectedBeneficiary.NOMBRE} ${selectedBeneficiary.A_PATERNO} ${selectedBeneficiary.A_MATERNO}`
                          : patientData.name || ""}
                      </span>
                    </p>

                    <p className="text-sm md:text-md text-gray-300">
                      Edad:{" "}
                      <span className="font-normal">
                        {consultaSeleccionada === "beneficiario" &&
                        selectedBeneficiary
                          ? selectedBeneficiary.EDAD
                          : patientData.age || ""}
                      </span>
                    </p>

                    {consultaSeleccionada === "empleado" && (
                      <p className="text-sm md:text-md text-gray-300">
                        Puesto:{" "}
                        <span className="font-normal">
                          {patientData.workstation || ""}
                        </span>
                      </p>
                    )}

                    {consultaSeleccionada === "empleado" && (
                      <p className="text-sm md:text-md text-gray-300">
                        Departamento:{" "}
                        <span className="font-normal">
                          {patientData.department || ""}
                        </span>
                      </p>
                    )}

                    {consultaSeleccionada === "beneficiario" &&
                      selectedBeneficiary && (
                        <p className="text-sm md:text-md text-gray-300">
                          Parentesco:{" "}
                          <span className="font-normal">
                            {selectedBeneficiary.PARENTESCO_DESC || ""}
                          </span>
                        </p>
                      )}
                  </div>
                </div>

                {consultaSeleccionada === "empleado" &&
                  patientData.grupoNomina === "NS" && (
                    <div className="md:ml-auto mt-4 md:mt-0 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg shadow-lg flex flex-col items-center md:items-end text-right text-white">
                      <p className="text-md font-bold text-yellow-400">
                        <span className="block">SINDICALIZADO</span>
                      </p>
                      <p className="text-sm md:text-md">
                        Sindicato:{" "}
                        <span className="font-semibold">
                          {patientData.cuotaSindical === "S"
                            ? "SUTSMSJR"
                            : patientData.cuotaSindical === "N"
                            ? "SITAM"
                            : "No afiliado"}
                        </span>
                      </p>
                    </div>
                  )}
              </div>

              <div className="mt-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4">
                  Signos Vitales
                </h3>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    T/A:
                    <input
                      type="number"
                      name="ta"
                      value={signosVitales.ta}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                  <label>
                    Temperatura ( °C ):
                    <input
                      type="number"
                      name="temperatura"
                      value={signosVitales.temperatura}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                  <label>
                    FC ( por minuto ):
                    <input
                      type="number"
                      name="fc"
                      value={signosVitales.fc}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                  <label>
                    Oxigenación ( % ):
                    <input
                      type="number"
                      name="oxigenacion"
                      value={signosVitales.oxigenacion}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                  <label>
                    Altura ( cm ):
                    <input
                      type="number"
                      name="altura"
                      value={signosVitales.altura}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                  <label>
                    Peso ( kg ):
                    <input
                      type="number"
                      name="peso"
                      value={signosVitales.peso}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                  <label>
                    Glucosa ( mg / dL ):
                    <input
                      type="number"
                      name="glucosa"
                      value={signosVitales.glucosa}
                      onChange={handleVitalChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </label>
                </form>

                <div className="mt-6">
                  <button
                    onClick={handleSave}
                    disabled={!isFormComplete}
                    className={`px-4 md:px-5 py-2 rounded-lg font-semibold w-full transition duration-200 ${
                      isFormComplete
                        ? "bg-yellow-600 hover:bg-yellow-500"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Guardar Signos Vitales
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
