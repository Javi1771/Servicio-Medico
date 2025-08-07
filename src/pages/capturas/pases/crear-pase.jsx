/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  FaCalendarAlt,
  FaUser,
  FaIdCard,
  FaBirthdayCake,
  FaUsers,
} from "react-icons/fa";
import Calendar from "react-calendar";
import { showCustomAlert } from "../../utils/alertas";
import "react-calendar/dist/Calendar.css";
import Image from "next/image";

const safeDecodeBase64 = (str) => {
  try {
    return atob(str);
  } catch (error) {
    console.error("Error al decodificar Base64:", error);
    return null;
  }
};

const CrearPase = () => {
  const router = useRouter();
  const encryptedFolio = router.query.folio || router.query.claveconsulta;
  const folio = encryptedFolio ? safeDecodeBase64(encryptedFolio) : null;

  const [data, setData] = useState({});
  const [selectedEspecialista, setSelectedEspecialista] = useState(null);
  const [fechaCita, setFechaCita] = useState(null);
  const [isFechaCitaOpen, setIsFechaCitaOpen] = useState(false);

  //* Fetch de datos con useCallback
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/especialidades/obtenerConsultaEspecialidad?folio=${folio}`
      );
      if (!res.ok) throw new Error(`Error al cargar datos: ${res.statusText}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      await showCustomAlert(
        "error",
        "Error al cargar datos",
        "No se pudieron cargar los datos. Intenta nuevamente más tarde.",
        "Aceptar"
      );
    }
  }, [folio]);

  useEffect(() => {
    if (folio) fetchData();
  }, [folio, fetchData]);

  const handleGuardar = async () => {
    if (!selectedEspecialista || !fechaCita) {
      await showCustomAlert(
        "warning",
        "Faltan Datos",
        "Por favor selecciona un especialista y una fecha antes de guardar.",
        "Aceptar"
      );

      return;
    }

    //* Ajustar fecha a la zona horaria local
    const adjustedFechaCita = new Date(
      fechaCita.getTime() - fechaCita.getTimezoneOffset() * 60000
    ).toISOString();

    const body = {
      clavenomina: data.paciente?.clavenomina,
      clavepaciente: data.paciente?.clavepaciente,
      nombrepaciente: data.paciente?.nombrepaciente,
      edad: data.paciente?.edad,
      claveespecialidad: data.especialidad?.claveespecialidad,
      especialidadinterconsulta: data.especialidad?.especialidad,
      claveproveedor: selectedEspecialista?.claveproveedor,
      costo: selectedEspecialista?.costo,
      fechacita: adjustedFechaCita,
      sindicato: data.paciente?.sindicato,
      clavestatus: 2,
      elpacienteesempleado: data.paciente?.elpacienteesempleado,
      parentesco: data.paciente?.parentesco,
      departamento: data.paciente?.departamento,
      folio,
    };

    //console.log("📤 Datos enviados al backend:", body);

    try {
      const res = await fetch("/api/especialidades/insertarPase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const response = await res.json();
        //console.log("✅ Respuesta del servidor:", response);

        await showCustomAlert(
          "success",
          "Pase Guardado",
          "El pase se ha guardado correctamente.",
          "Aceptar"
        );

        //* Extraer y cifrar la claveconsulta recibida desde el backend
        const encryptedClaveConsulta = btoa(response.claveconsulta.toString());

        //* Navegar a la otra pantalla enviando la claveconsulta cifrada
        router.push(
          `/capturas/recetas/ver-recetas-pases?claveconsulta=${encryptedClaveConsulta}`
        );
      } else {
        const errorResponse = await res.json();
        console.error("❌ Error en la respuesta del servidor:", errorResponse);
        throw new Error(errorResponse.error || "Error en el servidor");
      }
    } catch (error) {
      console.error("❌ Error al guardar el pase:", error.message);

      await showCustomAlert(
        "error",
        "Error al guardar",
        "No se pudo guardar el pase. Intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-blue-900 to-teal-500 text-white py-10 px-12">
      {/* Encabezado */}
      <h1 className="text-6xl font-extrabold text-center text-teal-300 mb-12 drop-shadow-lg">
        Dar Pase A Paciente
      </h1>

      {/* Información estática */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-3xl shadow-2xl mb-12 border border-teal-500">
        <div className="flex items-center space-x-8">
          {/* Imagen */}
          <Image
            src="/user_icon_.png"
            alt="Foto"
            width={140}
            height={140}
            className="rounded-full border-4 border-teal-300 shadow-lg"
          />

          {/* Datos */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Nombre */}
            <div className="flex items-center bg-gray-800 p-5 rounded-xl shadow-md border-2 border-transparent hover:border-teal-400 transition-all duration-300">
              <FaUser className="text-teal-400 text-3xl mr-4" />
              <div>
                <p className="text-teal-300 font-bold">Nombre</p>
                <p className="text-white">
                  {data.paciente?.nombrepaciente || "N/A"}
                </p>
              </div>
            </div>

            {/* Número de Nómina */}
            <div className="flex items-center bg-gray-800 p-5 rounded-xl shadow-md border-2 border-transparent hover:border-teal-400 transition-all duration-300">
              <FaIdCard className="text-teal-400 text-3xl mr-4" />
              <div>
                <p className="text-teal-300 font-bold">Número de Nómina</p>
                <p className="text-white">
                  {data.paciente?.clavenomina || "N/A"}
                </p>
              </div>
            </div>

            {/* Edad */}
            <div className="flex items-center bg-gray-800 p-5 rounded-xl shadow-md border-2 border-transparent hover:border-teal-400 transition-all duration-300">
              <FaBirthdayCake className="text-teal-400 text-3xl mr-4" />
              <div>
                <p className="text-teal-300 font-bold">Edad</p>
                <p className="text-white">{data.paciente?.edad || "N/A"}</p>
              </div>
            </div>

            {/* Parentesco */}
            <div className="flex items-center bg-gray-800 p-5 rounded-xl shadow-md border-2 border-transparent hover:border-teal-400 transition-all duration-300">
              <FaUsers className="text-teal-400 text-3xl mr-4" />
              <div>
                <p className="text-teal-300 font-bold">Parentesco</p>
                <p className="text-white">{data.parentesco || "Empleado"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección rellenable */}
      <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-teal-300 font-semibold mb-2">
              Especialidad:
            </label>
            <p className="bg-gray-700 p-4 rounded-md">
              {data.especialidad?.especialidad || "Seleccione una especialidad"}
            </p>
          </div>
          <div>
            <label className="block text-teal-300 font-semibold mb-2">
              Especialista:
            </label>
            <select
              className="w-full p-4 rounded-md bg-gray-800 text-white"
              onChange={(e) =>
                setSelectedEspecialista(JSON.parse(e.target.value))
              }
            >
              <option value="">Seleccione un especialista</option>
              {data.especialistas?.map((esp) => (
                <option key={esp.claveproveedor} value={JSON.stringify(esp)}>
                  {esp.nombreproveedor}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendario */}
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
                        let ampm = updatedDate.getHours() >= 12 ? "PM" : "AM";
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
        <div className="flex justify-center space-x-8 mt-12">
          {/* Botón Salir */}
          <button
            onClick={() => router.push("/capturas/pases-a-especialidades")}
            className="relative px-8 py-3 text-red-500 font-bold uppercase rounded-lg 
    bg-gray-900 border border-transparent 
    shadow-[0_0_20px_4px_rgba(255,0,0,0.7)] hover:shadow-[0_0_40px_8px_rgba(255,0,0,0.9)] 
    hover:text-white transition-all duration-300 ease-in-out group"
          >
            <span
              className="absolute inset-0 rounded-lg border-2 border-red-500 opacity-50 blur-lg group-hover:opacity-100 
      group-hover:blur-xl transition-all duration-500"
            ></span>
            <span className="relative z-10">Salir</span>
          </button>

          {/* Botón Guardar */}
          <button
            onClick={handleGuardar}
            className="relative px-8 py-3 text-green-400 font-bold uppercase rounded-lg 
    bg-gray-900 border border-transparent 
    shadow-[0_0_20px_4px_rgba(0,255,0,0.7)] hover:shadow-[0_0_40px_8px_rgba(0,255,0,0.9)] 
    hover:text-white transition-all duration-300 ease-in-out group"
          >
            <span
              className="absolute inset-0 rounded-lg border-2 border-green-500 opacity-50 blur-lg group-hover:opacity-100 
      group-hover:blur-xl transition-all duration-500"
            ></span>
            <span className="relative z-10">Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrearPase;
