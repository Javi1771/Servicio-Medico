import React, { useEffect, useState, useRef } from "react";
import { Chart } from "chart.js";
import "chart.js/auto";
import { FaCalendarAlt } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Loader from "./Loader";

/**
 * parseDateString:
 *   Convierte las cadenas que vienen del backend en objetos Date,
 *   para mostrarlas en la gráfica. No ajusta zona horaria.
 *
 * Formatos esperados:
 *  - horas: "YYYY-MM-DD HH:00"
 *  - días:  "YYYY-MM-DD"
 *  - meses: "YYYY-MM"
 *  - años:  "YYYY"
 */
function parseDateString(key, interval) {
  if (!key) return null;
  let year, month, day, hour, minute;
  switch (interval) {
    case "horas": {
      const [datePart, timePart] = key.split(" ");
      if (!datePart || !timePart) return null;
      const [y, m, d] = datePart.split("-");
      [hour, minute] = timePart.split(":");
      year = parseInt(y, 10);
      month = parseInt(m, 10) - 1;
      day = parseInt(d, 10);
      hour = parseInt(hour, 10);
      minute = parseInt(minute, 10);
      return new Date(year, month, day, hour, minute);
    }
    case "días": {
      const [y, m, d] = key.split("-");
      year = parseInt(y, 10);
      month = parseInt(m, 10) - 1;
      day = parseInt(d, 10);
      return new Date(year, month, day);
    }
    case "meses": {
      const [y, m] = key.split("-");
      year = parseInt(y, 10);
      month = parseInt(m, 10) - 1;
      return new Date(year, month, 1);
    }
    case "años": {
      year = parseInt(key, 10);
      return new Date(year, 0, 1);
    }
    default:
      return null;
  }
}

function formatExactDBDate(dbDateStr) {
  const cleanStr = dbDateStr.replace(/\.\d+$/, ""); // Elimina milisegundos
  const match = cleanStr.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) return dbDateStr; // Si no coincide, retorna original

  const [, yyyy, mm, dd, HH, MM, SS] = match;
  return `${dd}/${mm}/${yyyy}, ${HH}:${MM}:${SS}`;
}

// SweetAlert + React
const MySwal = withReactContent(Swal);

