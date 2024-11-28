import React, { useEffect, useState } from "react";
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
  const [barChartData, setBarChartData] = useState(null); // Datos para gráfico de barras
  const [pieChartData, setPieChartData] = useState(null); // Datos para gráfico circular
  const [barCurrentPage, setBarCurrentPage] = useState(0); // Página actual del gráfico de barras
  const [pieCurrentPage, setPieCurrentPage] = useState(0); // Página actual del gráfico circular
  const [error, setError] = useState(null);

  const ITEMS_PER_PAGE = 10; // Número de elementos por página

  // Datos de medicamentos registrados (gráfico de barras)
  const fetchMedicamentosData = async () => {
    try {
      const response = await fetch("/api/farmacia/obtenerMedicamentos");
      const data = await response.json();

      if (response.ok) {
        const sortedData = data.sort((a, b) => b.piezas - a.piezas); // Ordenar por piezas
        paginateBarData(sortedData); // Generar datos paginados
      } else {
        setError(data.message || "Error al obtener los medicamentos registrados");
      }
    } catch (error) {
      console.error("Error al obtener los medicamentos registrados:", error);
      setError("Error interno del servidor");
    }
  };

  // Datos de movimientos (piezas otorgadas por sustancia) para el gráfico circular
  const fetchMovimientosData = async () => {
    try {
      const response = await fetch("/api/obtenerMovimientos");
      const data = await response.json();

      if (response.ok) {
        const sustanciasMap = {};
        data.forEach((movimiento) => {
          const piezasOtorgadas = Number(movimiento.piezas_otorgadas);
          if (sustanciasMap[movimiento.sustancia]) {
            sustanciasMap[movimiento.sustancia] += piezasOtorgadas;
          } else {
            sustanciasMap[movimiento.sustancia] = piezasOtorgadas;
          }
        });

        const sustanciasArray = Object.entries(sustanciasMap).map(([sustancia, piezas]) => ({
          sustancia,
          piezas,
        }));
        sustanciasArray.sort((a, b) => b.piezas - a.piezas); // Ordenar por piezas
        paginatePieData(sustanciasArray); // Generar datos paginados
      } else {
        setError(data.message || "Error al obtener los movimientos");
      }
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
      setError("Error interno del servidor");
    }
  };

  // Generar datos paginados para el gráfico de barras
  const paginateBarData = (data) => {
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
  };

  // Generar datos paginados para el gráfico circular
  const paginatePieData = (data) => {
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
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(255, 159, 64, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    });
  };

  // Llamar a ambas APIs al cargar el componente
  useEffect(() => {
    fetchMedicamentosData();
    fetchMovimientosData();
  }, [barCurrentPage, pieCurrentPage]);

  // Opciones globales para gráficos con letras en blanco
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // Permitir que el gráfico ocupe un tamaño personalizado
    plugins: {
      legend: {
        labels: {
          color: "#FFFFFF",
        },
      },
      title: {
        display: true,
        color: "#FFFFFF",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#FFFFFF",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      y: {
        ticks: {
          color: "#FFFFFF",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
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
          <div className={styles.card}>
            <h3 className={styles.chartTitle}>Gráfico de Barras</h3>
            {barChartData ? (
              <>
                <Bar
                  data={barChartData}
                  options={{
                    ...commonOptions,
                    maintainAspectRatio: true,
                  }}
                  height={300}
                />
                <div className={styles.paginationButtons}>
                  <button
                    className={styles.prevButton}
                    onClick={() => setBarCurrentPage(Math.max(barCurrentPage - 1, 0))}
                  >
                    ⬅
                  </button>
                  <button
                    className={styles.nextButton}
                    onClick={() => setBarCurrentPage(barCurrentPage + 1)}
                  >
                    ➡
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.loading}>Cargando datos del gráfico de barras...</p>
            )}
          </div>

          {/* Gráfico Circular */}
          <div className={styles.card}>
            <h3 className={styles.chartTitle}>Gráfico Circular</h3>
            {pieChartData ? (
              <>
                <Pie
                  data={pieChartData}
                  options={{
                    ...commonOptions,
                    maintainAspectRatio: true,
                  }}
                  height={300}
                />
                <div className={styles.paginationButtons}>
                  <button
                    className={styles.prevButton}
                    onClick={() => setPieCurrentPage(Math.max(pieCurrentPage - 1, 0))}
                  >
                    ⬅
                  </button>
                  <button
                    className={styles.nextButton}
                    onClick={() => setPieCurrentPage(pieCurrentPage + 1)}
                  >
                    ➡
                  </button>
                </div>
              </>
            ) : (
              <p className={styles.loading}>Cargando datos del gráfico circular...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicamentosChart;
