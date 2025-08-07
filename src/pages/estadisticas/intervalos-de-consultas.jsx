/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { Chart } from "chart.js";
import "chart.js/auto";
import { FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { showCustomAlert } from "../../utils/alertas";
import Loader from "./Loaders/Loader-azul";
import { useRouter } from "next/router";

// ***** IMPORTAMOS PAGINATION DE MUI *****
import { Pagination } from "@mui/material";

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
  const cleanStr = dbDateStr.replace(/\.\d+$/, "");
  const match = cleanStr.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) return dbDateStr;

  const [, yyyy, mm, dd, HH, MM, SS] = match;
  return `${dd}/${mm}/${yyyy}, ${HH}:${MM}:${SS}`;
}

export default function IntervalosDeConsultas() {
  const router = useRouter();

  //* ESTADOS PRINCIPALES
  const [data, setData] = useState(null);
  const [interval, setInterval] = useState("días");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  //* Calendarios
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  //* Estadísticas
  const [totalConsultas, setTotalConsultas] = useState(0);
  const [fechaMaxConsultas, setFechaMaxConsultas] = useState(null);

  //* Loaders
  const [isLoading, setIsLoading] = useState(true); //* Para datos de resumen
  const [isLoadingDetalles, setIsLoadingDetalles] = useState(false); //* Para detalles

  //* Tabla de Detalles
  const [detalles, setDetalles] = useState([]);

  //* Paginación de la tabla
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  //* totalPages calculado en base a "detalles"
  const totalPages = Math.ceil(detalles.length / itemsPerPage);

  //* Datos que se mostrarán en la tabla según la página actual
  const currentData = detalles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  //* Chart
  const chartRef = useRef(null);

  //* Mapeo (español => inglés)
  const intervalMap = {
    horas: "hours",
    días: "days",
    meses: "months",
    años: "years",
  };

  //! Deshabilita fechas futuras
  const disableFutureDates = (date) => date > new Date();

  //* Manejadores de Fecha
  const handleStartDateChange = async (date) => {
    if (date <= endDate) {
      setStartDate(date);
    } else {
      await showCustomAlert(
        "error",
        "Fecha inválida",
        "La fecha inicial no puede ser después de la fecha final.",
        "Aceptar"
      );
    }
  };

  const handleEndDateChange = async (date) => {
    if (date >= startDate) {
      setEndDate(date);
    } else {
      await showCustomAlert(
        "error",
        "Fecha inválida",
        "La fecha final no puede ser antes de la fecha inicial.",
        "Aceptar"
      );
    }
  };

  //! --------- FORZAR 5 SEGUNDOS DE LOADER en la carga inicial ---------
  useEffect(() => {
    let finishedLoading = false;
    let minTimeReached = false;

    const fetchData = async () => {
      try {
        const resp = await fetch("/api/estadisticas/intervaloConsultas");
        const json = await resp.json();
        setData(json);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        finishedLoading = true;
        if (minTimeReached) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    //? Temporizador de 5 segundos
    const timer = setTimeout(() => {
      minTimeReached = true;
      if (finishedLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  //* Filtrar data en base a startDate y endDate
  const filterDataByDateRange = (originalData, startDate, endDate) => {
    const filtered = {};
    for (const [key, value] of Object.entries(originalData)) {
      const date = parseDateString(key, interval);
      if (!date) continue;
      if (interval === "horas") {
        //* "horas" => sólo del mismo día
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
    //* Ordenar por fecha ascendente
    const sorted = Object.entries(filtered).sort(([a], [b]) => {
      const dA = parseDateString(a, interval);
      const dB = parseDateString(b, interval);
      return dA - dB;
    });
    return Object.fromEntries(sorted);
  };

  //* Actualiza estadísticas (total, fechaMaxConsultas)
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

  //* Para "Meses": ajustar fin de mes
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

  const buildDateRange = (label, interval) => {
    const parsed = parseDateString(label, interval);
    if (!parsed) return null;

    let start, end;
    if (interval === "horas") {
      const sd = new Date(parsed);
      const ed = new Date(parsed);
      ed.setMinutes(59);
      ed.setSeconds(59);

      start = `${sd.getFullYear()}-${(sd.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${sd.getDate().toString().padStart(2, "0")} ${sd
        .getHours()
        .toString()
        .padStart(2, "0")}:00:00`;
      end = `${ed.getFullYear()}-${(ed.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${ed.getDate().toString().padStart(2, "0")} ${ed
        .getHours()
        .toString()
        .padStart(2, "0")}:59:59`;
    } else if (interval === "días") {
      const sd = new Date(parsed);
      sd.setHours(0, 0, 0, 0);
      const ed = new Date(parsed);
      ed.setHours(23, 59, 59, 999);

      start = `${sd.getFullYear()}-${(sd.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${sd
        .getDate()
        .toString()
        .padStart(2, "0")} 00:00:00`;
      end = `${ed.getFullYear()}-${(ed.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${ed
        .getDate()
        .toString()
        .padStart(2, "0")} 23:59:59`;
    } else if (interval === "meses") {
      const sd = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      const ed = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);

      start = `${sd.getFullYear()}-${(sd.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-01 00:00:00`;
      end = `${ed.getFullYear()}-${(ed.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${ed
        .getDate()
        .toString()
        .padStart(2, "0")} 23:59:59`;
    } else if (interval === "años") {
      const year = parsed.getFullYear();

      start = `${year}-01-01 00:00:00`;
      end = `${year}-12-31 23:59:59`;
    }

    return { start, end };
  };

  //* Efecto para construir/actualizar la gráfica
  useEffect(() => {
    if (!data || !data[intervalMap[interval]]) return;

    //? 1) Obtenemos el elemento <canvas>, si no existe aún, salimos.
    const canvasEl = document.getElementById("consultasChart");
    if (!canvasEl) return;

    //? 2) Destruimos el chart anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    //? 3) Obtenemos el context
    const ctx = canvasEl.getContext("2d");

    //* Filtramos data y actualizamos estadísticas
    const filteredData = filterDataByDateRange(
      data[intervalMap[interval]],
      startDate,
      endDate
    );
    updateStatistics(filteredData);

    //? 4) Creamos el nuevo chart y lo guardamos en chartRef
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
          setCurrentPage(1); //* Reiniciamos a la primera página al cargar nuevos detalles
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
                  //* Muestra en tooltip (ej: 07:00 => 07:59)
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

    //* Limpieza opcional en el return:
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, interval, startDate, endDate]);

  // ***** NUEVA FUNCIÓN para MUI Pagination *****
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleGoBack = () => {
    router.replace("/inicio-servicio-medico");
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-gray-800 via-black to-gray-900 text-white min-h-screen">
      {/* Botón arriba a la izquierda */}
      <div className="w-full flex justify-start mb-4">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transition-all duration-300"
        >
          <FaArrowLeft />
          <span className="hidden sm:inline">Regresar</span>
        </button>
      </div>

      {/* Título centrado */}
      <h1 className="text-4xl font-extrabold mb-6 text-teal-500 text-center">
        Intervalos de Consultas Generales
      </h1>

      {/* Loader principal si isLoading */}
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-[80vh]">
          <Loader size={120} />
        </div>
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
                  className="flex items-center bg-blue-800 rounded-lg p-4 shadow-lg cursor-pointer hover:scale-105 transition-all"
                  onClick={() => {
                    setIsStartCalendarOpen(!isStartCalendarOpen);
                    setIsEndCalendarOpen(false);
                  }}
                >
                  <FaCalendarAlt className="text-blue-300 mr-4" size={28} />
                  <span className="text-blue-100 font-medium">
                    {startDate
                      ? startDate.toLocaleDateString("es-ES")
                      : "📅 Selecciona fecha"}
                  </span>
                </div>
                {isStartCalendarOpen && (
                  <div className="absolute top-16 left-0 z-50 bg-blue-900 p-6 rounded-3xl shadow-lg ring-2 ring-blue-500">
                    <Calendar
                      onChange={(date) => {
                        handleStartDateChange(date);
                        setIsStartCalendarOpen(false);
                      }}
                      value={startDate}
                      tileDisabled={({ date }) => disableFutureDates(date)}
                      className="bg-blue-900 rounded-lg text-black 
                       [&_.react-calendar__tile]:text-black
                       [&_.react-calendar__tile--now]:bg-blue-300
                       [&_.react-calendar__tile--active]:bg-blue-500
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
                    className="flex items-center bg-blue-800 rounded-lg p-4 shadow-lg cursor-pointer hover:scale-105 transition-all"
                    onClick={() => {
                      setIsEndCalendarOpen(!isEndCalendarOpen);
                      setIsStartCalendarOpen(false);
                    }}
                  >
                    <FaCalendarAlt className="text-blue-300 mr-4" size={28} />
                    <span className="text-blue-100 font-medium">
                      {endDate
                        ? endDate.toLocaleDateString("es-ES")
                        : "📅 Selecciona fecha"}
                    </span>
                  </div>
                  {isEndCalendarOpen && (
                    <div className="absolute top-16 left-0 z-50 bg-blue-900 p-6 rounded-3xl shadow-lg ring-2 ring-blue-500">
                      <Calendar
                        onChange={(date) => {
                          handleEndDateChange(date);
                          setIsEndCalendarOpen(false);
                        }}
                        value={endDate}
                        tileDisabled={({ date }) => disableFutureDates(date)}
                        className="bg-blue-900 rounded-lg text-black 
                         [&_.react-calendar__tile]:text-black
                         [&_.react-calendar__tile--now]:bg-blue-300
                         [&_.react-calendar__tile--active]:bg-blue-500
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
          <div className="relative w-full max-w-[120rem] h-[800px] shadow-2xl rounded-lg overflow-hidden">
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
          <div className="w-full max-w-[120rem] mt-8 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-teal-400 mb-4">
              Detalles de las Consultas
            </h2>

            {/* Loader secundario si isLoadingDetalles */}
            {isLoadingDetalles ? (
              <Loader size={40} />
            ) : detalles.length > 0 ? (
              <>
                {/* Contenedor "overflow-x-auto" para la tabla responsive */}
                <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
                  <table className="w-full table-auto bg-gray-800">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Clave
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Motivo de Consulta
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Diagnóstico
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Departamento
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Nombre del Médico
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Costo de Consulta
                        </th>
                        <th className="px-4 py-3 text-left border-b border-teal-500 font-semibold">
                          Sindicato
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((det, idx) => {
                        // Si no existe 'fechaconsulta', devolvemos un string "No hubo fecha"
                        // Si sí existe, usamos la función 'formatExactDBDate'
                        const fechaStr = det.fechaconsulta
                          ? formatExactDBDate(det.fechaconsulta)
                          : "No hubo fecha";

                        return (
                          <tr
                            key={`${det.claveconsulta || "sin-clave"}-${
                              det.fechaconsulta || "Sin fecha"
                            }-${idx}`}
                            className={`${
                              idx % 2 === 0 ? "bg-gray-700" : "bg-gray-800"
                            } text-white hover:bg-teal-700 transition-colors`}
                          >
                            <td className="px-4 py-3 border-b border-gray-700">
                              {fechaStr}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.claveconsulta
                                ? det.claveconsulta
                                : "No hubo clave de consulta"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.nombrepaciente
                                ? det.nombrepaciente
                                : "No hubo paciente registrado"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.motivoconsulta
                                ? det.motivoconsulta
                                : "No hubo motivo de consulta"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.diagnostico
                                ? det.diagnostico
                                : "No hubo diagnóstico registrado"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.departamento
                                ? det.departamento
                                : "No hubo departamento registrado"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.nombreproveedor
                                ? det.nombreproveedor
                                : "No hubo un costo registrado"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.costo
                                ? det.costo
                                : "No hay un costo registrado para esta consulta"}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-700">
                              {det.sindicato
                                ? det.sindicato
                                : "No hubo un sindicato registrado"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  sx={{
                    mt: 4,
                    display: "flex",
                    justifyContent: "center",
                    "& .MuiPaginationItem-root": {
                      color: "#bde",
                      fontSize: "16px",
                      "&.Mui-selected": {
                        backgroundColor: "#26A69A",
                        color: "#FFFFFF",
                        fontWeight: "bold",
                        boxShadow: "0px 0px 10px #26A69A",
                      },
                      "&:hover": {
                        backgroundColor: "#1E8E86",
                      },
                    },
                  }}
                />
              </>
            ) : (
              <p className="text-gray-300">No hay detalles para mostrar.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
