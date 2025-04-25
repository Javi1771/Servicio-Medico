/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "chart.js/auto";
import Loader from "./Loaders/Loader-naranja";
import Select from "react-select";
import Calendar from "react-calendar";
import { Pie, Bar } from "react-chartjs-2";
import "react-calendar/dist/Calendar.css";
import { FaCalendarAlt, FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

// ***** IMPORTAMOS PAGINATION DE MUI *****
import { Pagination } from "@mui/material";

ChartJS.register(ArcElement, Tooltip, Legend);

const PumpkinColors = [
  "#ffedd2",
  "#fdd98a",
  "#fcbf4d",
  "#fba624",
  "#f5830b",
  "#d95f06",
  "#b43f09",
  "#92310e",
  "#78290f",
  "#451203",
];

export default function PacientesPorEspecialidad() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [especialidades, setEspecialidades] = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [totalPages, setTotalPages] = useState(1);
  const [visibleSegments, setVisibleSegments] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const startCalendarRef = useRef(null);
  const endCalendarRef = useRef(null);
  const chartRef = useRef(null);

  //* Lógica para actualizar el estado de visibilidad
  const toggleSegmentVisibility = (index) => {
    const updatedSegments = [...visibleSegments];
    updatedSegments[index] = !updatedSegments[index];
    setVisibleSegments(updatedSegments);

    const chart = chartRef.current;
    if (chart) {
      const meta = chart.getDatasetMeta(0);
      meta.data[index].hidden = !meta.data[index].hidden;
      chart.update();
    }
  };

  //* Fetch inicial para especialidades
  useEffect(() => {
    const fetchEspecialidades = async () => {
      try {
        const response = await fetch(
          "/api/estadisticas/pacientesTotalesEspecialidades"
        );
        const data = await response.json();
        const options = data.especialidades.map((esp) => ({
          value: esp.claveespecialidad,
          label: esp.especialidad,
        }));
        setEspecialidades(options);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching especialidades:", error);
        setIsLoading(false);
      }
    };

    fetchEspecialidades();

    const handleClickOutside = (event) => {
      if (
        startCalendarRef.current &&
        !startCalendarRef.current.contains(event.target)
      ) {
        setIsStartCalendarOpen(false);
      }
      if (
        endCalendarRef.current &&
        !endCalendarRef.current.contains(event.target)
      ) {
        setIsEndCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //* Fetch de datos del gráfico basado en especialidad seleccionada y fechas
  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedEspecialidad) return;

      setIsChartLoading(true); //* Muestra el loader
      try {
        const response = await fetch(
          `/api/estadisticas/pacientesTotalesEspecialidades?claveespecialidad=${
            selectedEspecialidad.value
          }&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const data = await response.json();
        setChartData(data.consultas || []);
        setTotalPages(Math.ceil(data.consultas.length / itemsPerPage));
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartData([]);
        setTotalPages(1);
      } finally {
        setIsChartLoading(false); //* Oculta el loader cuando termina la consulta
      }
    };

    fetchChartData();
  }, [selectedEspecialidad, startDate, endDate]);

  //* Handlers
  const handleEspecialidadChange = (selectedOption) => {
    setSelectedEspecialidad(selectedOption);
  };

  const handleStartDateChange = (date) => setStartDate(date);
  const handleEndDateChange = (date) => setEndDate(date);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const disableFutureDates = (date) => date > new Date();

  //* Optimización de tooltip y datos preprocesados
  const chartTooltipData = useMemo(() => {
    return chartData.map((item) => ({
      label: item.nombrepaciente || "Paciente",
      value: item.costo || 0,
    }));
  }, [chartData]);

  const chartOptions = {
    animation: {
      duration: 500,
      easing: "easeOutBounce",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        titleColor: "#FFD700",
        bodyColor: "#FFFFFF",
        titleFont: {
          size: 20,
          weight: "bold",
          family: "Arial, sans-serif",
        },
        bodyFont: {
          size: 16,
          weight: "bold",
          family: "Arial, sans-serif",
        },
        borderColor: "#FF4500",
        borderWidth: 2,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          title: (context) => {
            const index = context[0]?.dataIndex;
            return pieData.labels[index] || "Sin nombre";
          },
          label: (context) => {
            const index = context.dataIndex;
            const costo = pieData.datasets[0].data[index];
            return `Costo Total: $${costo.toLocaleString("es-MX")}`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  const paginatedData = useMemo(() => {
    return chartData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [chartData, currentPage]);

  const pieData = useMemo(() => {
    return {
      labels: paginatedData.map((item) => item.nombrepaciente || "Paciente"),
      datasets: [
        {
          data: paginatedData.map((item) =>
            item.costo === 0 ? 1 : item.costo
          ),
          backgroundColor: PumpkinColors.slice(0, paginatedData.length),
          borderColor: "#FFF",
          borderWidth: 2,
        },
      ],
    };
  }, [paginatedData]);

  useEffect(() => {
    setVisibleSegments(
      paginatedData.map(() => true) //! Por defecto, todos los segmentos son visibles
    );
  }, [paginatedData]);

  const handleGoBack = () => {
    router.replace("/inicio-servicio-medico");
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-[#4A1E06] via-[#3A2909] to-[#2B1D0F] text-white min-h-screen">
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
      <h1 className="text-4xl font-bold mb-6 text-orange-200 text-center shadow-md">
        Total de Pacientes por Especialidad
      </h1>

      {/* Loader si está cargando */}
      {isLoading ? (
        <div className="flex justify-center items-center w-full h-[80vh]">
          <Loader size={120} />
        </div>
      ) : (
        <>
          <div className="w-full max-w-md mb-8">
            <label
              htmlFor="especialidad-select"
              className="block text-lg font-bold text-orange-300 mb-2"
            >
              Seleccione una especialidad:
            </label>
            <div className="relative">
              <Select
                isDisabled={isChartLoading}
                id="especialidad-select"
                options={especialidades}
                onChange={handleEspecialidadChange}
                placeholder="Seleccione una opción..."
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "#2E2E2E",
                    borderColor: state.isFocused ? "#FFA732" : "#4A4A4A",
                    boxShadow: state.isFocused ? "0 0 8px #FFA732" : "none",
                    color: "#FFF",
                    padding: "10px",
                    fontSize: "16px",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                  }),
                  input: (base) => ({
                    ...base,
                    color: "#FFF",
                    "::placeholder": {
                      color: "#B5B5B5",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#2E2E2E",
                    borderRadius: "12px",
                    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.3)",
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isFocused
                      ? "#FFA732"
                      : isSelected
                      ? "#4A4A4A"
                      : "#2E2E2E",
                    color: isFocused || isSelected ? "#FFF" : "#B5B5B5",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    margin: "5px",
                    transition: "all 0.2s ease",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#FFF",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#B5B5B5",
                    fontStyle: "italic",
                  }),
                }}
              />
              <div className="absolute top-0 left-0 right-0 h-full rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 opacity-25 pointer-events-none"></div>
            </div>
          </div>

          {/* Calendarios */}
          <div className="flex space-x-4 items-center mb-6">
            {/* Fecha Inicial */}
            <div className="mb-6">
              <label className="block text-xl font-extrabold text-orange-400 mb-3 tracking-wider">
                Fecha Inicial:
              </label>
              <div className="relative">
                <div
                  className={`flex items-center ${
                    isChartLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  } bg-orange-800 rounded-lg p-4 shadow-lg hover:scale-105 transition-all`}
                  onClick={() => {
                    if (!isChartLoading) {
                      setIsStartCalendarOpen(!isStartCalendarOpen);
                      setIsEndCalendarOpen(false);
                    }
                  }}
                >
                  <FaCalendarAlt className="text-orange-300 mr-4" size={28} />
                  <span className="text-orange-100 font-medium">
                    {startDate
                      ? startDate.toLocaleDateString("es-ES")
                      : "📅 Selecciona fecha"}
                  </span>
                </div>
                {isStartCalendarOpen && (
                  <div
                    ref={startCalendarRef}
                    className="absolute top-16 left-0 z-50 bg-orange-900 p-6 rounded-3xl shadow-lg ring-2 ring-orange-500"
                  >
                    <Calendar
                      onChange={(date) => {
                        if (!isChartLoading) {
                          handleStartDateChange(date);
                          setIsStartCalendarOpen(false);
                        }
                      }}
                      value={startDate}
                      tileDisabled={({ date }) =>
                        isChartLoading || disableFutureDates(date)
                      } // Deshabilita días futuros y calendarios durante la carga
                      className={`bg-orange-900 rounded-lg text-black ${
                        isChartLoading ? "pointer-events-none" : ""
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Fecha Final */}
            <div className="mb-6">
              <label className="block text-xl font-extrabold text-orange-400 mb-3 tracking-wider">
                Fecha Final:
              </label>
              <div className="relative">
                <div
                  className={`flex items-center ${
                    isChartLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  } bg-orange-800 rounded-lg p-4 shadow-lg hover:scale-105 transition-all`}
                  onClick={() => {
                    if (!isChartLoading) {
                      setIsEndCalendarOpen(!isEndCalendarOpen);
                      setIsStartCalendarOpen(false);
                    }
                  }}
                >
                  <FaCalendarAlt className="text-orange-300 mr-4" size={28} />
                  <span className="text-orange-100 font-medium">
                    {endDate
                      ? endDate.toLocaleDateString("es-ES")
                      : "📅 Selecciona fecha"}
                  </span>
                </div>
                {isEndCalendarOpen && (
                  <div
                    ref={endCalendarRef}
                    className="absolute top-16 left-0 z-50 bg-orange-900 p-6 rounded-3xl shadow-lg ring-2 ring-orange-500"
                  >
                    <Calendar
                      onChange={(date) => {
                        if (!isChartLoading) {
                          handleEndDateChange(date);
                          setIsEndCalendarOpen(false);
                        }
                      }}
                      value={endDate}
                      tileDisabled={({ date }) =>
                        isChartLoading || disableFutureDates(date)
                      } // Deshabilita días futuros y calendarios durante la carga
                      className={`bg-orange-900 rounded-lg text-black ${
                        isChartLoading ? "pointer-events-none" : ""
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              <div className="w-full max-w-[120rem] bg-[rgba(50,30,10,0.9)] backdrop-blur-md p-10 rounded-2xl shadow-2xl mx-auto border border-orange-600 flex flex-col lg:flex-row gap-12">
                {/* Simbología */}
                <div className="w-full lg:w-1/3 text-orange-200 flex flex-col items-start">
                  <h3 className="text-3xl font-bold mb-6 text-orange-400">
                    Lista de Pacientes
                  </h3>
                  <ul className="space-y-4">
                    {pieData.labels.map((label, index) => {
                      const isHidden = !visibleSegments[index];
                      const canHide = pieData.datasets[0].data[index] > 0;

                      return (
                        <li
                          key={index}
                          className={`flex items-center space-x-4 text-lg font-medium cursor-pointer ${
                            !canHide ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          onClick={() =>
                            canHide && toggleSegmentVisibility(index)
                          }
                        >
                          <div
                            className={`w-8 h-8 rounded-full shadow-md border border-orange-300 ${
                              isHidden ? "opacity-40" : "opacity-100"
                            }`}
                            style={{
                              backgroundColor:
                                pieData.datasets[0].backgroundColor[index],
                            }}
                          ></div>
                          <span
                            className={`${
                              isHidden
                                ? "line-through text-gray-500"
                                : "text-orange-100"
                            }`}
                          >
                            {label || "Sin Nombre"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Gráfica */}
                <div className="flex-1 flex justify-center items-center h-[40rem]">
                  {isChartLoading ? (
                    <Loader size={120} /> // Loader visible mientras se cargan los datos
                  ) : (
                    <div className="relative w-full h-full p-6 bg-gradient-to-br from-[#2E1A09] to-[#3F220B] rounded-lg shadow-lg border border-orange-600">
                      {/* Decoración de fondo */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[rgba(255,100,0,0.2)] to-transparent blur-3xl opacity-50 -z-10"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle, rgba(255,200,150,0.1) 10%, rgba(50,30,10,0.1) 70%)] -z-20"></div>
                      {/* Gráfica */}
                      <Pie
                        ref={chartRef}
                        data={pieData}
                        options={chartOptions}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-[120rem] mt-8 bg-[#2C2F33] p-6 rounded-lg">
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#FFA732" }}
                >
                  Detalles de las Consultas
                </h2>
                <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
                  <table className="w-full table-auto bg-[#1C1F2F]">
                    <thead>
                      <tr className="bg-[#0F111A] text-white">
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Nómina
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Clave Consulta
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Edad
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Departamento
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Costo
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Médico Que Atendió
                        </th>
                        <th className="px-4 py-3 text-left border-b border-[#FF7300] font-semibold">
                          Fecha de Cita
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`${
                            idx % 2 === 0 ? "bg-[#1C1F2F]" : "bg-[#2C2F33]"
                          } text-white hover:bg-[#dd5602] transition-colors`}
                        >
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.fechaconsulta || "Sin fecha"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.clavenomina || "Sin nómina"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.claveconsulta || "Sin clave"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.nombrepaciente || "Sin paciente"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.edad || "N/A"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.departamento || "Sin departamento"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            $
                            {item.costo?.toLocaleString("es-MX") || "Sin costo"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.nombreproveedor || "Sin médico"}
                          </td>
                          <td className="px-4 py-3 border-b border-[#0F111A]">
                            {item.fechacita || "Sin fecha de cita"}
                          </td>
                        </tr>
                      ))}
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
                        backgroundColor: "#cc5302",
                        color: "#FFFFFF",
                        fontWeight: "bold",
                        boxShadow: "0px 0px 10px #cc5302",
                      },
                      "&:hover": {
                        backgroundColor: "#ff7300",
                      },
                    },
                  }}
                />
              </div>
            </>
          ) : (
            <p className="text-gray-300">No hay detalles para mostrar.</p>
          )}
        </>
      )}
    </div>
  );
}
