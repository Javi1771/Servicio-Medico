import React, { useEffect, useState, useRef, useMemo } from 'react'; 
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { createChart } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserInjured, FaCalendarAlt, FaChartLine, FaUserFriends,
  FaFileMedical, FaClock, FaTrophy, FaChevronRight, FaTimes,
  FaSearch, FaSyncAlt, FaFilter, FaFileExcel, FaChevronUp, FaChevronDown
} from 'react-icons/fa';

Chart.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// Efecto de sonido
const useTapSound = () => {
  const tapSound = useMemo(() => {
    if (typeof Audio !== 'undefined') {
      return new Audio("/assets/tap.mp3");
    }
    return { play: () => {} };
  }, []);
  
  return tapSound;
};

export default function IncapacidadesDashboard() {
  const tapSound = useTapSound();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [detLoading, setDetLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const chartContainer = useRef();
  const [expandedRow, setExpandedRow] = useState(null);

  // Fetch summary
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate)   params.append('endDate', endDate);
      const res = await fetch(`/api/estadisticas/infoIncapacidades?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('Formato inesperado');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Fetch details for selected row
  useEffect(() => {
    if (!selected) return;
    setDetLoading(true);
    fetch(`/api/estadisticas/incapacidadesDetalle?nomina=${selected}`)
      .then(r => r.json())
      .then(setDetails)
      .catch(console.error)
      .finally(() => setDetLoading(false));
  }, [selected]);

  // TradingView line
  useEffect(() => {
    if (loading || error || !data.length || !chartContainer.current) return;
    
    const chart = createChart(chartContainer.current, {
      width:  chartContainer.current.clientWidth,
      height: 300,
      layout: { 
        background: { color: 'transparent' },
        textColor: '#718096'
      },
      grid: {
        vertLines: { color: '#E2E8F0' },
        horzLines: { color: '#E2E8F0' }
      },
      rightPriceScale: { 
        borderColor: '#CBD5E0',
        scaleMargins: { top: 0.1, bottom: 0.2 }
      },
      timeScale: { 
        borderColor: '#CBD5E0',
        timeVisible: true,
      },
    });
    
    const series = chart.addAreaSeries({
      topColor: 'rgba(99, 102, 241, 0.4)',
      bottomColor: 'rgba(99, 102, 241, 0.1)',
      lineColor: '#6366F1',
      lineWidth: 3
    });
    
    series.setData(data.map((d, i) => ({ 
      time: i, 
      value: d.duracion_promedio 
    })));
    
    return () => chart.remove();
  }, [loading, error, data]);

  // Guards for states
  if (loading) return <FullScreenLoader />;
  if (error)   return <ErrorBanner message={error} />;
  if (!data.length) return <NoData />;

  // Prepare charts and metrics
  const sorted = [...data].sort((a, b) => b.numero_incapacidades - a.numero_incapacidades);
  const topN   = 8;
  const top    = sorted.slice(0, topN);
  const others = sorted.slice(topN);

  const donutLabels = top.map(d => `${d.nomina}`).concat(others.length ? ['Otros'] : []);
  const donutVals   = top.map(d => d.numero_incapacidades)
                        .concat(others.reduce((s, d) => s + d.numero_incapacidades, 0));
  
  // Generar colores para el gráfico de dona
  const donutColors = donutLabels.map((_, i) => {
    const hue = (i * 360) / topN;
    return i < topN ? `hsl(${hue}, 70%, 55%)` : '#94A3B8';
  });
  
  const doughnutData = {
    labels: donutLabels,
    datasets: [{
      data: donutVals,
      backgroundColor: donutColors,
      borderWidth: 0,
      spacing: 2,
    }]
  };

  const top5Avg = sorted.slice(0, 5);
  const barData = {
    labels: top5Avg.map(d => `${d.nomina}`),
    datasets: [{
      label: 'Días Promedio',
      data: top5Avg.map(d => d.duracion_promedio),
      backgroundColor: '#F97316',
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 40,
    }]
  };

  const totalIncap = data.reduce((s, x) => s + x.numero_incapacidades, 0);
  const globalAvg  = (data.reduce((s, x) => s + x.duracion_promedio, 0) / data.length).toFixed(2);
  const maxIncap   = sorted[0];

  // Función para exportar a Excel
  const handleExport = () => {
    tapSound.play();
    // Lógica de exportación
    alert('Exportando datos a Excel...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50">
      {/* Barra superior */}
      <header className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white p-4 shadow-2xl">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FaUserInjured className="text-cyan-300" />
              <span>Dashboard de Incapacidades</span>
            </h1>
            <p className="text-indigo-200 text-sm mt-1">Análisis y seguimiento de incapacidades médicas</p>
          </div>
          
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden bg-white/10 backdrop-blur p-3 rounded-xl border border-white/20"
            >
              <FaFilter className="text-xl" />
            </motion.button>
            
            <div className="flex items-center gap-2">              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchData}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <FaSyncAlt /> 
                <span className="hidden md:inline">Actualizar</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <FaFileExcel /> 
                <span className="hidden md:inline">Exportar</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Filtros móviles */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            >
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25 }}
                className="w-4/5 max-w-sm h-full bg-gradient-to-b from-indigo-900 to-purple-900 p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-white">Filtros</h2>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setMobileFiltersOpen(false);
                      }}
                      className="px-4 py-2 bg-rose-500/20 text-rose-100 rounded-lg"
                    >
                      Limpiar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 text-white"
                    >
                      <FaTimes className="text-xl" />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-indigo-200 font-medium">Fecha inicial</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute top-3 left-3 text-indigo-300" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-indigo-800/50 border border-indigo-600 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-indigo-200 font-medium">Fecha final</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute top-3 left-3 text-indigo-300" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-indigo-800/50 border border-indigo-600 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros para escritorio */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:block w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl p-6 shadow-xl border border-gray-100 h-fit"
          >
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Filtros</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <FaTimes /> Limpiar
              </motion.button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">Fecha inicial</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium">Fecha final</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={fetchData}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg"
                >
                  Aplicar filtros
                </motion.button>
              </div>
            </div>
          </motion.aside>

          {/* Contenido principal */}
          <div className="flex-1">
            {/* Controles de filtro para móvil */}
            <div className="lg:hidden flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm"
              >
                <FaFilter className="text-indigo-500" />
                <span>Filtros</span>
              </motion.button>
              
              <div className="text-sm text-gray-600">
                {data.length} empleados
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <MetricCard 
                icon={<FaUserFriends className="text-2xl" />} 
                title="Empleados" 
                value={data.length} 
                description="Total de empleados únicos" 
                color="from-indigo-500 to-indigo-600"
              />
              <MetricCard 
                icon={<FaFileMedical className="text-2xl" />} 
                title="Total Incap." 
                value={totalIncap} 
                description="Suma de incapacidades" 
                color="from-cyan-500 to-cyan-600"
              />
              <MetricCard 
                icon={<FaClock className="text-2xl" />} 
                title="Promedio Días" 
                value={globalAvg} 
                description="Media global de días" 
                color="from-emerald-500 to-emerald-600"
              />
              <MetricCard 
                icon={<FaTrophy className="text-2xl" />} 
                title="Mayor Incap." 
                value={`${maxIncap.nomina} (${maxIncap.numero_incapacidades})`} 
                description="Nómina con más incapacidades" 
                color="from-purple-500 to-purple-600"
              />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard title={`Top ${topN} Incapacidades`}>
                <div className="h-64">
                  <Doughnut data={doughnutData} options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: { 
                        callbacks: { 
                          label: ctx => `${ctx.label}: ${ctx.parsed}`
                        },
                        padding: 10,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)'
                      }
                    },
                    cutout: '65%'
                  }} />
                </div>
              </ChartCard>
              
              <div className="flex flex-col gap-6">
                <ChartCard title="Evolución de Promedio de Días">
                  <div ref={chartContainer} className="w-full h-64" />
                </ChartCard>
                
                <ChartCard title="Top 5 Promedio de Días">
                  <div className="h-48">
                    <Bar data={barData} options={{
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.9)'
                        }
                      },
                      scales: {
                        y: { 
                          beginAtZero: true, 
                          grid: {
                            color: 'rgba(226, 232, 240, 0.5)'
                          }
                        },
                        x: { 
                          grid: {
                            display: false
                          }
                        }
                      },
                      interaction: { mode: 'index', intersect: false }
                    }} />
                  </div>
                </ChartCard>
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                  <FaUserInjured className="text-indigo-500" />
                  Lista de Empleados
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Nómina</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider"># Incap</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Días Prom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Empleado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map(i => (
                      <React.Fragment key={i.nomina}>
                        <motion.tr 
                          className="hover:bg-indigo-50 cursor-pointer"
                          whileHover={{ backgroundColor: '#f0f4ff' }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{i.nomina}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                              {i.numero_incapacidades}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                              {i.duracion_promedio}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">{i.empleado.fullName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                tapSound.play();
                                setExpandedRow(expandedRow === i.nomina ? null : i.nomina);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {expandedRow === i.nomina ? <FaChevronUp /> : <FaChevronDown />}
                            </motion.button>
                          </td>
                        </motion.tr>
                        
                        {expandedRow === i.nomina && (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 bg-indigo-50">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-indigo-700">
                                  Detalles de incapacidades
                                </h3>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    tapSound.play();
                                    setSelected(i.nomina);
                                  }}
                                  className="flex items-center gap-1 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-lg"
                                >
                                  Ver todos <FaChevronRight size={12} />
                                </motion.button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {i.recentIncapacities?.map((inc, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-gray-800">
                                          {inc.fecha}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {inc.fechainicio} - {inc.fechafin}
                                        </p>
                                      </div>
                                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                        {inc.daysAway} días
                                      </span>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">
                                      {inc.diagnostico || 'Diagnóstico no disponible'}
                                    </p>
                                  </motion.div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaUserInjured className="text-amber-300" />
                Sistema de Gestión de Incapacidades
              </h3>
              <p className="text-indigo-200 text-sm mt-1">
                © {new Date().getFullYear()} Todos los derechos reservados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur p-3 rounded-xl">
                <FaUserFriends className="text-cyan-300" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Total empleados</p>
                <p className="text-xl font-bold">{data.length}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            nomina={selected}
            details={details}
            loading={detLoading}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Overlay Loader
function FullScreenLoader() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

// Error & NoData
function ErrorBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl text-center shadow-xl"
    >
      <div className="flex items-center justify-center gap-3 mb-3">
        <FaTimes className="text-xl" />
        <h3 className="text-xl font-bold">¡Ups! Ocurrió un error</h3>
      </div>
      <p className="text-rose-100">{message}</p>
    </motion.div>
  );
}

function NoData() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 text-center"
    >
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-12 inline-flex flex-col items-center">
        <div className="bg-indigo-500/10 p-4 rounded-full mb-4">
          <FaSearch className="text-indigo-500 text-3xl" />
        </div>
        <h3 className="text-xl font-bold text-indigo-800 mb-2">No hay datos disponibles</h3>
        <p className="text-gray-600 max-w-md">
          No se encontraron registros de incapacidades con los filtros actuales.
        </p>
      </div>
    </motion.div>
  );
}

// Metric Card
function MetricCard({ icon, title, value, description, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-xl overflow-hidden relative`}
    >
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full"></div>
      
      <div className="relative z-10">
        <div className="mb-4">{icon}</div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="font-semibold text-white/95">{title}</p>
        <p className="font-light text-white/80 text-sm mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

// Chart Card
function ChartCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition flex flex-col border border-gray-200"
    >
      <h4 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center gap-2">
        <FaChartLine className="text-indigo-500" />
        <span>{title}</span>
      </h4>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}

// Detail Modal
function DetailModal({ nomina, details, loading, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Detalle de incapacidades — Nómina {nomina}
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 p-2"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Días</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnóstico</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.map((r, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.fechainicio}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.fechafin}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                          {r.daysAway}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{r.diagnostico || 'No especificado'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}