import React, { useEffect, useState } from "react";
import {
  Typography,
  CircularProgress,
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

// Registrar componentes de ChartJS
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const CostoDeSurtimientos = () => {
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `/api/estadisticas/surtimientoEstadistica?year=${currentYear}`
        );
        const sortedData = response.data.sort((a, b) => b.TOTAL_COSTO - a.TOTAL_COSTO);
        setGroupedData(sortedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  const pieData = {
    labels: groupedData.map((item) => item.NOMBRE_PACIENTE),
    datasets: [
      {
        data: groupedData.map((item) => item.TOTAL_COSTO),
        backgroundColor: [
          "#FF6F61",
          "#6B5B95",
          "#88B04B",
          "#F7CAC9",
          "#92A8D1",
          "#955251",
          "#B565A7",
          "#009B77",
          "#DD4124",
          "#45B8AC",
        ],
        borderWidth: 3,
        borderColor: "#1C1F2F",
        hoverBorderColor: "#F8E9A1",
      },
    ],
  };

  const barData = {
    labels: groupedData.map((item) => item.NOMBRE_PACIENTE),
    datasets: [
      {
        label: "Costo Total (MXN)",
        data: groupedData.map((item) => item.TOTAL_COSTO),
        backgroundColor: "#009B77",
        borderColor: "#006A4E",
        borderWidth: 2,
        hoverBackgroundColor: "#88B04B",
        hoverBorderColor: "#F8E9A1",
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14, family: "Poppins, sans-serif" },
          color: "#F8E9A1",
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
        ticks: { color: "#F8E9A1", font: { size: 12, family: "Poppins" } },
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#F8E9A1", font: { size: 12, family: "Poppins" } },
      },
    },
  };

  return (
    <Box
      sx={{
        padding: "3rem",
        background: "radial-gradient(circle, #1C1F2F, #0D0E10)",
        minHeight: "100vh",
        color: "#F8E9A1",
      }}
    >
      <Typography
        variant="h3"
        align="center"
        sx={{
          mb: 5,
          fontWeight: "bold",
          color: "#FF6F61",
          textShadow: "0px 0px 20px #FF6F61",
        }}
      >
        Análisis de Costo de Surtimientos
      </Typography>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress sx={{ color: "#FF6F61" }} />
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
                  backgroundColor: offset === 0 ? "#88B04B" : "#006A4E",
                  "&:hover": {
                    backgroundColor: offset === 0 ? "#FF6F61" : "#45B8AC",
                  },
                  color: "#F8E9A1",
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
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                align="center"
                sx={{
                  mb: 2,
                  color: "#88B04B",
                  textShadow: "0px 0px 10px #009B77",
                }}
              >
                Distribución de Costos
              </Typography>
              <Pie data={pieData} options={chartOptions} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                align="center"
                sx={{
                  mb: 2,
                  color: "#45B8AC",
                  textShadow: "0px 0px 10px #009B77",
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
                color: "#F8E9A1",
                textShadow: "0px 0px 10px #FF6F61",
              }}
            >
              Detalles por Paciente
            </Typography>
            <Table
              sx={{
                backgroundColor: "#0D0E10",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.5)",
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#FF6F61", fontWeight: "bold", fontSize: "16px" }}>
                    Paciente
                  </TableCell>
                  <TableCell sx={{ color: "#FF6F61", fontWeight: "bold", fontSize: "16px" }}>
                    Nómina
                  </TableCell>
                  <TableCell sx={{ color: "#FF6F61", fontWeight: "bold", fontSize: "16px" }}>
                    Costo Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ color: "#F8E9A1", fontSize: "14px" }}>
                      {item.NOMBRE_PACIENTE}
                    </TableCell>
                    <TableCell sx={{ color: "#F8E9A1", fontSize: "14px" }}>
                      {item.NOMINA}
                    </TableCell>
                    <TableCell sx={{ color: "#F8E9A1", fontSize: "14px" }}>
                      ${item.TOTAL_COSTO.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CostoDeSurtimientos;
