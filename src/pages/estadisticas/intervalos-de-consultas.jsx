import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'chart.js';
import 'chart.js/auto';
import { FaCalendarAlt } from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const IntervalosDeConsultas = () => {
  const [data, setData] = useState(null); // Estado para almacenar los datos de la API
  const [interval, setInterval] = useState('days'); // Intervalo seleccionado (horas, días, semanas, etc.)
  const [startDate, setStartDate] = useState(new Date()); // Fecha inicial del rango
  const [endDate, setEndDate] = useState(new Date()); // Fecha final del rango
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false); // Controla si el calendario de fecha inicial está abierto
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false); // Controla si el calendario de fecha final está abierto
  const [totalConsultas, setTotalConsultas] = useState(0); // Total de consultas en el rango seleccionado
  const [fechaMaxConsultas, setFechaMaxConsultas] = useState(null); // Fecha con mayor número de consultas
  const chartRef = useRef(null); // Referencia para la instancia del gráfico

  // Efecto para obtener los datos de la API
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/estadisticas/intervaloConsultas'); // Llama al endpoint de la API
      const result = await response.json();
      setData(result); // Almacena los datos en el estado
    };

    fetchData();
  }, []);

  // Efecto para actualizar el gráfico cuando los datos, intervalo o rango cambian
  useEffect(() => {
    if (data && data[interval]) {
      const ctx = document.getElementById('consultasChart').getContext('2d');

      // Destruir el gráfico anterior si existe
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Filtrar los datos por rango de fechas
      const filteredData = filterDataByDateRange(data[interval], startDate, endDate);

      // Actualizar estadísticas (total de consultas y fecha con más consultas)
      updateStatistics(filteredData);

      // Crear un nuevo gráfico
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Object.keys(filteredData), // Etiquetas del eje X
          datasets: [
            {
              label: 'Consultas',
              data: Object.values(filteredData), // Valores del eje Y
              borderColor: 'rgba(38, 166, 154, 1)', // Color de la línea
              backgroundColor: 'rgba(38, 166, 154, 0.1)', // Color de fondo debajo de la línea
              borderWidth: 3,
              fill: true,
              tension: 0.4, // Suavizar la línea
              pointRadius: 4,
              pointHoverRadius: 8,
              pointBackgroundColor: 'rgba(255, 255, 255, 1)',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: '#FFFFFF',
                font: {
                  size: 14,
                  weight: 'bold',
                },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(20, 20, 40, 0.9)',
              titleColor: '#00FFC6',
              bodyColor: '#FFFFFF',
              titleFont: {
                size: 16,
                weight: 'bold',
              },
              bodyFont: {
                size: 14,
              },
              borderWidth: 2,
              borderColor: '#00FFC6',
              padding: 12,
              intersect: false,
              mode: 'index',
              callbacks: {
                title: (context) => {
                  const rawDate = context[0].label;
                  const date = new Date(rawDate);
                  return formatDateToReadableString(date); // Formatear fecha para mostrar en el tooltip
                },
                label: (context) => `Consultas: ${context.raw}`,
              },
            },
          },
          layout: {
            padding: {
              top: 20,
              bottom: 20,
              left: 10,
              right: 10,
            },
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1,
              },
              title: {
                display: true,
                text: 'Intervalos de Tiempo',
                color: '#FFFFFF',
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
              ticks: {
                color: '#FFFFFF',
                font: {
                  size: 12,
                },
                maxRotation: 45, // Rotar etiquetas para mejor visibilidad
                autoSkip: true, // Reducir la densidad de etiquetas si es necesario
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                lineWidth: 1,
              },
              title: {
                display: true,
                text: 'Número de Consultas',
                color: '#FFFFFF',
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
              ticks: {
                color: '#FFFFFF',
                font: {
                  size: 12,
                },
              },
            },
          },
        },
      });
    }

    // Limpiar el gráfico al desmontar el componente
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, interval, startDate, endDate]);

  // Función para filtrar datos por rango de fechas
  const filterDataByDateRange = (data, startDate, endDate) => {
    const filtered = {};
    for (const [key, value] of Object.entries(data)) {
      if (interval === 'weeks') {
        // Procesar semanas
        const [year, week] = key.split('-W');
        const startOfWeek = new Date(year, 0, 1 + (week - 1) * 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        if (
          (startOfWeek >= startDate && startOfWeek <= endDate) ||
          (endOfWeek >= startDate && endOfWeek <= endDate)
        ) {
          filtered[key] = value;
        }
      } else {
        // Procesar otros intervalos (horas, días, meses, años)
        const date = new Date(key);
        if (date >= startDate && date <= endDate) {
          filtered[key] = value;
        }
      }
    }
    return filtered;
  };

  // Función para actualizar estadísticas
  const updateStatistics = (filteredData) => {
    const total = Object.values(filteredData).reduce((acc, curr) => acc + curr, 0);
    const maxConsultasDate = Object.keys(filteredData).reduce((a, b) => (filteredData[a] > filteredData[b] ? a : b), null);
    if (maxConsultasDate) {
      const maxDate = new Date(maxConsultasDate);
      setFechaMaxConsultas(formatDateToReadableString(maxDate));
    } else {
      setFechaMaxConsultas(null);
    }
    setTotalConsultas(total);
  };

  // Función para formatear la fecha a un formato legible
  const formatDateToReadableString = (date) => {
    return date.toLocaleString('default', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: undefined,
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-teal-400">Intervalos de Consultas</h1>

      <div className="flex space-x-4 mb-6">
        {['hours', 'days', 'weeks', 'months', 'years'].map((int) => (
          <button
            key={int}
            onClick={() => setInterval(int)}
            className={`px-5 py-2 rounded-lg text-lg font-semibold shadow-md transition-all duration-300 ${
              interval === int
                ? 'bg-teal-500 text-black shadow-lg hover:bg-teal-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {int.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex space-x-4 items-center mb-6">
        <div className="mb-6">
          <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
            Fecha Inicial:
          </label>
          <div className="relative">
            <div
              className="flex items-center bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-full p-4 shadow-md cursor-pointer"
              onClick={() => {
                setIsStartCalendarOpen(!isStartCalendarOpen);
                setIsEndCalendarOpen(false);
              }}
            >
              <FaCalendarAlt className="text-cyan-400 mr-4" size={28} />
              <span className="text-cyan-200 font-medium">
                {startDate ? startDate.toLocaleDateString() : '📅 Selecciona una fecha'}
              </span>
            </div>
            {isStartCalendarOpen && (
              <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500">
                <Calendar
                  onChange={(date) => {
                    setStartDate(date);
                    setIsStartCalendarOpen(false);
                  }}
                  value={startDate}
                  className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-cyan-300"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xl font-extrabold text-cyan-400 mb-3 tracking-wider">
            Fecha Final:
          </label>
          <div className="relative">
            <div
              className="flex items-center bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-full p-4 shadow-md cursor-pointer"
              onClick={() => {
                setIsEndCalendarOpen(!isEndCalendarOpen);
                setIsStartCalendarOpen(false);
              }}
            >
              <FaCalendarAlt className="text-cyan-400 mr-4" size={28} />
              <span className="text-cyan-200 font-medium">
                {endDate ? endDate.toLocaleDateString() : '📅 Selecciona una fecha'}
              </span>
            </div>
            {isEndCalendarOpen && (
              <div className="absolute top-16 left-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6 rounded-3xl shadow-lg ring-2 ring-cyan-500">
                <Calendar
                  onChange={(date) => {
                    setEndDate(date);
                    setIsEndCalendarOpen(false);
                  }}
                  value={endDate}
                  className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg text-cyan-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-6 text-gray-200">
        <p className="text-lg font-bold">Consultas Totales: <span className="text-teal-400">{totalConsultas}</span></p>
        {fechaMaxConsultas && (
          <p className="text-lg font-bold">Fecha con Más Consultas: <span className="text-teal-400">{fechaMaxConsultas}</span></p>
        )}
      </div>

      <div className="relative w-full max-w-5xl h-[500px] shadow-2xl rounded-lg overflow-hidden">
        {data && data[interval] && Object.keys(data[interval]).length > 0 ? (
          <canvas id="consultasChart"></canvas>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No hay datos disponibles para el intervalo seleccionado.
          </div>
        )}
      </div>
    </div>
  );
};

export default IntervalosDeConsultas;
