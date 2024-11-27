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
  const [error, setError] = useState(null);

  // Datos de medicamentos registrados (gráfico de barras)
  const fetchMedicamentosData = async () => {
    try {
      const response = await fetch("/api/farmacia/obtenerMedicamentos");
      const data = await response.json();

      if (response.ok) {
        const labels = data.map((medicamento) => medicamento.sustancia);
        const cantidades = data.map((medicamento) => medicamento.piezas);

        setBarChartData({
          labels,
          datasets: [
            {
              label: "Cantidad de Piezas Registradas",
              data: cantidades,
              backgroundColor: "rgba(75, 192, 192, 0.5)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });
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
          if (sustanciasMap[movimiento.sustancia]) {
            sustanciasMap[movimiento.sustancia] += movimiento.piezas_otorgadas;
          } else {
            sustanciasMap[movimiento.sustancia] = movimiento.piezas_otorgadas;
          }
        });

        const labels = Object.keys(sustanciasMap);
        const cantidades = Object.values(sustanciasMap);

        setPieChartData({
          labels,
          datasets: [
            {
              label: "Piezas Otorgadas",
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
      } else {
        setError(data.message || "Error al obtener los movimientos");
      }
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
      setError("Error interno del servidor");
    }
  };

  // Llamar a ambas APIs al cargar el componente
  useEffect(() => {
    fetchMedicamentosData();
    fetchMovimientosData();
  }, []);

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
              <div className={styles.chartCanvas}>
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true, // Mantener proporciones
                    aspectRatio: 2, // Controlar ancho y alto
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: "Cantidad de Piezas Registradas por Sustancia",
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className={styles.loading}>
                Cargando datos del gráfico de barras...
              </p>
            )}
          </div>

          {/* Gráfico Circular */}
          <div className={styles.card}>
            <h3 className={styles.chartTitle}>Gráfico Circular</h3>
            {pieChartData ? (
              <div className={styles.chartCanvas}>
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true, // Mantener proporciones
                    aspectRatio: 1, // Controlar ancho y alto
                    plugins: {
                      legend: {
                        position: "right",
                      },
                      title: {
                        display: true,
                        text: "Distribución de Piezas Otorgadas por Sustancia",
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className={styles.loading}>
                Cargando datos del gráfico circular...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicamentosChart;
