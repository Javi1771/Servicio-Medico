/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Pagination,
} from "@mui/material";
import { Pie, Bar } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { useRouter } from "next/router";
import Loader from "./Loaders/Loader-morado";
import { FaArrowLeft } from "react-icons/fa";

//* Registrar componentes de ChartJS
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const CostoDeSurtimientos = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [initialLoading, setInitialLoading] = useState(true);
  const [pieChartLoading, setPieChartLoading] = useState(false);
  const [barChartLoading, setBarChartLoading] = useState(false);
  const router = useRouter();

  //* Estado para manejar qué elementos están ocultos en la gráfica
  const [hiddenItems, setHiddenItems] = useState({});

  //! --------- NUEVAS banderas para forzar 5 segundos de Loader ---------
  //* Indican cuándo la petición terminó y cuándo se cumplió el tiempo mínimo.
  useEffect(() => {
    let finishedLoading = false;
    let minTimeReached = false;

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/estadisticas/surtimientoEstadistica?year=${currentYear}`
        );
        const sortedData = response.data.sort(
          (a, b) => b.TOTAL_COSTO - a.TOTAL_COSTO
        );
        setGroupedData(sortedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        finishedLoading = true;
        if (minTimeReached) {
          setInitialLoading(false); //! Desactiva el loader inicial
        }
      }
    };

    fetchData();

    const timer = setTimeout(() => {
      minTimeReached = true;
      if (finishedLoading) {
        setInitialLoading(false); //! Desactiva el loader inicial
      }
    }, 5000); //* Loader inicial dura 5 segundos mínimo

    return () => clearTimeout(timer); //* Limpieza del temporizador
  }, []); //* Solo al inicio

  useEffect(() => {
    setPieChartLoading(true);
    setBarChartLoading(true);

    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/estadisticas/surtimientoEstadistica?year=${currentYear}`
        );
        const sortedData = response.data.sort(
          (a, b) => b.TOTAL_COSTO - a.TOTAL_COSTO
        );
        setGroupedData(sortedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setPieChartLoading(false); //! Desactiva el loader del gráfico Pie
        setBarChartLoading(false); //! Desactiva el loader del gráfico Bar
      }
    };

    fetchData();
  }, [currentYear]);

  //* Función para alternar la visibilidad de cada paciente (label)
  const toggleItem = (label) => {
    setHiddenItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  //* Filtrar y mapear los datos de la página actual
  const pageData = groupedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  //* Construcción de los datos para la gráfica Pie,
  //* ocultando los valores cuyo label esté marcado como oculto en `hiddenItems`.
  const pieData = {
    labels: pageData.map((item) => item.NOMBRE_PACIENTE),
    datasets: [
      {
        data: pageData.map((item) =>
          hiddenItems[item.NOMBRE_PACIENTE] ? 0 : item.TOTAL_COSTO
        ),
        backgroundColor: [
          "#F6F3FF",
          "#EFE9FE",
          "#E1D6FE",
          "#CBB5FD",
          "#B28CF9",
          "#9A5DF5",
          "#8E3BEC",
          "#7F29D8",
          "#6A22B5",
          "#581E94",
        ],
        borderWidth: 3,
        borderColor: "#2C2F33",
        hoverBorderColor: "#F8E9A1",
      },
    ],
  };

  //* Construcción de los datos para la gráfica de Barras,
  //* también ocultando los valores según `hiddenItems`.
  const barData = {
    labels: pageData.map((item) => item.NOMBRE_PACIENTE),
    datasets: [
      {
        label: "Costo Total (MXN)",
        data: pageData.map((item) =>
          hiddenItems[item.NOMBRE_PACIENTE] ? 0 : item.TOTAL_COSTO
        ),
        backgroundColor: "#8E3BEC",
        borderColor: "#7F29D8",
        borderWidth: 2,
        hoverBackgroundColor: "#9A5DF5",
        hoverBorderColor: "#EFE9FE",
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(43, 13, 79, 0.9)",
        titleColor: "rgb(230, 0, 255)",
        bodyColor: "#FFF0F9",
        titleFont: { size: 16, weight: "bold" },
        bodyFont: { size: 14 },
        borderWidth: 2,
        borderColor: "rgba(230, 0, 255, 0.9)",
        padding: 12,
        intersect: false,
        mode: "index",
        callbacks: {
          title: (context) => {
            const rawKey = context[0].label;
            return `Paciente: ${rawKey}`;
          },
          label: (context) => {
            const value = context.raw;
            return `Costo Total: $${value.toLocaleString("es-MX")}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: {
          color: "#FFE3F5",
          font: { size: 12, family: "Poppins" },
        },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: {
          color: "#FFE3F5",
          font: { size: 12, family: "Poppins" },
        },
      },
    },
  };

  const handleGoBack = () => {
    router.replace("/inicio-servicio-medico");
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <Box
      sx={{
        padding: "3rem",
        background: "radial-gradient(circle, #2B0D4F, #1C1F2F)",
        minHeight: "100vh",
        color: "#EFE9FE",
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{
          mb: 5,
          fontWeight: "bold",
          color: "#7F29D8",
          textShadow: "0px 0px 20px #7F29D8",
        }}
      >
        Análisis de Costo de Surtimientos
      </Typography>

      <button
        onClick={handleGoBack}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transition-all duration-300"
      >
        <FaArrowLeft />
        <span className="hidden sm:inline">Regresar</span>
      </button>

      {/* Si está cargando, mostramos el Loader morado */}
      {initialLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <Loader size={120} />
        </Box>
      ) : (
        <>
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 5 }}
          >
            {[-1, 0, 1].map((offset) => (
              <Button
                key={offset}
                variant="contained"
                onClick={() => setCurrentYear(currentYear + offset)}
                sx={{
                  backgroundColor: offset === 0 ? "#581E94" : "#2B0D4F",
                  "&:hover": {
                    backgroundColor: offset === 0 ? "#6A22B5" : "#3A1466",
                  },
                  color: "#EFE9FE",
                  px: 5,
                  py: 1.5,
                  boxShadow: "0px 5px 20px rgba(0, 0, 0, 0.4)",
                  borderRadius: "8px",
                }}
              >
                {`Año ${currentYear + offset}`}
              </Button>
            ))}
          </Box>
          <Grid container spacing={4}>
            {/* Gráfica Pie */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 4,
                  backgroundColor: "#1C1F2F",
                  borderRadius: "12px",
                  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minHeight: "1500px", // Altura mínima aumentada
                  height: "1500px", // Altura fija para mantener simetría
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {pieChartLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      backgroundColor: "rgba(28, 31, 47, 0.8)",
                      borderRadius: "12px",
                    }}
                  >
                    <Loader size={120} />
                  </Box>
                ) : (
                  <>
                    <Typography
                      variant="h6"
                      align="center"
                      sx={{
                        mb: 2,
                        color: "#7F29D8",
                        textShadow: "0px 0px 10px #7F29D8",
                      }}
                    >
                      Lista de Pacientes
                    </Typography>
                    {/* Lista de nombres de pacientes */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        mb: 4,
                        width: "100%",
                        maxWidth: "400px",
                      }}
                    >
                      {pieData.labels.map((label, index) => {
                        const color =
                          pieData.datasets[0].backgroundColor[index];
                        const isHidden = hiddenItems[label];
                        return (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              cursor: "pointer",
                              opacity: isHidden ? 0.5 : 1,
                              transition: "opacity 0.3s",
                            }}
                            onClick={() => toggleItem(label)}
                          >
                            <Box
                              sx={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: color,
                                borderRadius: "4px",
                              }}
                            />
                            <Typography
                              sx={{ color: "#EFE9FE", fontSize: "14px" }}
                            >
                              {label}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                    {/* Gráfica de pastel */}
                    <Pie
                      data={pieData}
                      options={{
                        ...chartOptions,
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            backgroundColor: "rgba(43, 13, 79, 0.9)",
                            titleColor: "rgb(230, 0, 255)",
                            bodyColor: "#FFF0F9",
                            titleFont: { size: 16, weight: "bold" },
                            bodyFont: { size: 14 },
                            borderWidth: 2,
                            borderColor: "rgba(230, 0, 255, 0.9)",
                            padding: 12,
                            callbacks: {
                              label: (context) => {
                                const value = context.raw;
                                return `Costo Total: $${value.toLocaleString(
                                  "es-MX"
                                )}`;
                              },
                            },
                          },
                        },
                        cutout: "60%", // Hace que el gráfico sea más limpio
                      }}
                    />
                  </>
                )}
              </Box>
            </Grid>

            {/* Gráfica Bar */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 4,
                  backgroundColor: "#1C1F2F",
                  borderRadius: "12px",
                  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.5)",
                  minHeight: "1500px",
                  height: "1500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {barChartLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      backgroundColor: "rgba(28, 31, 47, 0.8)",
                      borderRadius: "12px",
                    }}
                  >
                    <Loader size={120} />
                  </Box>
                ) : (
                  <Bar
                    data={{
                      ...barData,
                      datasets: barData.datasets.map((dataset) => ({
                        ...dataset,
                        backgroundColor: pieData.datasets[0].backgroundColor, // Usar colores de la gráfica de pastel
                      })),
                    }}
                    options={{
                      ...chartOptions,
                      maintainAspectRatio: false,
                      layout: {
                        padding: { top: 20, bottom: 20, left: 10, right: 10 },
                      },
                      scales: {
                        x: {
                          grid: { color: "rgba(255, 255, 255, 0.1)" },
                          ticks: {
                            color: "#FFE3F5",
                            font: { size: 12, family: "Poppins" },
                          },
                        },
                        y: {
                          grid: { color: "rgba(255, 255, 255, 0.1)" },
                          ticks: {
                            color: "#FFE3F5",
                            font: { size: 14, family: "Poppins" },
                          },
                        },
                      },
                      barThickness: 60,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "rgba(43, 13, 79, 0.9)",
                          titleColor: "rgb(230, 0, 255)",
                          bodyColor: "#FFF0F9",
                          titleFont: { size: 16, weight: "bold" },
                          bodyFont: { size: 14 },
                          borderWidth: 2,
                          borderColor: "rgba(230, 0, 255, 0.9)",
                          padding: 12,
                          intersect: false,
                          mode: "index",
                          callbacks: {
                            title: (context) => `Paciente: ${context[0].label}`,
                            label: (context) =>
                              `Costo Total: $${context.raw.toLocaleString(
                                "es-MX"
                              )}`,
                          },
                        },
                      },
                    }}
                  />
                )}
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 10 }}>
            {/* Título */}
            <div className="w-full max-w-[120rem] mt-8 bg-gray-800 p-6 rounded-lg">
              <Typography
                className="text-2xl font-bold mb-4"
                style={{ color: "#dc21ff" }}
              >
                Detalles por Paciente
              </Typography>

              {/* Contenido condicional */}
              {pageData.length > 0 ? (
                <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-700">
                  <table className="w-full table-auto bg-gray-800">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="px-4 py-3 text-left border-b border-purple-500 font-semibold">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-left border-b border-purple-500 font-semibold">
                          Nómina
                        </th>
                        <th className="px-4 py-3 text-left border-b border-purple-500 font-semibold">
                          Fecha Emisión
                        </th>
                        <th className="px-4 py-3 text-left border-b border-purple-500 font-semibold">
                          Costo Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((item, index) => (
                        <tr
                          key={index}
                          className={`${
                            index % 2 === 0 ? "bg-gray-700" : "bg-gray-800"
                          } text-white hover:bg-purple-800 transition-colors`}
                        >
                          <td className="px-4 py-3 border-b border-gray-700">
                            {item.NOMBRE_PACIENTE}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-700">
                            {item.NOMINA}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-700">
                            {item.FECHA_EMISION}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-700">
                            ${item.TOTAL_COSTO.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[#FFE3F5]">No hay detalles para mostrar.</p>
              )}

              {/* Paginación */}
              {pageData.length > 0 && (
                <Pagination
                  count={Math.ceil(groupedData.length / itemsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  sx={{
                    mt: 4,
                    display: "flex",
                    justifyContent: "center",
                    "& .MuiPaginationItem-root": {
                      color: "#FFC6EB",
                      fontSize: "16px",
                      "&.Mui-selected": {
                        backgroundColor: "#c800ff",
                        color: "#FFF0F9",
                        fontWeight: "bold",
                        boxShadow: "0px 0px 10px #c800ff",
                      },
                      "&:hover": {
                        backgroundColor: "#740689",
                        color: "#FFF0F9",
                      },
                    },
                  }}
                />
              )}
            </div>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CostoDeSurtimientos;
