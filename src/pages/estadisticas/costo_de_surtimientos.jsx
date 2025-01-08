import React, { useEffect, useState } from "react";
import { Typography, CircularProgress, Box, Grid, Button } from "@mui/material";
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
        const data = response.data;

        // Ordenar y clasificar datos
        const sortedData = data.sort((a, b) => b.TOTAL_COSTO - a.TOTAL_COSTO);
        const topData = sortedData.slice(0, 5);
        const othersData = sortedData.slice(5).reduce((acc, curr) => acc + curr.TOTAL_COSTO, 0);

        if (othersData > 0) {
          topData.push({
            NOMBRE_PACIENTE: "Otros",
            NOMINA: "N/A",
            CLAVE_PACIENTE: "N/A",
            TOTAL_COSTO: othersData,
          });
        }

        setGroupedData(topData);
      } catch (error) {
        console.error("Error fetching grouped data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  const pieData = {
    labels: groupedData.map(
      (item) =>
        `Nombre: ${item.NOMBRE_PACIENTE}, Nómina: ${item.NOMINA}, Clave: ${item.CLAVE_PACIENTE}`
    ),
    datasets: [
      {
        data: groupedData.map((item) => item.TOTAL_COSTO),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
        borderColor: "#0d1117",
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: groupedData.map(
      (item) =>
        `Nombre: ${item.NOMBRE_PACIENTE}, Nómina: ${item.NOMINA}, Clave: ${item.CLAVE_PACIENTE}`
    ),
    datasets: [
      {
        label: "Costo Total (MXN)",
        data: groupedData.map((item) => item.TOTAL_COSTO),
        backgroundColor: "#36A2EB",
        hoverBackgroundColor: "#FFCE56",
        borderColor: "#0d1117",
        borderWidth: 2,
      },
    ],
  };

  return (
    <Box sx={{ padding: "2rem", backgroundColor: "#0d1117", color: "#ffffff", minHeight: "100vh" }}>
      <Typography
        variant="h3"
        sx={{
          textAlign: "center",
          marginBottom: "2rem",
          color: "#00ffcc",
          fontWeight: "bold",
          textShadow: "0px 0px 10px #00ffcc",
        }}
      >
        Dashboard Interactivo: Costo de Surtimientos por Paciente
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress sx={{ color: "#00ffcc" }} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#36A2EB", color: "#ffffff" }}
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              Año {currentYear - 1}
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#FFCE56", color: "#ffffff" }}
              onClick={() => setCurrentYear(currentYear)}
            >
              Año Actual
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#FF6384", color: "#ffffff" }}
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              Año {currentYear + 1}
            </Button>
          </Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  color: "#36A2EB",
                  marginBottom: "1rem",
                  textShadow: "0px 0px 5px #36A2EB",
                }}
              >
                Distribución de Costos (Pie)
              </Typography>
              <Pie data={pieData} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  color: "#FFCE56",
                  marginBottom: "1rem",
                  textShadow: "0px 0px 5px #FFCE56",
                }}
              >
                Top Pacientes (Barras)
              </Typography>
              <Bar data={barData} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CostoDeSurtimientos;