export default function IntervalosDeConsultas() {
  // ESTADOS PRINCIPALES
  const [data, setData] = useState(null);
  const [interval, setInterval] = useState("días");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // Calendarios
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  // Estadísticas
  const [totalConsultas, setTotalConsultas] = useState(0);
  const [fechaMaxConsultas, setFechaMaxConsultas] = useState(null);

  // Loaders
  const [isLoading, setIsLoading] = useState(true); // Para datos de resumen
  const [isLoadingDetalles, setIsLoadingDetalles] = useState(false); // Para detalles

  // Tabla de Detalles
  const [detalles, setDetalles] = useState([]);

  // Chart
  const chartRef = useRef(null);

  // Mapeo (español => inglés)
  const intervalMap = {
    horas: "hours",
    días: "days",
    meses: "months",
    años: "years",
  };

  // Deshabilita fechas futuras
  const disableFutureDates = (date) => date > new Date();

  // Manejadores de Fecha
  const handleStartDateChange = (date) => {
    if (date <= endDate) {
      setStartDate(date);
    } else {
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Fecha inválida</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La fecha inicial no puede ser después de la fecha final.</p>",
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

  const handleEndDateChange = (date) => {
    if (date >= startDate) {
      setEndDate(date);
    } else {
      MySwal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Fecha inválida</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La fecha final no puede ser antes de la fecha inicial.</p>",
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

  // Carga inicial (resumen)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const resp = await fetch("/api/estadisticas/intervaloConsultas");
        const json = await resp.json();
        setData(json);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar data en base a startDate y endDate
  const filterDataByDateRange = (originalData, startDate, endDate) => {
    const filtered = {};
    for (const [key, value] of Object.entries(originalData)) {
      const date = parseDateString(key, interval);
      if (!date) continue;
      if (interval === "horas") {
        // "horas" => sólo del mismo día
        if (
          date.getFullYear() === startDate.getFullYear() &&
          date.getMonth() === startDate.getMonth() &&
          date.getDate() === startDate.getDate()
        ) {
          filtered[key] = value;
        }
      } else {
        if (date >= startDate && date <= endDate) {
          filtered[key] = value;
        }
      }
    }
    // Ordenar
    const sorted = Object.entries(filtered).sort(([a], [b]) => {
      const dA = parseDateString(a, interval);
      const dB = parseDateString(b, interval);
      return dA - dB;
    });
    return Object.fromEntries(sorted);
  };

  // Actualiza estadísticas (total, fechaMaxConsultas)
  const updateStatistics = (filteredData) => {
    const total = Object.values(filteredData).reduce((acc, x) => acc + x, 0);
    setTotalConsultas(total);

    if (Object.values(filteredData).length === 0) {
      setFechaMaxConsultas(null);
      return;
    }
    const maxConsultas = Math.max(...Object.values(filteredData));
    const maxTimes = Object.keys(filteredData).filter(
      (k) => filteredData[k] === maxConsultas
    );

    if (maxTimes.length > 0) {
      const formatted = maxTimes.map((t) => {
        const d = parseDateString(t, interval);
        if (!d) return t;
        if (interval === "horas") {
          return d.toLocaleString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } else {
          return d.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      });
      setFechaMaxConsultas(formatted.join(", "));
    } else {
      setFechaMaxConsultas(null);
    }
  };

  // Para "Meses": ajustar fin de mes
  const handleMonthlyCalendar = () => {
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(
      newStartDate.getFullYear(),
      newStartDate.getMonth() + 1,
      0
    );
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Construir rango para infoConsultas
  const buildDateRange = (label, interval) => {
    const parsed = parseDateString(label, interval);
    if (!parsed) return null;

    let start, end;
    if (interval === "horas") {
      const sd = new Date(parsed);
      const ed = new Date(parsed);
      ed.setMinutes(59);
      ed.setSeconds(59);

      // Mantener las fechas en hora local
      start = `${sd.getFullYear()}-${(sd.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${sd.getDate().toString().padStart(2, "0")} ${sd
        .getHours()
        .toString()
        .padStart(2, "0")}:${sd.getMinutes().toString().padStart(2, "0")}:${sd
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;

      end = `${ed.getFullYear()}-${(ed.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${ed.getDate().toString().padStart(2, "0")} ${ed
        .getHours()
        .toString()
        .padStart(2, "0")}:${ed.getMinutes().toString().padStart(2, "0")}:${ed
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    } else if (interval === "días") {
      const sd = new Date(parsed);
      sd.setHours(0, 0, 0, 0);
      const ed = new Date(parsed);
      ed.setHours(23, 59, 59, 999);

      start = `${sd.getFullYear()}-${(sd.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${sd.getDate().toString().padStart(2, "0")} ${sd
        .getHours()
        .toString()
        .padStart(2, "0")}:${sd.getMinutes().toString().padStart(2, "0")}:${sd
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;

      end = `${ed.getFullYear()}-${(ed.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${ed.getDate().toString().padStart(2, "0")} ${ed
        .getHours()
        .toString()
        .padStart(2, "0")}:${ed.getMinutes().toString().padStart(2, "0")}:${ed
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
    }
    return { start, end };
  };

  // Efecto para construir/actualizar la gráfica
  useEffect(() => {
    if (!data || !data[intervalMap[interval]]) return;
    const ctx = document.getElementById("consultasChart").getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const filteredData = filterDataByDateRange(
      data[intervalMap[interval]],
      startDate,
      endDate
    );
    updateStatistics(filteredData);

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(filteredData),
        datasets: [
          {
            label: "Consultas",
            data: Object.values(filteredData),
            borderColor: "rgba(38, 166, 154, 1)",
            backgroundColor: "rgba(38, 166, 154, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointBackgroundColor: "rgba(255, 255, 255, 1)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: async (evt, elements) => {
          if (!elements.length) return;
          const index = elements[0].index;
          const label = chartRef.current.data.labels[index];
          const range = buildDateRange(label, interval);
          if (!range) return;

          setIsLoadingDetalles(true);
          setDetalles([]);
          try {
            const url = `/api/estadisticas/infoConsultas?start=${range.start}&end=${range.end}`;
            const resp = await fetch(url);
            const json = await resp.json();
            setDetalles(json.detalles || []);
          } catch (err) {
            console.error("Error al cargar detalles:", err);
          } finally {
            setIsLoadingDetalles(false);
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#FFFFFF",
              font: { size: 14, weight: "bold" },
            },
          },
          tooltip: {
            backgroundColor: "rgba(20, 20, 40, 0.9)",
            titleColor: "#00FFC6",
            bodyColor: "#FFFFFF",
            titleFont: { size: 16, weight: "bold" },
            bodyFont: { size: 14 },
            borderWidth: 2,
            borderColor: "#00FFC6",
            padding: 12,
            intersect: false,
            mode: "index",
            callbacks: {
              title: (context) => {
                const rawKey = context[0].label;
                const parsed = parseDateString(rawKey, interval);
                if (!parsed) return rawKey;
                if (interval === "horas") {
                  // Muestra en tooltip (ej: 07:00 => 07:59) en local time
                  return parsed.toLocaleString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } else {
                  return parsed.toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                }
              },
              label: (context) => `Consultas: ${context.raw}`,
            },
          },
        },
        layout: {
          padding: { top: 20, bottom: 20, left: 10, right: 10 },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              lineWidth: 1,
            },
            title: {
              display: true,
              text: "Intervalos de Tiempo",
              color: "#FFFFFF",
              font: { size: 16, weight: "bold" },
            },
            ticks: {
              color: "#FFFFFF",
              font: { size: 12 },
              maxRotation: 45,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              lineWidth: 1,
            },
            title: {
              display: true,
              text: "Número de Consultas",
              color: "#FFFFFF",
              font: { size: 16, weight: "bold" },
            },
            ticks: {
              color: "#FFFFFF",
              font: { size: 12 },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, interval, startDate, endDate]);

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-gray-800 via-black to-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-extrabold mb-6 text-teal-500">
        Intervalos de Consultas
      </h1>

      {/* Loader principal si isLoading */}
      {isLoading ? (
        
  <Loader text="CARGANDO..." size={150} duration={5000} />
) : (
        <>
          {/* Botones de Intervalo */}
          <div className="flex space-x-4 mb-6">
            {["Horas", "Días", "Meses", "Años"].map((int) => (
              <button
                key={int}
                onClick={() => {
                  setInterval(int.toLowerCase());
                  if (int === "Meses") handleMonthlyCalendar();
                }}
                className={`px-6 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 ${
                  interval === int.toLowerCase()
                    ? "bg-teal-500 text-black hover:bg-teal-400"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                }`}
              >
                {int}
              </button>
            ))}
          </div>

          {/* Calendarios */}
          <div className="flex space-x-4 items-center mb-6">
            {/* Fecha Inicial */}
            <div className="mb-6">
              <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
                Fecha Inicial:
              </label>
              <div className="relative">
                <div
                  className="flex items-center bg-gradient-to-r from-pink-800 via-pink-900 to-pink-800 rounded-lg p-4 shadow-lg cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setIsStartCalendarOpen(!isStartCalendarOpen);
                    setIsEndCalendarOpen(false);
                  }}
                >
                  <FaCalendarAlt className="text-pink-300 mr-4" size={28} />
                  <span className="text-pink-100 font-medium">
                    {startDate
                      ? startDate.toLocaleDateString("es-ES")
                      : "📅 Selecciona fecha"}
                  </span>
                </div>
                {isStartCalendarOpen && (
                  <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-800 via-black to-gray-900 p-6 rounded-3xl shadow-lg ring-2 ring-pink-500">
                    <Calendar
                      onChange={(date) => {
                        handleStartDateChange(date);
                        setIsStartCalendarOpen(false);
                      }}
                      value={startDate}
                      tileDisabled={({ date }) => disableFutureDates(date)}
                      className="bg-gradient-to-br from-gray-800 via-black to-gray-900 rounded-lg text-black 
                                 [&_.react-calendar__tile]:text-black
                                 [&_.react-calendar__tile--now]:bg-yellow-300
                                 [&_.react-calendar__tile--active]:bg-pink-500
                                 [&_.react-calendar__tile--active]:text-black"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Fecha Final (no para "horas") */}
            {interval !== "horas" && (
              <div className="mb-6">
                <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
                  Fecha Final:
                </label>
                <div className="relative">
                  <div
                    className="flex items-center bg-gradient-to-r from-pink-800 via-pink-900 to-pink-800 rounded-lg p-4 shadow-lg cursor-pointer hover:scale-105 transition-all"
                    onClick={() => {
                      setIsEndCalendarOpen(!isEndCalendarOpen);
                      setIsStartCalendarOpen(false);
                    }}
                  >
                    <FaCalendarAlt className="text-pink-300 mr-4" size={28} />
                    <span className="text-pink-100 font-medium">
                      {endDate
                        ? endDate.toLocaleDateString("es-ES")
                        : "📅 Selecciona fecha"}
                    </span>
                  </div>
                  {isEndCalendarOpen && (
                    <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-800 via-black to-gray-900 p-6 rounded-3xl shadow-lg ring-2 ring-pink-500">
                      <Calendar
                        onChange={(date) => {
                          handleEndDateChange(date);
                          setIsEndCalendarOpen(false);
                        }}
                        value={endDate}
                        tileDisabled={({ date }) => disableFutureDates(date)}
                        className="bg-gradient-to-br from-gray-800 via-black to-gray-900 
                                   rounded-lg text-black
                                   [&_.react-calendar__tile]:text-black
                                   [&_.react-calendar__tile--now]:bg-yellow-300
                                   [&_.react-calendar__tile--active]:bg-pink-500
                                   [&_.react-calendar__tile--active]:text-black"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="flex flex-col items-center mb-6 text-gray-200">
            <p className="text-lg font-bold">
              Consultas Totales:{" "}
              <span className="text-teal-400">{totalConsultas}</span>
            </p>
            {fechaMaxConsultas && (
              <p className="text-lg font-bold">
                {interval === "horas" ? "Hora(s)" : "Fecha(s)"} con Más
                Consultas:{" "}
                <span className="text-teal-400">{fechaMaxConsultas}</span>
              </p>
            )}
          </div>

          {/* Gráfico */}
          <div className="relative w-full max-w-7xl h-[600px] shadow-2xl rounded-lg overflow-hidden">
            {data &&
            data[intervalMap[interval]] &&
            Object.keys(data[intervalMap[interval]]).length > 0 ? (
              <canvas id="consultasChart"></canvas>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No hay datos disponibles para el intervalo seleccionado.
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="w-full max-w-7xl mt-8 bg-gray-800 p-4 rounded-lg">
            <h2 className="text-2xl font-bold text-teal-400 mb-4">
              Detalles de las Consultas
            </h2>

            {/* Loader secundario si isLoadingDetalles */}
            {isLoadingDetalles ? (
  <Loader text="Obteniendo Detalles..." size={150} duration={5000} />
) : detalles.length > 0 ? (
              <table className="w-full table-auto border-collapse bg-gray-700">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="px-4 py-2 text-left text-teal-400">Fecha</th>
                    <th className="px-4 py-2 text-left text-teal-400">Clave</th>
                    <th className="px-4 py-2 text-left text-teal-400">
                      Paciente
                    </th>
                    <th className="px-4 py-2 text-left text-teal-400">
                      Motivo
                    </th>
                    <th className="px-4 py-2 text-left text-teal-400">
                      Diagnóstico
                    </th>
                    <th className="px-4 py-2 text-left text-teal-400">
                      Departamento
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((det, idx) => {
                    const fechaStr = formatExactDBDate(det.fechaconsulta); // Usa la nueva función
                    return (
                      <tr
                        key={`${det.claveconsulta}-${det.fechaconsulta}-${idx}`}
                        className="border-b border-gray-600"
                      >
                        <td className="px-4 py-2">{fechaStr}</td>
                        <td className="px-4 py-2">{det.claveconsulta}</td>
                        <td className="px-4 py-2">{det.nombrepaciente}</td>
                        <td className="px-4 py-2">{det.motivoconsulta}</td>
                        <td className="px-4 py-2">{det.diagnostico}</td>
                        <td className="px-4 py-2">{det.departamento}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-300">No hay detalles para mostrar.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
