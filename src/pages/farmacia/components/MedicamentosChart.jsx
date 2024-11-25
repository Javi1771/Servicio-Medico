import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MedicamentosChart = () => {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  // Función para obtener datos de la API
  const fetchMedicamentosData = async () => {
    try {
      const response = await fetch("/api/obtenerMedicamentos");
      const data = await response.json();

      if (response.ok) {
        // Transformar los datos en formato para el gráfico
        const labels = data.map((medicamento) => medicamento.sustancia); // Sustancia como etiqueta
        const cantidades = data.map((medicamento) => medicamento.piezas); // Piezas como valor

        setChartData({
          labels,
          datasets: [
            {
              label: "Cantidad de Piezas",
              data: cantidades,
              backgroundColor: "rgba(75, 192, 192, 0.5)", // Color de barras
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });
      } else {
        setError(data.message || "Error al obtener los medicamentos");
      }
    } catch (error) {
      console.error("Error al obtener los datos del gráfico:", error);
      setError("Error interno del servidor");
    }
  };

  // Llamar a la API al cargar el componente
  useEffect(() => {
    fetchMedicamentosData();
  }, []);

  return (
    <div className={styles.chartContainer}>
      <h2 className={styles.title}>Gráfico de Medicamentos</h2>
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : chartData ? (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "top",
              },
              title: {
                display: true,
                text: "Cantidad de Piezas por Sustancia",
              },
            },
          }}
        />
      ) : (
        <p className={styles.loading}>Cargando datos del gráfico...</p>
      )}
    </div>
  );
};

export default MedicamentosChart;
