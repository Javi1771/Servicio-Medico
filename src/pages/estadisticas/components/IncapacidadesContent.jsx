import React, { useMemo, useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement,
         LineElement, BarElement, ArcElement, Title, Tooltip, Legend,
         RadialLinearScale } from 'chart.js';

// Registrar aquí todas las escalas y elementos de Chart.js una sola vez:
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserFriends,
  FaHospital,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaTimes,
  FaUserInjured,
  FaChartLine,
  FaNotesMedical,
  FaUserFriends as FaUserFriends2,
  FaChartBar
} from 'react-icons/fa';

import OverviewTab from './OverviewTab';
import DetailsTab from './DetailsTab';
import EmployeesTab from './EmployeesTab';
import AnalysisTab from './AnalysisTab';

// Función auxiliar para calcular días entre dos fechas (inclusive)
export function calcularDias(inicio, fin) {
  const dateStart = new Date(inicio);
  const dateEnd = new Date(fin);
  const diffMs = dateEnd - dateStart;
  if (isNaN(diffMs) || diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export default function IncapacidadesContent({
  data, loading, error,
  startDate, endDate, setStartDate, setEndDate,
}) {
  const [filteredData, setFilteredData] = useState([]);
  const [timeRange, setTimeRange] = useState('lastMonth');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [employeeDetails, setEmployeeDetails] = useState(null);

  // ——— Cálculo de métricas y chartData (idéntico a antes) ———
  const metrics = useMemo(() => {
    if (loading || !data.length) {
      return {
        totalIncapacities: 0,
        totalDays: 0,
        avgDuration: 0,
        topEmployee: null,
        topDaysEmployee: null,
        departments: [],
        monthlyStats: {},
        incapTypes: {}
      };
    }

    const totalIncapacities = data.length;
    const totalDays = data.reduce(
      (sum, item) => sum + calcularDias(item.fechainicio, item.fechafin), 0
    );
    const avgDuration = totalIncapacities
      ? (totalDays / totalIncapacities).toFixed(1)
      : 0;

    const employeeCounts = data.reduce((acc, item) => {
      const key = item.nomina || 'SIN_NOMINA';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topEmployeeEntry = Object.entries(employeeCounts)
      .sort((a, b) => b[1] - a[1])[0];

    const employeeDays = data.reduce((acc, item) => {
      const key = item.nomina || 'SIN_NOMINA';
      const dias = calcularDias(item.fechainicio, item.fechafin);
      acc[key] = (acc[key] || 0) + dias;
      return acc;
    }, {});
    const topDaysEmployeeEntry = Object.entries(employeeDays)
      .sort((a, b) => b[1] - a[1])[0];

    const deptStats = data.reduce((acc, item) => {
      const dept = item.departamento || 'SIN_DEPARTAMENTO';
      const dias = calcularDias(item.fechainicio, item.fechafin);
      if (!acc[dept]) {
        acc[dept] = { count: 0, days: 0, empleados: new Set() };
      }
      acc[dept].count += 1;
      acc[dept].days += dias;
      acc[dept].empleados.add(item.nomina);
      return acc;
    }, {});
    const topDepts = Object.entries(deptStats).map(([dept, stats]) => ({
      dept,
      count: stats.count,
      avgDays: (stats.days / stats.count).toFixed(1),
      employees: stats.empleados.size
    })).sort((a, b) => b.count - a.count);

    const monthlyStats = data.reduce((acc, item) => {
      const fechaObj = new Date(item.fecha);
      const month = fechaObj.toLocaleString('es-MX', { month: 'short' });
      const dias = calcularDias(item.fechainicio, item.fechafin);
      if (!acc[month]) acc[month] = { count: 0, days: 0 };
      acc[month].count += 1;
      acc[month].days += dias;
      return acc;
    }, {});

    const incapTypes = {
      'Enfermedad General': totalIncapacities * 0.5 | 0,
      'Accidente Laboral': totalIncapacities * 0.3 | 0,
      'Maternidad': totalIncapacities * 0.1 | 0,
      'Otras': totalIncapacities * 0.1 | 0
    };

    return {
      totalIncapacities,
      totalDays,
      avgDuration,
      topEmployee: topEmployeeEntry
        ? {
            nomina: topEmployeeEntry[0],
            count: topEmployeeEntry[1],
            employee: data.find(
              item => (item.nomina || 'SIN_NOMINA') === topEmployeeEntry[0]
            )?.empleado
          }
        : null,
      topDaysEmployee: topDaysEmployeeEntry
        ? {
            nomina: topDaysEmployeeEntry[0],
            days: topDaysEmployeeEntry[1],
            employee: data.find(
              item => (item.nomina || 'SIN_NOMINA') === topDaysEmployeeEntry[0]
            )?.empleado
          }
        : null,
      departments: topDepts,
      monthlyStats,
      incapTypes
    };
  }, [data, loading]);

  const chartData = useMemo(() => {
    if (!data.length) {
      return {
        deptBarData: null,
        employeeDoughnutData: null,
        monthlyLineData: null,
        radarData: null,
        incapTypeData: null
      };
    }

    const deptBarData = {
      labels: metrics.departments.slice(0, 5).map(d => d.dept),
      datasets: [{
        label: 'Incapacidades',
        data: metrics.departments.slice(0, 5).map(d => d.count),
        backgroundColor: COLORS.primary,
        borderRadius: 6,
      }]
    };

    const topEmployees = Object.entries(
      data.reduce((acc, item) => {
        const key = item.nomina || 'SIN_NOMINA';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const employeeDoughnutData = {
      labels: topEmployees.map(([nomina]) => {
        const empObj = data.find(
          i => (i.nomina || 'SIN_NOMINA') === nomina
        )?.empleado;
        return empObj?.fullName || nomina;
      }),
      datasets: [{
        data: topEmployees.map(([, count]) => count),
        backgroundColor: [
          COLORS.primary, COLORS.accent, COLORS.success,
          COLORS.secondary, COLORS.warning
        ],
        borderWidth: 0,
      }]
    };

    const months = Object.keys(metrics.monthlyStats).sort((a, b) => {
      const monthsOrder = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return monthsOrder.indexOf(a) - monthsOrder.indexOf(b);
    });
    const monthlyLineData = {
      labels: months,
      datasets: [
        {
          label: 'Incapacidades',
          data: months.map(m => metrics.monthlyStats[m]?.count || 0),
          borderColor: COLORS.primary,
          backgroundColor: `${COLORS.primary}20`,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Días promedio',
          data: months.map(m => {
            const obj = metrics.monthlyStats[m];
            return obj && obj.count
              ? (obj.days / obj.count).toFixed(1) : 0;
          }),
          borderColor: COLORS.accent,
          backgroundColor: `${COLORS.accent}20`,
          tension: 0.4,
        }
      ]
    };

    const radarData = {
      labels: metrics.departments.slice(0, 6).map(d => d.dept),
      datasets: [
        {
          label: 'Incapacidades',
          data: metrics.departments.slice(0, 6).map(d => d.count),
          backgroundColor: `${COLORS.primary}30`,
          borderColor: COLORS.primary,
          pointBackgroundColor: COLORS.primary,
        },
        {
          label: 'Días promedio',
          data: metrics.departments.slice(0, 6).map(d => d.avgDays),
          backgroundColor: `${COLORS.accent}30`,
          borderColor: COLORS.accent,
          pointBackgroundColor: COLORS.accent,
        }
      ]
    };

    const incapTypeData = {
      labels: Object.keys(metrics.incapTypes || {}),
      datasets: [{
        data: Object.values(metrics.incapTypes || {}),
        backgroundColor: [
          COLORS.primary, COLORS.secondary,
          COLORS.success, COLORS.warning, COLORS.info
        ],
        borderWidth: 0,
      }]
    };

    return {
      deptBarData,
      employeeDoughnutData,
      monthlyLineData,
      radarData,
      incapTypeData
    };
  }, [data, metrics]);

  useEffect(() => {
    let result = [...data];
    if (departmentFilter !== 'all') {
      result = result.filter(
        item => (item.departamento || '') === departmentFilter
      );
    }
    setFilteredData(result);
  }, [departmentFilter, data]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const today = new Date();
    let newStartDate = null;
    switch(range) {
      case 'lastWeek':
        newStartDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'lastMonth':
        newStartDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'lastQuarter':
        newStartDate = new Date(today.setMonth(today.getMonth() - 3));
        break;
      case 'lastYear':
        newStartDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      default:
        newStartDate = null;
    }
    setStartDate(newStartDate);
    setEndDate(new Date());
  };

  const departments = useMemo(() => {
    if (!data.length) return [];
    return [...new Set(data.map(item => item.departamento || 'SIN_DEPARTAMENTO'))];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 mb-6">
            <motion.div
              className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-4 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-full flex items-center justify-center">
              <FaUserFriends className="text-white text-2xl" />
            </div>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-cyan-100 text-lg font-light tracking-wide"
          >
            Cargando información de empleados...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-4">
        <div className="bg-red-500 text-white p-8 rounded-2xl text-center max-w-md">
          <FaHospital className="text-3xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error al cargar datos</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-red-500 py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-4">
        <div className="bg-white p-8 rounded-2xl text-center max-w-md">
          <FaSearch className="text-3xl mx-auto mb-4 text-indigo-500" />
          <h2 className="text-2xl font-bold mb-2">No se encontraron datos</h2>
          <p className="text-gray-600 mb-6">
            No hay registros de incapacidades para los filtros seleccionados.
          </p>
          <button 
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setDepartmentFilter('all');
            }}
            className="bg-indigo-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-600 transition"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50">
      <header className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white p-4 shadow-2xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FaUserInjured className="text-cyan-300" />
              <span>Dashboard de Incapacidades</span>
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              Análisis y seguimiento de incapacidades médicas
            </p>
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
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
                setDepartmentFilter('all');
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <FaSyncAlt /> 
              <span className="hidden md:inline">Actualizar</span>
            </motion.button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 w-full bg-white rounded-t-2xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-indigo-800">Filtros</h2>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <FaTimes className="text-gray-500 text-xl" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Fecha inicial</label>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Fecha final</label>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                  />
                </div>
                
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Departamento</label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  >
                    <option value="all">Todos</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-8">
        <div className="flex border-b border-gray-200 mb-8">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<FaChartLine />}
          >
            Resumen
          </TabButton>
          <TabButton 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')}
            icon={<FaNotesMedical />}
          >
            Detalles
          </TabButton>
          <TabButton 
            active={activeTab === 'employees'} 
            onClick={() => setActiveTab('employees')}
            icon={<FaUserFriends2 />}
          >
            Empleados
          </TabButton>
          <TabButton 
            active={activeTab === 'analysis'} 
            onClick={() => setActiveTab('analysis')}
            icon={<FaChartBar />}
          >
            Análisis
          </TabButton>
        </div>
        
        <div className="hidden md:flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-md">
          <div className="flex items-center gap-4">
            <div>
              <label className="block mb-1 text-sm text-gray-600">Rango de tiempo</label>
              <div className="flex gap-2">
                {['lastWeek', 'lastMonth', 'lastQuarter', 'lastYear'].map(range => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      timeRange === range 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range === 'lastWeek' && 'Última semana'}
                    {range === 'lastMonth' && 'Último mes'}
                    {range === 'lastQuarter' && 'Último trimestre'}
                    {range === 'lastYear' && 'Último año'}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-sm text-gray-600">Fechas personalizadas</label>
              <div className="flex gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  className="px-3 py-1 border border-gray-200 rounded-lg w-36"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Inicio"
                />
                <span className="self-center">a</span>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  className="px-3 py-1 border border-gray-200 rounded-lg w-36"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Fin"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block mb-1 text-sm text-gray-600">Departamento</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl min-w-[180px]"
            >
              <option value="all">Todos los departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        {activeTab === 'overview' && (
          <OverviewTab metrics={metrics} chartData={chartData} data={data} />
        )}
        
        {activeTab === 'details' && (
          <DetailsTab 
            data={filteredData} 
            setEmployeeDetails={setEmployeeDetails} 
            calcularDias={calcularDias}
          />
        )}
        
        {activeTab === 'employees' && (
          <EmployeesTab 
            data={filteredData} 
            setEmployeeDetails={setEmployeeDetails} 
            calcularDias={calcularDias}
          />
        )}
        
        {activeTab === 'analysis' && (
          <AnalysisTab chartData={chartData} metrics={metrics} />
        )}
      </main>

      <footer className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-indigo-200">
            Sistema de Gestión de Incapacidades © {new Date().getFullYear()}
          </p>
          <p className="text-indigo-300 text-sm mt-1">
            Total de registros analizados: {data.length}
          </p>
        </div>
      </footer>

      {employeeDetails && (
        <EmployeeDetailModal 
          employee={employeeDetails} 
          onClose={() => setEmployeeDetails(null)} 
          calcularDias={calcularDias}
        />
      )}
    </div>
  );
}

// ——— Sub‐componentes auxiliares para IncapacidadesContent.jsx ———

function TabButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-2 font-medium text-sm md:text-base transition-colors ${
        active 
          ? 'text-indigo-600 border-b-2 border-indigo-600' 
          : 'text-gray-500 hover:text-indigo-500'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function EmployeeDetailModal({ employee, onClose, calcularDias }) {
  const dias = calcularDias(employee.fechainicio, employee.fechafin);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Detalle de Incapacidad</h2>
              <button onClick={onClose} className="text-white hover:text-gray-200 p-2">
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="bg-indigo-100/20 w-16 h-16 rounded-full flex items-center justify-center">
                <FaUserFriends className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-xl">
                  {employee.empleado?.fullName || employee.nombrepaciente || 'N/A'}
                </h3>
                <p className="text-indigo-200">
                  {employee.empleado?.puesto || 'Puesto no disponible'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">Información básica</h4>
                <div className="space-y-2">
                  <InfoItem label="Nómina" value={employee.nomina || '—'} />
                  <InfoItem label="Departamento" value={employee.departamento || '—'} />
                  <InfoItem 
                    label="Fecha registro" 
                    value={new Date(employee.fecha).toLocaleDateString('es-MX')} 
                  />
                  <InfoItem label="Días de incapacidad" value={`${dias} días`} />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">Detalles médicos</h4>
                <div className="space-y-2">
                  <InfoItem 
                    label="Inicio" 
                    value={new Date(employee.fechainicio).toLocaleDateString('es-MX')} 
                  />
                  <InfoItem 
                    label="Fin" 
                    value={new Date(employee.fechafin).toLocaleDateString('es-MX')} 
                  />
                  <InfoItem label="Proveedor" value={employee.nombreproveedor || '—'} />
                  <InfoItem label="Observaciones" value={employee.observaciones || '—'} />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-bold text-gray-800 mb-3">Información SOAP</h4>
              {employee.empleado ? (
                <div className="space-y-2">
                  <InfoItem label="CURP" value={employee.empleado.curp || '—'} />
                  <InfoItem label="RFC" value={employee.empleado.rfc || '—'} />
                  <InfoItem label="Sexo" value={employee.empleado.sexo || '—'} />
                  <InfoItem label="Correo" value={employee.empleado.correo || '—'} />
                  <InfoItem label="Teléfono" value={employee.empleado.telefono || '—'} />
                  <InfoItem 
                    label="Fecha alta" 
                    value={employee.empleado.fecha_alta 
                      ? new Date(employee.empleado.fecha_alta).toLocaleDateString('es-MX')
                      : '—'} 
                  />
                  <InfoItem 
                    label="Fecha baja" 
                    value={employee.empleado.fecha_baja 
                      ? new Date(employee.empleado.fecha_baja).toLocaleDateString('es-MX')
                      : '—'} 
                  />
                </div>
              ) : (
                <p className="text-gray-600">
                  No hay datos SOAP disponibles o hubo error.
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={onClose}
                className="bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cerrar
              </button>
              <button className="bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
                Generar reporte
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// Paleta de colores para IncapacidadesContent.jsx
const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#F97316',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  dark: '#1F2937',
  light: '#F9FAFB'
};
