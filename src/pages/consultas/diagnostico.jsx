/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Image from "next/image";
import Pusher from "pusher-js";
import withReactContent from "sweetalert2-react-content";
import DatosAdicionales from "./datos-adicionales/datos-adicionales";
import Cookies from "js-cookie"; 


const MySwal = withReactContent(Swal);

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

const Diagnostico = () => {
  const [nombreMedico, setNombreMedico] = useState("Cargando...");
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

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [formularioCompleto, setFormularioCompleto] = useState(false);


   //* Leer nombre del médico desde las cookies
   useEffect(() => {
    const nombre = Cookies.get("nombreusuario"); //* Obtén el valor desde las cookies
    console.log("Nombre del médico desde cookies:", nombre);
    setNombreMedico(nombre || "No especificado");
  }, []);



  //* Verifica si todos los campos requeridos están completos
  useEffect(() => {
    const verificarFormularioCompleto = () => {
      const camposRequeridosLlenos =
        claveConsulta &&
        diagnostico &&
        motivoConsulta &&
        signosVitales.ta &&
        signosVitales.temperatura;
      const paseEspecialidadCompleto =
        pasarEspecialidad === "no" ||
        (pasarEspecialidad === "si" &&
          especialidadSeleccionada &&
          observaciones);

      setFormularioCompleto(camposRequeridosLlenos && paseEspecialidadCompleto);
    };

    verificarFormularioCompleto();
  }, [
    claveConsulta,
    diagnostico,
    motivoConsulta,
    signosVitales,
    pasarEspecialidad,
    especialidadSeleccionada,
    observaciones,
  ]);

  //* Recarga la lista de pacientes al cargar la página o al actualizar datos
  useEffect(() => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;
    setFecha(formattedDate);
    cargarPacientesDelDia();
  }, []);

  //* Actualiza clavestatus a 3 solo si la consulta no ha sido guardada al recargar o cerrar
  useEffect(() => {
    const updateStatusOnUnload = () => {
      if (
        claveConsulta &&
        localStorage.getItem("consultaGuardada") !== claveConsulta
      ) {
        fetch("/api/pacientes-consultas/actualizarClavestatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claveConsulta, clavestatus: 3 }),
        });
      }
    };

    window.addEventListener("beforeunload", updateStatusOnUnload);
    return () => {
      window.removeEventListener("beforeunload", updateStatusOnUnload);
    };
  }, [claveConsulta]);

  //* Actualiza clavestatus a 3 si el usuario regresa a una ventana anterior sin guardar, solo si no se ha guardado exitosamente
  useEffect(() => {
    const updateStatusIfNotSaved = async () => {
      if (pacienteSeleccionado && !guardadoExitoso) {
        await fetch("/api/pacientes-consultas/actualizarClavestatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta,
            clavestatus: 3,
          }),
        });
      }
    };

    return () => {
      updateStatusIfNotSaved();
    };
  }, [pacienteSeleccionado, guardadoExitoso, claveConsulta]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe("consultas");

    //* Escucha de eventos
    channel.bind("nueva-consulta", (data) => {
      console.log("[INFO] Nueva consulta recibida de Pusher:", data);
      setPacientes((prevPacientes) => [...prevPacientes, data]);
    });

    channel.bind("estatus-actualizado", (data) => {
      console.log("[INFO] Estatus actualizado recibido de Pusher:", data);
      setPacientes((prevPacientes) => {
        //* Filtra la consulta si está cancelada o finalizada
        if (data.clavestatus === 3 || data.clavestatus === 4) {
          return prevPacientes.filter(
            (paciente) => paciente.claveconsulta !== data.claveConsulta
          );
        }

        //* Actualiza la consulta si ya existe
        const index = prevPacientes.findIndex(
          (paciente) => paciente.claveconsulta === data.claveConsulta
        );
        if (index !== -1) {
          const updatedPacientes = [...prevPacientes];
          updatedPacientes[index] = { ...prevPacientes[index], ...data };
          return updatedPacientes;
        }

        return prevPacientes;
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  //* Función para cargar pacientes del día
  const cargarPacientesDelDia = async () => {
    try {
      const response = await fetch("/api/pacientes-consultas/consultasHoy");
      const data = await response.json();
      if (response.ok) {
        const pacientesOrdenados = data.consultas.sort(
          (a, b) => new Date(a.fechaconsulta) - new Date(b.fechaconsulta)
        );
        setPacientes(pacientesOrdenados);
      } else {
        console.error("Error al cargar consultas del día:", data.message);
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al cargar pacientes</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo cargar la información. Inténtalo nuevamente.</p>",
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
    } catch (error) {
      console.error("Error al cargar consultas del día:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al cargar pacientes</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>No se pudo cargar la información. Inténtalo nuevamente.</p>",
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

  const obtenerDatosEmpleado = async (num_nom) => {
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmpleadoData({
          nombreCompleto: `${data.nombre} ${data.a_paterno} ${data.a_materno}`,
          departamento: data.departamento,
        });
      } else {
        console.error(
          "Error al obtener datos del empleado:",
          await response.json()
        );
        MySwal.fire({
          icon: "error",
          title:
            "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al obtener datos</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al obtener los datos del empleado. Inténtalo nuevamente más tarde.</p>",
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
    } catch (error) {
      console.error("Error al conectar con el servicio de empleado:", error);
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error en el servicio de empleado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al obtener datos del empleado. Inténtalo nuevamente más tarde.</p>",
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

  const handlePacienteClick = async (paciente) => {
    setPacienteSeleccionado(paciente);
    setMostrarEmergente(true);
    setClaveConsulta(paciente.claveconsulta);

    //* Establecer los signos vitales del paciente
    setSignosVitales({
      ta: paciente.presionarterialpaciente || "",
      temperatura: paciente.temperaturapaciente || "",
      fc: paciente.pulsosxminutopaciente || "",
      oxigenacion: paciente.respiracionpaciente || "",
      altura: paciente.estaturapaciente || "",
      peso: paciente.pesopaciente || "",
      glucosa: paciente.glucosapaciente || "",
    });

    //* Establecer alergias y datos editados
    setAlergias(paciente.alergias || "");
    setDatosEditados({
      signosVitales: {
        ta: paciente.presionarterialpaciente || "",
        temperatura: paciente.temperaturapaciente || "",
        fc: paciente.pulsosxminutopaciente || "",
        oxigenacion: paciente.respiracionpaciente || "",
        altura: paciente.estaturapaciente || "",
        peso: paciente.pesopaciente || "",
        glucosa: paciente.glucosapaciente || "",
      },
      alergias: paciente.alergias || "",
    });

    //* Establecer el tipo de consulta (beneficiario o empleado)
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

    //* Obtener datos del empleado
    await obtenerDatosEmpleado(paciente.clavenomina);

    //* Cambiar el clavestatus del paciente a 2 (seleccionado)
    try {
      const response = await fetch(
        "/api/pacientes-consultas/actualizarClavestatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta: paciente.claveconsulta,
            clavestatus: 2,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar clavestatus.");
      }

      //* Actualizar la lista de pacientes en tiempo real sin recargar
      setPacientes((prevPacientes) =>
        prevPacientes.map((p) =>
          p.claveconsulta === paciente.claveconsulta
            ? { ...p, clavestatus: 2 }
            : p
        )
      );
    } catch (error) {
      console.error(
        "Error al actualizar clavestatus al seleccionar paciente:",
        error
      );

      //! Mostrar mensaje de error al usuario
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al seleccionar paciente</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Ocurrió un problema al seleccionar el paciente. Inténtalo nuevamente.</p>",
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

  //* Función de guardado que actualiza clavestatus a 4 solo al guardar exitosamente
  const handleGuardar = async () => {
    const datos = recolectarDatos();

    try {
      //* Guardar diagnóstico y observaciones
      const responseDiagnostico = await fetch(
        "/api/pacientes-consultas/diagnostico_observaciones",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta: datos.claveConsulta,
            diagnostico: datos.diagnostico,
            motivoconsulta: datos.motivoConsulta,
            observaciones: datos.observaciones,
          }),
        }
      );

      if (!responseDiagnostico.ok) {
        const error = await responseDiagnostico.json();
        console.error("Error al guardar diagnóstico:", error);
        throw new Error("Error al guardar diagnóstico.");
      }

      //* Guardar pase a especialidad si es necesario
      if (datos.pasarEspecialidad === "si") {
        const responseEspecialidad = await fetch(
          "/api/especialidades/guardarEspecialidad",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              claveConsulta: datos.claveConsulta,
              claveEspecialidad: datos.especialidadSeleccionada,
              observaciones: datos.observaciones,
            }),
          }
        );

        if (!responseEspecialidad.ok) {
          const error = await responseEspecialidad.json();
          console.error("Error al guardar especialidad:", error);
          throw new Error("Error al guardar especialidad.");
        }
      }

      //* Actualizar el clavestatus a 4
      const responseStatus = await fetch(
        "/api/pacientes-consultas/actualizarClavestatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claveConsulta: datos.claveConsulta,
            clavestatus: 4,
          }),
        }
      );

      if (!responseStatus.ok) {
        const error = await responseStatus.json();
        console.error("Error al actualizar clavestatus:", error);
        throw new Error("Error al actualizar clavestatus.");
      }

      //* Confirmar éxito en localStorage y recargar lista de pacientes
      localStorage.setItem("consultaGuardada", datos.claveConsulta);
      setGuardadoExitoso(true); //* Establece guardado exitoso antes de recargar
      await cargarPacientesDelDia();

      //* Mostrar alerta de éxito
      await MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Guardado exitoso</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La consulta se ha guardado exitosamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });

      //! Resetear estados después de mostrar éxito
      setPacienteSeleccionado(null);
    } catch (error) {
      console.error("Error en la solicitud de guardado:", error);

      //! Mostrar alerta de error
      await MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al guardar</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un problema al guardar la consulta. Inténtalo nuevamente.</p>",
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

  const handleCancelar = async () => {
    try {
      //* Actualiza en la base de datos clavestatus a 3 y limpia otros campos
      await fetch("/api/pacientes-consultas/actualizarClavestatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claveConsulta,
          clavestatus: 3,
        }),
      });

      //* Limpiar los datos de la consulta en el frontend
      setDiagnostico("");
      setMotivoConsulta("");
      setSignosVitales({
        ta: "",
        temperatura: "",
        fc: "",
        oxigenacion: "",
        altura: "",
        peso: "",
        glucosa: "",
      });
      setAlergias("");
      setObservaciones("");
      setEspecialidadSeleccionada("");
      setPasarEspecialidad(null);
      setEmpleadoData(null);
      setDatosEditados({
        signosVitales: {},
        alergias: "",
      });

      //* Cierra el formulario emergente y muestra solo la tabla
      setPacienteSeleccionado(null);
      setMostrarEmergente(false);

      //* Refresca la lista de pacientes después de cerrar el formulario
      await cargarPacientesDelDia();

      //* Alerta de éxito
      MySwal.fire({
        icon: "info",
        title:
          "<span style='color: #00bcd4; font-weight: bold; font-size: 1.5em;'>ℹ️ Consulta cancelada</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Consulta cancelada y datos borrados correctamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00bcd4",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-blue-600 shadow-[0px_0px_20px_5px_rgba(0,188,212,0.9)] rounded-lg",
        },
      });
    } catch (error) {
      console.error("Error al cancelar y borrar datos de la consulta:", error);

      //* Alerta de error
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error al cancelar</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>Hubo un error al cancelar la consulta. Inténtalo nuevamente.</p>",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black text-white px-4 py-8 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/consulta.png"
            alt="Consulta Icono"
            width={150}
            height={150}
            className="h-24 w-24 md:h-36 md:w-36"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold">
            Consulta General
          </h1>
        </div>
       <div className="text-sm md:text-lg mt-4 md:mt-0">
          <span className="font-semibold">Médico: </span>
          {nombreMedico}
        </div>
      </div>

      <div className="mb-8 w-full overflow-x-auto p-6 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-yellow-300 tracking-wide">
          Pacientes En Espera
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
                  key={paciente.claveconsulta}
                  className={`bg-gray-700 bg-opacity-50 ${
                    index === 0
                      ? "hover:bg-gradient-to-r from-yellow-500 to-yellow-700 transition duration-300 ease-in-out cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  } rounded-lg shadow-md`}
                  onClick={() => {
                    if (index === 0) handlePacienteClick(paciente);
                  }}
                >
                  <td className="py-4 px-6 font-medium text-center text-gray-200">
                    {paciente.clavenomina || "N/A"}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-200">
                    {paciente.nombrepaciente || "No disponible"}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-200">
                    {paciente.edad || "Desconocida"}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-200">
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
                <span className="ml-1">{formatearFecha(fecha)}</span>
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
              <h2 className="text-md md:text-lg font-bold mb-2">
                Datos del Paciente
              </h2>
              <p>
                Paciente:{" "}
                {pacienteSeleccionado?.nombrepaciente || "No disponible"}
              </p>
              <p>Edad: {pacienteSeleccionado?.edad || "Desconocida"}</p>
              <p>
                Parentesco:{" "}
                {consultaSeleccionada === "beneficiario" && selectedBeneficiary
                  ? selectedBeneficiary.PARENTESCO_DESC
                  : "Empleado(a)"}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg flex-1 shadow-lg transition duration-300 hover:shadow-xl">
              <h2 className="text-md md:text-lg font-bold mb-2">
                Datos del Empleado
              </h2>
              <p>
                Nómina: {pacienteSeleccionado?.clavenomina || "No disponible"}
              </p>
              <p>
                Trabajador: {empleadoData?.nombreCompleto || "No disponible"}
              </p>
              <p>Departamento: {empleadoData?.departamento || "No asignado"}</p>
            </div>
          </div>

          <div className="mt-4 md:mt-6 mb-6 md:mb-12">
            <h3 className="text-lg md:text-2xl font-bold mb-4">
              Signos Vitales
            </h3>
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
            numeroDeNomina={pacienteSeleccionado?.clavenomina}
            nombrePaciente={pacienteSeleccionado?.nombrepaciente}
          />

          <div className="flex space-x-2 md:space-x-4 mt-4">
            <button
              onClick={handleGuardar}
              disabled={!formularioCompleto}
              className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold tracking-wide transition duration-300 ease-in-out transform ${
                formularioCompleto
                  ? "bg-green-500 hover:bg-green-600 hover:scale-105 text-white shadow-lg"
                  : "bg-gray-400 text-gray-300 cursor-not-allowed"
              }`}
            >
              Guardar
            </button>
            <button
              onClick={handleCancelar}
              className="px-4 py-2 md:px-6 md:py-3 bg-red-500 text-white rounded-lg font-semibold tracking-wide hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
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
