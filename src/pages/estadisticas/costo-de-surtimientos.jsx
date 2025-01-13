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

// Importa tu Loader personalizado
import Loader from "./Loaders/Loader-morado";

// Registrar componentes de ChartJS
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CostoDeSurtimientos = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para manejar qué elementos están ocultos en la gráfica
  const [hiddenItems, setHiddenItems] = useState({});

  // --------- NUEVAS banderas para forzar 5 segundos de Loader ---------
  // Indican cuándo la petición terminó y cuándo se cumplió el tiempo mínimo.
  useEffect(() => {
    let finishedLoading = false;
    let minTimeReached = false;

    const fetchData = async () => {
      try {
        // Comienza la petición
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
        // La petición terminó
        finishedLoading = true;
        // Si además el tiempo mínimo ya pasó, entonces se quita el Loader
        if (minTimeReached) {
          setLoading(false);
        }
      }
    };

    // Arrancamos la petición
    fetchData();

    // Temporizador de 5s para forzar el Loader
    const timer = setTimeout(() => {
      // Pasaron los 5s
      minTimeReached = true;
      // Si la petición ya terminó, quitamos el Loader
      if (finishedLoading) {
        setLoading(false);
      }
    }, 5000);

    // Limpieza
    return () => clearTimeout(timer);
  }, [currentYear]);

  // Función para alternar la visibilidad de cada paciente (label)
  const toggleItem = (label) => {
    setHiddenItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Filtrar y mapear los datos de la página actual
  const pageData = groupedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Construcción de los datos para la gráfica Pie,
  // ocultando los valores cuyo label esté marcado como oculto en `hiddenItems`.
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

  // Construcción de los datos para la gráfica de Barras,
  // también ocultando los valores según `hiddenItems`.
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
        position: "top",
        labels: {
          font: { size: 14, family: "Poppins, sans-serif" },
          color: "#EFE9FE",
        },
      },
      tooltip: {
        backgroundColor: "#2C2F33",
        titleColor: "#F8E9A1",
        bodyColor: "#FFFFFF",
        borderColor: "#F8E9A1",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#EFE9FE", font: { size: 12, family: "Poppins" } },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#EFE9FE", font: { size: 12, family: "Poppins" } },
      },
    },
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

      {/* Si está cargando, mostramos el Loader morado */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          {/* Renderiza tu Loader personalizado (no importa la prop 'duration', 
              pues la forzamos 5s con el timeout en el useEffect) */}
          <Loader size={120} duration={5000} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 5 }}>
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
            {/* Sección Pie Chart con lista y fondo en común */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: "#1C1F2F",
                  borderRadius: "12px",
                  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* Lista de etiquetas arriba de la gráfica */}
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
                    const color = pieData.datasets[0].backgroundColor[index];
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
                        <Typography sx={{ color: "#EFE9FE", fontSize: "14px" }}>
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Gráfica Pie */}
                <Pie
                  data={pieData}
                  options={{ ...chartOptions, plugins: { legend: { display: false } } }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                align="center"
                sx={{
                  mb: 2,
                  color: "#9A5DF5",
                  textShadow: "0px 0px 10px #8E3BEC",
                }}
              >
                Análisis Completo de Pacientes
              </Typography>
              <Bar data={barData} options={chartOptions} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 5 }}>
            <Typography
              variant="h5"
              align="center"
              sx={{
                mb: 2,
                color: "#EFE9FE",
                textShadow: "0px 0px 10px #7F29D8",
              }}
            >
              Detalles por Paciente
            </Typography>
            <Table
              sx={{
                backgroundColor: "#1C1F2F",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ color: "#7F29D8", fontWeight: "bold", fontSize: "16px" }}
                  >
                    Paciente
                  </TableCell>
                  <TableCell
                    sx={{ color: "#7F29D8", fontWeight: "bold", fontSize: "16px" }}
                  >
                    Nómina
                  </TableCell>
                  <TableCell
                    sx={{ color: "#7F29D8", fontWeight: "bold", fontSize: "16px" }}
                  >
                    Fecha Emisión
                  </TableCell>
                  <TableCell
                    sx={{ color: "#7F29D8", fontWeight: "bold", fontSize: "16px" }}
                  >
                    Costo Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: "#EFE9FE", fontSize: "14px" }}>
                      {item.NOMBRE_PACIENTE}
                    </TableCell>
                    <TableCell sx={{ color: "#EFE9FE", fontSize: "14px" }}>
                      {item.NOMINA}
                    </TableCell>
                    <TableCell sx={{ color: "#EFE9FE", fontSize: "14px" }}>
                      {new Date(item.FECHA_EMISION).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: "#EFE9FE", fontSize: "14px" }}>
                      ${item.TOTAL_COSTO.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              count={Math.ceil(groupedData.length / itemsPerPage)}
              page={currentPage}
              onChange={handlePageChange}
              sx={{
                mt: 4,
                display: "flex",
                justifyContent: "center",
                "& .MuiPaginationItem-root": {
                  color: "#EFE9FE",
                  fontSize: "16px",
                  "&.Mui-selected": {
                    backgroundColor: "#581E94",
                    color: "#FFFFFF",
                    fontWeight: "bold",
                    boxShadow: "0px 0px 10px #7F29D8",
                  },
                  "&:hover": {
                    backgroundColor: "#6A22B5",
                  },
                },
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default CostoDeSurtimientos;
