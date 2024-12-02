import React, { useEffect, useState, useCallback } from "react";
import { Bar, Pie } from "react-chartjs-2";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const MedicamentosChart = () => {
  const [barChartData, setBarChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [barCurrentPage, ] = useState(0);
  const [pieCurrentPage, ] = useState(0);
  const [error, setError] = useState(null);

  const ITEMS_PER_PAGE = 10;

  // Función para generar datos paginados para el gráfico de barras
  const paginateBarData = useCallback((data) => {
    const start = barCurrentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const currentData = data.slice(start, end);

    const labels = currentData.map((medicamento) => medicamento.sustancia);
    const cantidades = currentData.map((medicamento) => medicamento.piezas);

    setBarChartData({
      labels,
      datasets: [
        {
          label: `Cantidad de Piezas Registradas (Página ${barCurrentPage + 1})`,
          data: cantidades,
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    });
  }, [barCurrentPage, ITEMS_PER_PAGE]);

  // Función para generar datos paginados para el gráfico circular
  const paginatePieData = useCallback((data) => {
    const start = pieCurrentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const currentData = data.slice(start, end);

    const labels = currentData.map((item) => item.sustancia);
    const cantidades = currentData.map((item) => item.piezas);

    setPieChartData({
      labels,
      datasets: [
        {
          label: `Piezas Otorgadas (Página ${pieCurrentPage + 1})`,
          data: cantidades,
          backgroundColor: ["rgba(255, 99, 132, 0.5)", "rgba(54, 162, 235, 0.5)"],
          borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
          borderWidth: 1,
        },
      ],
    });
  }, [pieCurrentPage, ITEMS_PER_PAGE]);

  // Función para obtener los medicamentos registrados
  const fetchMedicamentosData = useCallback(async () => {
    try {
      const response = await fetch("/api/farmacia/obtenerMedicamentos");
      const data = await response.json();

      if (response.ok) {
        const sortedData = data.sort((a, b) => b.piezas - a.piezas);
        paginateBarData(sortedData);
      } else {
        setError(data.message || "Error al obtener los medicamentos registrados");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error interno del servidor");
    }
  }, [paginateBarData]);

  // Función para obtener los movimientos registrados
  const fetchMovimientosData = useCallback(async () => {
    try {
      const response = await fetch("/api/obtenerMovimientos");
      const data = await response.json();

      if (response.ok) {
        const sustanciasMap = {};
        data.forEach((movimiento) => {
          const piezasOtorgadas = Number(movimiento.piezas_otorgadas);
          sustanciasMap[movimiento.sustancia] =
            (sustanciasMap[movimiento.sustancia] || 0) + piezasOtorgadas;
        });

        const sustanciasArray = Object.entries(sustanciasMap).map(([sustancia, piezas]) => ({
          sustancia,
          piezas,
        }));
        sustanciasArray.sort((a, b) => b.piezas - a.piezas);
        paginatePieData(sustanciasArray);
      } else {
        setError(data.message || "Error al obtener los movimientos");
      }
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
      setError("Error interno del servidor");
    }
  }, [paginatePieData]);

  // Llamar a las funciones de carga de datos al cargar el componente
  useEffect(() => {
    fetchMedicamentosData();
    fetchMovimientosData();
  }, [fetchMedicamentosData, fetchMovimientosData]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#FFFFFF" } },
      title: { display: true, color: "#FFFFFF" },
    },
    scales: {
      x: { ticks: { color: "#FFFFFF" }, grid: { color: "rgba(255, 255, 255, 0.2)" } },
      y: { ticks: { color: "#FFFFFF" }, grid: { color: "rgba(255, 255, 255, 0.2)" } },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <h2 className={styles.title}>Gráficos de Medicamentos</h2>
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <div className={styles.chartWrapper}>
          {/* Gráfico de Barras */}
          {barChartData ? (
            <Bar data={barChartData} options={commonOptions} height={300} />
          ) : (
            <p className={styles.loading}>Cargando datos del gráfico de barras...</p>
          )}
          {/* Gráfico Circular */}
          {pieChartData ? (
            <Pie data={pieChartData} options={commonOptions} height={300} />
          ) : (
            <p className={styles.loading}>Cargando datos del gráfico circular...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicamentosChart;
