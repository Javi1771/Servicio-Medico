/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Pusher from "pusher-js";
import { AiOutlineUserAdd } from "react-icons/ai";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import AtendiendoActualmente from "./consultas-adicionales/atendiendo-actualmente";
import ConsultasCanceladas from "./consultas-adicionales/consultas-canceladas";
import ConsultasAtendidas from "./consultas-adicionales/consultas-atendidas";

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
  const [atendiendoActualmente, setAtendiendoActualmente] = useState([]);
  const [consultasCanceladas, setConsultasCanceladas] = useState([]);
  const [consultasAtendidas, setConsultasAtendidas] = useState([]);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState("empleado");

  const isFormComplete = Object.values(signosVitales).every(
    (value) => value.trim() !== ""
  );

  const handleBeneficiarySelect = (index) => {
    setSelectedBeneficiary(beneficiaryData[index]);
  };

  //* Función para cargar la lista de espera
  const cargarPacientesDelDia = async () => {
    try {
      const response = await fetch("/api/pacientes-consultas/consultasHoy");
      const data = await response.json();
      if (response.ok && data.consultas?.length > 0) {
        const consultasOrdenadas = data.consultas.sort(
          (a, b) => new Date(a.fechaconsulta) - new Date(b.fechaconsulta)
        );
        setPacientes((prevPacientes) => {
          //? Solo actualiza si los datos son diferentes
          if (JSON.stringify(prevPacientes) !== JSON.stringify(consultasOrdenadas)) {
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
          body: JSON.stringify({ claveConsulta, clavestatus: 4 }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar el estatus");
      }

      console.log("Clave de estatus actualizada correctamente a 4");
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

  //! handleSave: Utiliza 'dbFormat' solo para el guardado en la base de datos
  const handleSave = async () => {
    if (!nomina) {
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
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
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
      departamento: patientData.department || "",
      sindicato:
        patientData.grupoNomina === "NS"
          ? patientData.cuotaSindical === "S"
            ? "SUTSMSJR"
            : patientData.cuotaSindical === ""
            ? "SITAM"
            : null
          : null,
      clavestatus: 1, // Inicialmente en espera
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
        setBeneficiaryData(data.beneficiarios);
        setSelectedBeneficiary(data.beneficiarios[0]);
      } else {
        setBeneficiaryData([]);
        setConsultaSeleccionada("empleado"); //* Cambia a "empleado" si no hay beneficiarios
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
      console.error("Error al buscar beneficiario:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al buscar beneficiarios</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al buscar los beneficiarios. Intenta nuevamente.</p>",
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

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setSignosVitales((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  //* Hook para cargar pacientes al inicio y actualizar en tiempo real
  useEffect(() => {
    //* Configuración inicial de pacientes
    cargarPacientesDelDia();

    //* Configuración de Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe("consultas");

    //* Escuchar eventos de nuevas consultas
    channel.bind("nueva-consulta", (data) => {
      console.log("Nueva consulta recibida:", data);

      setPacientes((prevPacientes) => {
        const existe = prevPacientes.some(
          (paciente) => paciente.claveconsulta === data.claveConsulta
        );
        if (!existe) {
          return [...prevPacientes, data].sort(
            (a, b) => new Date(a.fechaconsulta) - new Date(b.fechaconsulta)
          );
        }
        return prevPacientes;
      });
    });

    //* Escuchar eventos de actualización de estatus
    channel.bind("estatus-actualizado", (data) => {
      console.log("Actualización de estatus recibida:", data);

      setPacientes((prevPacientes) => {
        // Filtrar si la consulta cambia de estado y ya no pertenece a la lista de espera
        if (
          data.clavestatus === 3 ||
          data.clavestatus === 4 ||
          data.clavestatus === 2
        ) {
          return prevPacientes.filter(
            (paciente) => paciente.claveconsulta !== data.claveConsulta
          );
        }

        // Si es un paciente en espera actualizado, modificar su estado
        const index = prevPacientes.findIndex(
          (paciente) => paciente.claveconsulta === data.claveConsulta
        );
        if (index !== -1) {
          const actualizados = [...prevPacientes];
          actualizados[index] = { ...actualizados[index], ...data };
          return actualizados;
        }

        return prevPacientes;
      });
    });

    //* Limpieza al desmontar el componente
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [cargarPacientesDelDia]);

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
              Agregar Paciente
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-30 rounded-full animate-pulse-neon" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 transition-all duration-500 neon-hover" />
          </button>
        </div>
      </div>

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
          <AtendiendoActualmente data={atendiendoActualmente} />
        </div>
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

                {patientData.grupoNomina === "NS" && (
                  <div className="md:ml-auto mt-4 md:mt-0 p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg shadow-lg flex flex-col items-center md:items-end text-right text-white">
                    <p className="text-md font-bold text-yellow-400">
                      <span className="block">SINDICALIZADO</span>
                    </p>
                    <p className="text-sm md:text-md">
                      Sindicato:{" "}
                      <span className="font-semibold">
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

              <div className="mt-6">
                <h3 className="text-xl md:text-2xl font-bold mb-4">
                  Signos Vitales
                </h3>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    T/A:
                    <input
                      type="text"
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
