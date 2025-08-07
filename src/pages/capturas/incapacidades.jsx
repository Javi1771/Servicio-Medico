import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import {
  FaSearch,
  FaUserMd,
  FaUserTie,
  FaCalendarAlt,
  FaClipboardList,
  FaUserCircle,
  FaHeartbeat,
  FaIdBadge,
  FaBuilding,
  FaBriefcaseMedical,
  FaRegClock,
  FaSave,
  FaTimes,
} from "react-icons/fa";

//* Componentes de historial
import HistorialIncapacidadesTable from "./incapacidades/historial-incapacidades-captura";
import HistorialCompletoPage from "./incapacidades/historial-incapacidades-completo";

import { showCustomAlert } from "../../utils/alertas";

//* Calcula edad en años/meses/días
const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) {
    return { display: "0 años, 0 meses, 0 días", dbFormat: "0 años y 0 meses" };
  }

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

const CapturaIncapacidades = () => {
  const router = useRouter();
  const [folioConsulta, setFolioConsulta] = useState("");
  const [nomina, setNomina] = useState("");
  const [employeeData, setEmployeeData] = useState({});
  const [incapacidadData, setIncapacidadData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  //* Historial de incapacidades (tabla resumida)
  const [historialIncapacidades, setHistorialIncapacidades] = useState([]);

  //* Efecto visual (partículas)
  useEffect(() => {
    const createParticles = () => {
      const container = document.createElement("div");
      container.className =
        "absolute inset-0 overflow-hidden pointer-events-none";
      document.body.appendChild(container);
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement("div");
        particle.className =
          "absolute w-3 h-3 bg-cyan-400 rounded-full blur-lg opacity-75 animate-pulse";
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        container.appendChild(particle);
      }
    };
    createParticles();
  }, []);

  /*
   * Limpia todo el estado.
   */
  const limpiarFormulario = () => {
    setNomina("");
    setEmployeeData({});
    setIncapacidadData(null);
    setFolioConsulta("");
    setHistorialIncapacidades([]);
  };

  // ----------------------------------------------------------------
  //* Buscar la nómina a partir del folioConsulta
  // ----------------------------------------------------------------
  const fetchEmpleado = async () => {
    if (!folioConsulta) return;
    setIsLoading(true);
    try {
      //console.log("Enviando folio de consulta:", folioConsulta);
      const response = await fetch("/api/incapacidades/obtenerConsulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioConsulta }),
      });
      if (response.ok) {
        const data = await response.json();
        //console.log("✅ Respuesta de obtenerConsulta:", data);
        if (data.seAsignoIncapacidad === null) {
          await showCustomAlert(
            "info",
            "Incapacidad no asignada",
            "No se encontró una incapacidad asignada para el folio de consulta ingresado. ¿Desea asignar una nueva incapacidad?",
            "Asignar Incapacidad",
            {
              icon: "question",
              background: "linear-gradient(145deg, #004d40, #00251a)",
              showCancelButton: true,
              confirmButtonColor: "#00e676",
              cancelButtonColor: "#ff1744",
              cancelButtonText: "Cancelar",
              customClass: {
                popup:
                  "border border-cyan-400 shadow-[0_0_20px_5px_rgba(0,230,118,0.8)] rounded-lg",
              },
            }
          ).then((result) => {
            if (result.isConfirmed) {
              const encryptedClaveConsulta = btoa(folioConsulta.trim());
              router.push(
                `/capturas/incapacidades/nueva-incapacidad?claveconsulta=${encryptedClaveConsulta}`
              );
            } else {
              limpiarFormulario();
            }
            setIsLoading(false);
          });
          return;
        }
        const nominaObtenida = data.clavenomina;
        setNomina(nominaObtenida);
        const responseEmpleado = await fetch("/api/empleado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ num_nom: nominaObtenida }),
        });
        if (!responseEmpleado.ok) {
          throw new Error("Error al buscar la nómina del empleado.");
        }
        const empleadoData = await responseEmpleado.json();
        //console.log("✅ Datos del empleado:", empleadoData);
        if (!empleadoData || !empleadoData.nombre) {
          await showCustomAlert(
            "error",
            "Empleado no encontrado",
            "No se encontró un empleado con la nómina proporcionada. Verifica el número e intenta nuevamente.",
            "Aceptar"
          );

          limpiarFormulario();
          setIsLoading(false);
          return;
        }
        const edadCalculada = calcularEdad(empleadoData.fecha_nacimiento);
        const employeeInfo = {
          photo: "/user_icon_.png",
          name: `${empleadoData.nombre} ${empleadoData.a_paterno} ${empleadoData.a_materno}`,
          department: empleadoData.departamento || "Desconocido",
          workstation: empleadoData.puesto || "Desconocido",
          age: edadCalculada,
        };
        setEmployeeData(employeeInfo);
        fetchIncapacidad(nominaObtenida, folioConsulta);
        setIsLoading(false);
      } else {
        throw new Error("Error al buscar el folio de consulta.");
      }
    } catch (error) {
      console.error("Error en fetchEmpleado:", error);
      await showCustomAlert(
        "error",
        "Error al obtener información",
        "Hubo un error. Intenta nuevamente.",
        "Reintentar"
      );

      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  //* Buscar la incapacidad con /api/incapacidades/captura
  // ----------------------------------------------------------------
  const fetchIncapacidad = async (nomina, folioConsulta) => {
    if (!folioConsulta) {
      console.error("Folio de consulta no está definido.");
      return;
    }
    try {
      //console.log("🔍 Buscando incapacidad para:", nomina, folioConsulta);
      const bodyData = { noNomina: nomina, folioConsulta };
      const response = await fetch("/api/incapacidades/captura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) {
        throw new Error("No se encontró incapacidad (folio atendido).");
      }
      const data = await response.json();
      //console.log("✅ Respuesta de 'captura':", data);
      setIncapacidadData(data);
    } catch (error) {
      console.error("Error en fetchIncapacidad:", error);
      setIncapacidadData(null);
      await showCustomAlert(
        "warning",
        "Folio ya atendido",
        "El folio de consulta ya fue atendido. ¿Deseas ver el historial o regresar?",
        "Ver Historial"
      ).then((result) => {
        if (result.isDismissed) {
          limpiarFormulario();
        }
      });
    }
  };

  // ----------------------------------------------------------------
  //* Guardar la incapacidad
  // ----------------------------------------------------------------
  const guardarCaptura = async () => {
    setIsSaving(true);
    try {
      if (!incapacidadData) {
        throw new Error("No hay datos de incapacidad para guardar");
      }
      const payload = {
        fechaInicio: incapacidadData.fechaInicial,
        fechaFin: incapacidadData.fechaFinal,
        nomina,
        nombreEmpleado: employeeData.name,
        departamento: employeeData.department,
        observaciones: incapacidadData.diagnostico,
        edad: employeeData.age?.display,
        claveConsulta: incapacidadData.claveConsulta,
        claveMedico: incapacidadData.claveMedico,
      };
      //console.log("Enviando a /api/incapacidades/guardarCaptura:", payload);
      const response = await fetch("/api/incapacidades/guardarCaptura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Error al guardar la incapacidad");
      }
      await showCustomAlert(
        "success",
        "Incapacidad guardada",
        "La incapacidad se registró con éxito.",
        "Aceptar"
      ).then(() => {
        const encryptedClaveConsulta = btoa(folioConsulta.trim());
        router.push(
          `/capturas/incapacidades/ver-incapacidad?claveconsulta=${encryptedClaveConsulta}`
        );
      });
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar incapacidad:", error);
      await showCustomAlert(
        "error",
        "Error al guardar",
        "No se pudo completar el registro de la incapacidad.",
        "Reintentar"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------------------
  //* Cargar historial (si hay "nomina"), enviándola como clavenomina
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!nomina) {
      console.warn(
        "Falta 'clavenomina'. Evitando llamada a la API de historial."
      );
      setHistorialIncapacidades([]);
      return;
    }
    //console.log(`Cargando historial para clavenomina: ${nomina}`);
    const fetchHistorialIncapacidades = async () => {
      try {
        const queryParams = new URLSearchParams({ clavenomina: nomina });
        const response = await fetch(
          `/api/incapacidades/historialCaptura?${queryParams.toString()}`
        );
        if (!response.ok) {
          console.error("Error al cargar historial:", await response.text());
          setHistorialIncapacidades([]);
          return;
        }
        const data = await response.json();
        if (data && Array.isArray(data.historial)) {
          //console.log("Historial obtenido:", data.historial);
          setHistorialIncapacidades(data.historial);
        } else {
          console.warn("El historial no es un array válido:", data);
          setHistorialIncapacidades([]);
        }
      } catch (error) {
        console.error("Error inesperado al cargar historial:", error);
        setHistorialIncapacidades([]);
      }
    };
    fetchHistorialIncapacidades();
  }, [nomina]);

  const handleRegresar = () => {
    router.replace("/inicio-servicio-medico");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 text-white py-16 px-4 sm:px-20 flex flex-col items-center overflow-hidden">
      {/* Efecto de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="w-[500px] h-[500px] bg-gradient-to-r from-cyan-500/30 to-blue-600/20 rounded-full absolute -top-32 -left-32 blur-3xl animate-pulse" />
        <div className="w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/10 rounded-full absolute -bottom-64 -right-64 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-screen-2xl mx-auto bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)] p-12 border-2 border-cyan-400/50 relative z-10">
        {/* Encabezado */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="flex justify-start mb-12">
            <button
              onClick={handleRegresar}
              className="relative px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
            >
              ← Regresar
            </button>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
            <div className="flex items-center justify-center gap-4">
              <FaClipboardList className="text-cyan-400 text-6xl animate-pulse" />
              <span>Capturas de Incapacidades</span>
            </div>
          </h1>
          <p className="text-lg text-cyan-200 font-light italic">
            Sistema de Gestión Médica
          </p>
        </motion.div>

        {/* Buscador */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="group flex flex-wrap sm:flex-nowrap items-center gap-6 bg-gray-800/60 hover:bg-gray-800/80 transition-all p-6 rounded-2xl shadow-lg border border-cyan-400/20 hover:border-cyan-400/40 w-full"
        >
          <FaSearch className="text-cyan-400 text-3xl shrink-0 animate-bounce" />
          <input
            type="text"
            value={folioConsulta}
            onChange={(e) => setFolioConsulta(e.target.value.toUpperCase())}
            placeholder="Ingrese el Folio de Consulta"
            className="w-full bg-transparent text-xl placeholder-gray-400 focus:outline-none focus:ring-0 border-b-2 border-cyan-400/30 focus:border-cyan-400/60 transition-all"
          />
          <button
            onClick={fetchEmpleado}
            disabled={isLoading}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.5)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FaIdBadge className="text-xl" />
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </motion.div>

        {/* Mostrar Historial Completo solo si no se usa el buscador de folio */}
        {folioConsulta === "" && <HistorialCompletoPage />}

        {/* Información del Empleado */}
        {Object.keys(employeeData).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12 p-8 bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-yellow-500/30 hover:border-yellow-500/50 transition-all"
          >
            <h2 className="text-3xl font-bold text-yellow-400 mb-8 text-center flex items-center justify-center gap-3">
              <FaUserCircle className="text-4xl text-yellow-400 animate-pulse" />
              <span className="bg-gradient-to-r from-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Información del Empleado
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full blur-lg opacity-30 animate-pulse" />
                <Image
                  src={employeeData.photo || "/user_icon_.png"}
                  alt="Foto Empleado"
                  width={200}
                  height={200}
                  className="w-48 h-48 rounded-full border-4 border-yellow-400/50 object-cover hover:scale-105 transition-transform"
                />
              </div>
              <div className="space-y-4 text-lg">
                <p className="text-2xl font-bold text-yellow-300 flex items-center gap-2">
                  <FaBuilding className="text-amber-500" />
                  {employeeData.name || "Nombre del Empleado Desconocido"}
                </p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-cyan-200">
                    <FaBriefcaseMedical className="text-pink-400" />
                    <span className="font-semibold">Departamento:</span>
                    {employeeData.department || "Desconocido"}
                  </p>
                  <p className="flex items-center gap-2 text-cyan-200">
                    <FaUserTie className="text-emerald-400" />
                    <span className="font-semibold">Puesto:</span>
                    {employeeData.workstation || "Desconocido"}
                  </p>
                  <p className="flex items-center gap-2 text-cyan-200">
                    <FaRegClock className="text-purple-400" />
                    <span className="font-semibold">Edad:</span>
                    {employeeData.age?.display || "Desconocido"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Datos de la Incapacidad */}
        {incapacidadData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-12 p-8 bg-gradient-to-br from-red-900/40 to-pink-900/30 rounded-2xl shadow-xl border-2 border-red-500/30 hover:border-red-500/50 transition-all"
          >
            <h2 className="text-3xl font-bold text-red-400 mb-8 text-center flex items-center justify-center gap-3">
              <FaHeartbeat className="text-4xl text-red-500 animate-pulse" />
              <span className="bg-gradient-to-r from-red-400 to-pink-600 bg-clip-text text-transparent">
                Detalles de la Incapacidad
              </span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-lg">
              <div className="space-y-4">
                <p className="flex items-center gap-3 text-red-200">
                  <FaCalendarAlt className="text-2xl text-cyan-400" />
                  <span className="font-semibold">Inicio:</span>
                  <span className="text-red-300">
                    {incapacidadData.fechaInicialFormato || "No disponible"}
                  </span>
                </p>
                <p className="flex items-center gap-3 text-red-200">
                  <FaCalendarAlt className="text-2xl text-cyan-400" />
                  <span className="font-semibold">Fin:</span>
                  <span className="text-red-300">
                    {incapacidadData.fechaFinalFormato || "No disponible"}
                  </span>
                </p>
              </div>
              <div className="space-y-4">
                <p className="flex items-center gap-3 text-red-200">
                  <FaUserMd className="text-2xl text-emerald-400" />
                  <span className="font-semibold">Médico:</span>
                  <span className="text-red-300">
                    {incapacidadData.medico || "No disponible"}
                  </span>
                </p>
                <p className="flex items-center gap-3 text-red-200">
                  <FaUserTie className="text-2xl text-purple-400" />
                  <span className="font-semibold">Diagnóstico:</span>
                  <span className="text-red-300">
                    {incapacidadData.diagnostico || "No disponible"}
                  </span>
                </p>
              </div>
            </div>
            <motion.div
              className="flex justify-end gap-4 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={limpiarFormulario}
                className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all flex items-center gap-2"
              >
                <FaTimes className="text-xl" />
                Volver
              </button>
              <button
                onClick={guardarCaptura}
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-500 to-cyan-600 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave className="text-xl" />
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Tabla de Historial Resumido */}
        {historialIncapacidades.length > 0 && (
          <HistorialIncapacidadesTable historial={historialIncapacidades} />
        )}
      </div>
    </div>
  );
};

export default CapturaIncapacidades;
