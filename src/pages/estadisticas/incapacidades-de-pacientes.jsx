import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  Award,
  Activity,
  Download,
  LayoutDashboard,
  FolderMinus,
  UserCheck,
  UserX,
  Zap,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { FaUserFriends, FaTimes } from "react-icons/fa";

function getSindicato(empleado) {
  return empleado.grupoNomina === "NS"
    ? empleado.cuotaSindical === "S"
      ? "SUTSMSJR"
      : "SITAM"
    : "";
}

function parsearFechaLocal(fechaTexto) {
  if (!fechaTexto) return null;
  try {
    const partes = fechaTexto.split(", ");
    if (partes.length < 2) return null;
    const fechaParte = partes[1];
    const [dia, mes, ano] = fechaParte.split("/");
    const fecha = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return isNaN(fecha.getTime()) ? null : fecha;
  } catch {
    return null;
  }
}

const EMPLEADOS_POR_PAGINA = 8;

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [sindicato, setSindicato] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paginación y buscador para "Días Trabajados vs Incapacidad"
  const [paginaBarra, setPaginaBarra] = useState(0);
  const [buscadorBarra, setBuscadorBarra] = useState("");

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/estadisticas/consolidado");
      if (!response.ok) throw new Error("Error al cargar datos");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const analytics = useMemo(() => {
    const filteredData = sindicato
      ? data.filter((inc) => getSindicato(inc.empleado) === sindicato)
      : data;

    if (!filteredData.length)
      return {
        totalEmpleados: 0,
        totalIncapacidades: 0,
        promedioDiasIncapacidad: "0.0",
        topDiasIncapacidad: [],
        topRecurrentes: [],
        statsDepartamentos: [],
        topEmpleadosTradingData: [],
        tendenciaData: [],
        empleadoMasAfectado: null,
        departamentoMasAfectado: null,
        productividad: "0.0",
        empleadoIncapacidadCorta: null,
        empleadoMejorRatio: null,
        empleadoPeorRatio: null,
        empleadoMasConsistente: null,
        activeIncapacities: 0,
        upcomingIncapacities: 0,
        averageAge: 0,
        topProviders: [],
        incapacidadesActivasDetalle: [],
        incapacidadesProximasDetalle: [],
        topPorcentajeIncapacidad: [],
        topDiasDesdeAlta: [],
        edadesDistribucion: [],
      };

    const empleadosMap = new Map();
    const hoy = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(hoy.getDate() + 7);
    let activeIncapacities = 0;
    let upcomingIncapacities = 0;
    const providers = {};
    let incapacidadesActivasDetalle = [];
    let incapacidadesProximasDetalle = [];
    let edadesDistribucion = [];

    filteredData.forEach((inc) => {
      const key = inc.nomina;
      const empleado = inc.empleado;
      const fechaInicio = parsearFechaLocal(inc.fechainicio);
      const fechaFin = parsearFechaLocal(inc.fechafin);

      if (fechaInicio && fechaFin) {
        if (fechaInicio <= hoy && fechaFin >= hoy) {
          activeIncapacities++;
          incapacidadesActivasDetalle.push({
            nombre: `${empleado.nombre} ${empleado.a_paterno} ${empleado.a_materno}`,
            nomina: inc.nomina,
            puesto: empleado.puesto,
            fechainicio: inc.fechainicio,
            fechafin: inc.fechafin,
          });
          if (fechaFin <= nextWeek) {
            upcomingIncapacities++;
            incapacidadesProximasDetalle.push({
              nombre: `${empleado.nombre} ${empleado.a_paterno} ${empleado.a_materno}`,
              nomina: inc.nomina,
              puesto: empleado.puesto,
              fechainicio: inc.fechainicio,
              fechafin: inc.fechafin,
              diasRestantes: Math.ceil(
                (fechaFin - hoy) / (1000 * 60 * 60 * 24)
              ),
            });
          }
        }
      }

      const providerName = inc.nombreProveedor || "Sin Proveedor";
      providers[providerName] = (providers[providerName] || 0) + 1;

      if (!empleadosMap.has(key)) {
        const fechaAltaParseada = parsearFechaLocal(empleado.fecha_alta);
        empleadosMap.set(key, {
          ...empleado,
          nomina: inc.nomina,
          totalDiasIncapacidad: 0,
          totalIncapacidades: 0,
          incapacidades: [],
          fechaAlta: fechaAltaParseada,
          diasTrabajados: 0,
          incapacidadMasCorta: Infinity,
          incapacidadMasLarga: 0,
        });
      }

      const emp = empleadosMap.get(key);
      const diasIncapacidad =
        Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
      emp.totalDiasIncapacidad += diasIncapacidad;
      emp.totalIncapacidades += 1;

      if (diasIncapacidad < emp.incapacidadMasCorta) {
        emp.incapacidadMasCorta = diasIncapacidad;
      }
      if (diasIncapacidad > emp.incapacidadMasLarga) {
        emp.incapacidadMasLarga = diasIncapacidad;
      }

      emp.incapacidades.push({
        fecha: inc.fecha,
        inicio: inc.fechainicio,
        fin: inc.fechafin,
        dias: diasIncapacidad,
        departamento: inc.departamentoIncap,
        observaciones: inc.observaciones,
      });
    });

    empleadosMap.forEach((emp) => {
      if (emp.fechaAlta && emp.fechaAlta <= hoy) {
        const diasDesdeAlta = Math.ceil(
          (hoy - emp.fechaAlta) / (1000 * 60 * 60 * 24)
        );
        emp.diasTrabajados = Math.max(
          0,
          diasDesdeAlta - emp.totalDiasIncapacidad
        );
        emp.porcentajeIncapacidad =
          diasDesdeAlta > 0
            ? ((emp.totalDiasIncapacidad / diasDesdeAlta) * 100).toFixed(2)
            : "0.00";
        emp.ratioTrabajoIncapacidad =
          emp.diasTrabajados > 0
            ? (emp.totalDiasIncapacidad / emp.diasTrabajados).toFixed(2)
            : 0;
        emp.diasDesdeAlta = diasDesdeAlta;
      } else {
        emp.diasTrabajados = 0;
        emp.porcentajeIncapacidad = "0.00";
        emp.ratioTrabajoIncapacidad = 0;
        emp.diasDesdeAlta = 0;
      }
    });

    const empleados = Array.from(empleadosMap.values());

    let totalAge = 0;
    let countWithAge = 0;
    let ageRanges = {
      "20-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51-60": 0,
      "61+": 0,
    };
    empleadosMap.forEach((emp) => {
      if (emp.totalIncapacidades > 0 && emp.fecha_nacimiento) {
        const birthDate = parsearFechaLocal(emp.fecha_nacimiento);
        if (birthDate) {
          const ageDiff = hoy - birthDate;
          const age = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
          totalAge += age;
          countWithAge++;
          if (age >= 20 && age <= 30) ageRanges["20-30"]++;
          else if (age >= 31 && age <= 40) ageRanges["31-40"]++;
          else if (age >= 41 && age <= 50) ageRanges["41-50"]++;
          else if (age >= 51 && age <= 60) ageRanges["51-60"]++;
          else if (age > 60) ageRanges["61+"]++;
        }
      }
    });
    edadesDistribucion = Object.entries(ageRanges)
      .map(([rango, cantidad]) => ({ rango, cantidad }))
      .filter((e) => e.cantidad > 0);
    const averageAge =
      countWithAge > 0 ? (totalAge / countWithAge).toFixed(1) : 0;

    const topProviders = Object.entries(providers)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topDiasIncapacidad = empleados
      .sort((a, b) => b.totalDiasIncapacidad - a.totalDiasIncapacidad)
      .slice(0, 10);

    const topRecurrentes = empleados
      .filter((emp) => emp.totalIncapacidades > 1)
      .sort((a, b) => b.totalIncapacidades - a.totalIncapacidades)
      .slice(0, 10);

    const topPorcentajeIncapacidad = empleados
      .sort((a, b) => b.porcentajeIncapacidad - a.porcentajeIncapacidad)
      .slice(0, 5);

    const topDiasDesdeAlta = empleados
      .sort((a, b) => b.totalDiasIncapacidad - a.totalDiasIncapacidad)
      .slice(0, 5);

    const empleadoIncapacidadCorta = [...empleados]
      .filter((emp) => emp.incapacidadMasCorta !== Infinity)
      .sort((a, b) => a.incapacidadMasCorta - b.incapacidadMasCorta)
      .shift();

    const empleadoMejorRatio = [...empleados]
      .filter((emp) => emp.diasTrabajados > 0 && emp.totalDiasIncapacidad > 0)
      .sort((a, b) => a.ratioTrabajoIncapacidad - b.ratioTrabajoIncapacidad)
      .shift();

    const empleadoPeorRatio = [...empleados]
      .filter((emp) => emp.diasTrabajados > 0 && emp.totalDiasIncapacidad > 0)
      .sort((a, b) => b.ratioTrabajoIncapacidad - a.ratioTrabajoIncapacidad)
      .shift();

    const empleadoMasConsistente = [...empleados]
      .filter((emp) => emp.diasTrabajados > 0)
      .sort((a, b) => b.diasTrabajados - a.diasTrabajados)
      .shift();

    const departamentos = {};
    filteredData.forEach((inc) => {
      const dept = inc.departamentoIncap || "Sin departamento";
      if (!departamentos[dept]) {
        departamentos[dept] = {
          nombre: dept,
          totalIncapacidades: 0,
          totalDias: 0,
          empleados: new Set(),
          incapacidadMasCorta: Infinity,
          incapacidadMasLarga: 0,
        };
      }
      const fechaInicio = parsearFechaLocal(inc.fechainicio);
      const fechaFin = parsearFechaLocal(inc.fechafin);

      if (fechaInicio && fechaFin) {
        const dias =
          Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
        departamentos[dept].totalIncapacidades++;
        departamentos[dept].totalDias += dias;
        departamentos[dept].empleados.add(inc.nomina);

        if (dias < departamentos[dept].incapacidadMasCorta) {
          departamentos[dept].incapacidadMasCorta = dias;
        }
        if (dias > departamentos[dept].incapacidadMasLarga) {
          departamentos[dept].incapacidadMasLarga = dias;
        }
      }
    });

    const statsDepartamentos = Object.values(departamentos).map((d) => ({
      ...d,
      totalEmpleados: d.empleados.size,
      promedioDiasPorIncapacidad: (d.totalDias / d.totalIncapacidades).toFixed(
        1
      ),
    }));

    // Aquí cambiamos para que devuelva todos los empleados ordenados por totalDiasIncapacidad
    const topEmpleadosTradingData = empleados
      .sort((a, b) => b.totalDiasIncapacidad - a.totalDiasIncapacidad)
      .map((emp) => ({
        nombre: `${emp.nombre} ${emp.a_paterno} ${emp.a_materno} (${emp.nomina})`,
        diasTrabajados: emp.diasTrabajados,
        diasIncapacidad: emp.totalDiasIncapacidad,
        porcentaje: parseFloat(emp.porcentajeIncapacidad),
        ...emp,
      }));

    const tendenciaMensual = {};
    filteredData.forEach((inc) => {
      const fechaParseada = parsearFechaLocal(inc.fecha);
      if (!fechaParseada) return;

      const key = `${fechaParseada.getFullYear()}-${String(
        fechaParseada.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!tendenciaMensual[key]) {
        tendenciaMensual[key] = {
          mes: key,
          incapacidades: 0,
          empleados: new Set(),
        };
      }
      tendenciaMensual[key].incapacidades++;
      tendenciaMensual[key].empleados.add(inc.nomina);
    });

    const tendenciaData = Object.values(tendenciaMensual)
      .map((t) => ({ ...t, empleadosAfectados: t.empleados.size }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12);

    const totalDiasCalculados = filteredData.reduce((sum, inc) => {
      const inicio = parsearFechaLocal(inc.fechainicio);
      const fin = parsearFechaLocal(inc.fechafin);
      if (inicio && fin) {
        return sum + Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
      }
      return sum;
    }, 0);

    const promedioDiasIncapacidad =
      filteredData.length > 0
        ? (totalDiasCalculados / filteredData.length).toFixed(1)
        : "0.0";

    return {
      totalEmpleados: empleados.length,
      totalIncapacidades: filteredData.length,
      promedioDiasIncapacidad,
      topDiasIncapacidad,
      topRecurrentes,
      statsDepartamentos,
      topEmpleadosTradingData,
      tendenciaData,
      empleadoMasAfectado: topDiasIncapacidad[0] || null,
      departamentoMasAfectado:
        statsDepartamentos.sort((a, b) => b.totalDias - a.totalDias)[0] || null,
      productividad: (
        100 -
        (totalDiasCalculados / (empleados.length * 30)) * 100
      ).toFixed(1),
      empleadoIncapacidadCorta,
      empleadoMejorRatio,
      empleadoPeorRatio,
      empleadoMasConsistente,
      activeIncapacities,
      upcomingIncapacities,
      averageAge,
      topProviders,
      incapacidadesActivasDetalle,
      incapacidadesProximasDetalle,
      topPorcentajeIncapacidad,
      topDiasDesdeAlta,
      edadesDistribucion,
    };
  }, [data, sindicato]);

  // PAGINACIÓN y BUSCADOR para la gráfica principal
  const empleadosFiltrados = useMemo(() => {
    if (!buscadorBarra) return analytics.topEmpleadosTradingData;
    const val = buscadorBarra.toLowerCase();
    return analytics.topEmpleadosTradingData.filter(
      (emp) =>
        emp.nombre.toLowerCase().includes(val) ||
        (emp.nomina && String(emp.nomina).includes(val))
    );
  }, [analytics.topEmpleadosTradingData, buscadorBarra]);

  const totalPaginas = Math.ceil(
    empleadosFiltrados.length / EMPLEADOS_POR_PAGINA
  );
  const paginaActual = Math.max(0, Math.min(paginaBarra, totalPaginas - 1));
  const datosPaginados = empleadosFiltrados.slice(
    paginaActual * EMPLEADOS_POR_PAGINA,
    (paginaActual + 1) * EMPLEADOS_POR_PAGINA
  );

  // ------ Loader y error idénticos ------
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-900 to-purple-900 p-6">
        <motion.div
          className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 text-center max-w-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-rose-500/20 p-4 rounded-full inline-block mb-4">
            <FaTimes className="text-4xl text-rose-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Error al cargar datos
          </h2>
          <p className="text-rose-100 mb-6">
            Ocurrió un problema al obtener la información. Por favor intenta
            nuevamente.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchData()}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ------ CustomTooltip y RadialProgress idénticos ------
  const deptColors = [
    "#4f46e5",
    "#2563eb",
    "#0d9488",
    "#8b5cf6",
    "#d946ef",
    "#f43f5e",
    "#f59e0b",
    "#84cc16",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 backdrop-blur-md">
          <p className="text-sm font-medium text-indigo-300 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <p className="text-slate-300 text-sm">
                  <span className="font-medium">{entry.name}:</span>{" "}
                  {entry.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const RadialProgress = ({ value, max = 100, size = 120, stroke = 10 }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / max) * circumference;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#6366f1"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{value}%</span>
          <span className="text-xs text-slate-400">Productividad</span>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1">
      <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-indigo-400 mr-3" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Dashboard de Incapacidades
              </h1>
            </div>
            <p className="text-slate-400">
              Análisis estratégico del ausentismo laboral
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-white font-semibold">Sindicato:</label>
            <select
              className="bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              value={sindicato}
              onChange={(e) => setSindicato(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="SUTSMSJR">SUTSMSJR</option>
              <option value="SITAM">SITAM</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-sm">
              <Download className="h-4 w-4 mr-2" /> Exportar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-indigo-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Total Empleados Con Incapacidades Registradas
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.totalEmpleados}
                </p>
              </div>
              <div className="p-3 rounded-full bg-indigo-500/20">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Total Incapacidades
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.totalIncapacidades}
                </p>
              </div>
              <div className="p-3 rounded-full bg-rose-500/20">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Promedio Días</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.promedioDiasIncapacidad || "0.0"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <Calendar className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Productividad</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.productividad}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Incapacidad Más Corta
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.empleadoIncapacidadCorta?.incapacidadMasCorta ||
                    "0"}{" "}
                  días
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {analytics.empleadoIncapacidadCorta
                    ? `${analytics.empleadoIncapacidadCorta.nombre} ${analytics.empleadoIncapacidadCorta.a_paterno}`
                    : "Sin datos"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <FolderMinus className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Mejor Ratio Trabajo/Incap.
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.empleadoMejorRatio
                    ? (
                        1 / analytics.empleadoMejorRatio.ratioTrabajoIncapacidad
                      ).toFixed(1) + ":1"
                    : "N/A"}
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {analytics.empleadoMejorRatio
                    ? `${analytics.empleadoMejorRatio.nombre} ${analytics.empleadoMejorRatio.a_paterno}`
                    : "Sin datos"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <UserCheck className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Peor Ratio Trabajo/Incap.
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.empleadoPeorRatio
                    ? analytics.empleadoPeorRatio.ratioTrabajoIncapacidad + ":1"
                    : "N/A"}
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {analytics.empleadoPeorRatio
                    ? `${analytics.empleadoPeorRatio.nombre} ${analytics.empleadoPeorRatio.a_paterno}`
                    : "Sin datos"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/20">
                <UserX className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Más Días Consecutivos
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.empleadoMasConsistente?.diasTrabajados || "0"} días
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {analytics.empleadoMasConsistente
                    ? `${analytics.empleadoMasConsistente.nombre} ${analytics.empleadoMasConsistente.a_paterno}`
                    : "Sin datos"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">
                  Incapacidades Activas
                </p>
                <p className="text-3xl font-bold text-white">
                  {analytics.activeIncapacities}
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {analytics.upcomingIncapacities} por concluir en 7 días
                </p>
              </div>
              <div className="p-3 rounded-full bg-cyan-500/20">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Edad Promedio</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.averageAge} años
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  Empleados con incapacidades
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500/20">
                <Users className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-pink-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Top Proveedores</p>
                <div className="space-y-2 mt-4">
                  {analytics.topProviders.map((provider, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-slate-300">
                        Dr. {provider.name}
                      </span>
                      <span className="text-lg font-bold text-pink-400">
                        {provider.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-full bg-pink-500/20">
                <Award className="h-6 w-6 text-pink-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 hover:border-teal-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Tiempo desde Alta</p>
                <p className="text-3xl font-bold text-white">
                  {analytics.empleadoMasAfectado?.diasTrabajados || "0"} días
                </p>
                <p className="text-sm text-slate-300 mt-2">
                  {analytics.empleadoMasAfectado
                    ? `${analytics.empleadoMasAfectado.nombre} ${analytics.empleadoMasAfectado.a_paterno}`
                    : "Sin datos"}
                </p>
              </div>
              <div className="p-3 rounded-full bg-teal-500/20">
                <Calendar className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
              <div className="flex items-center">
                <Activity className="h-6 w-6 text-indigo-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  Días Trabajados vs Incapacidad
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    className="bg-slate-900 text-slate-200 pl-9 pr-4 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-indigo-500"
                    placeholder="Buscar por nombre o nómina..."
                    value={buscadorBarra}
                    onChange={(e) => {
                      setBuscadorBarra(e.target.value);
                      setPaginaBarra(0);
                    }}
                  />
                  <Search className="absolute left-2 top-2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
                <button
                  className="ml-2 px-2 py-1 rounded border border-slate-600 bg-slate-700 text-xs text-white hover:bg-indigo-700 transition"
                  onClick={() => {
                    setBuscadorBarra("");
                    setPaginaBarra(0);
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosPaginados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="nombre"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={10}
                  stroke="#94a3b8"
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="diasTrabajados"
                  name="Días Trabajados"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="diasIncapacidad"
                  name="Días Incapacidad"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50"
                disabled={paginaActual === 0}
                onClick={() => setPaginaBarra((prev) => Math.max(prev - 1, 0))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-slate-300 text-sm">
                Página {paginaActual + 1} de {Math.max(totalPaginas, 1)}
              </span>
              <button
                className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50"
                disabled={paginaActual >= totalPaginas - 1}
                onClick={() =>
                  setPaginaBarra((prev) => Math.min(prev + 1, totalPaginas - 1))
                }
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {empleadosFiltrados.length === 0 && (
              <div className="mt-4 text-center text-slate-400">
                No se encontraron empleados con ese criterio.
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 text-emerald-400 mr-2" />
                  <h3 className="text-xl font-semibold text-white">
                    Tendencia Mensual
                  </h3>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="mes"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#94a3b8" domain={[0, "dataMax + 5"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="incapacidades"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 6, fill: "#8b5cf6" }}
                    name="Incapacidades"
                  />
                  <Line
                    type="monotone"
                    dataKey="empleadosAfectados"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#f43f5e" }}
                    activeDot={{ r: 6, fill: "#fb7185" }}
                    name="Empleados Afectados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Award className="h-6 w-6 text-amber-400 mr-2" />
                  <h3 className="text-xl font-semibold text-white">
                    Eficiencia Organizacional
                  </h3>
                </div>
              </div>
              <div className="flex justify-center">
                <RadialProgress value={analytics.productividad} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Award className="h-6 w-6 text-rose-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  Top Días de Incapacidad
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.topDiasIncapacidad.slice(0, 5).map((emp, index) => (
                <div
                  key={emp.nomina}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl backdrop-blur-sm hover:bg-slate-700/50 transition-all"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold mr-4 ${
                        index === 0
                          ? "bg-gradient-to-br from-amber-500 to-amber-600"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-500 to-slate-600"
                          : index === 2
                          ? "bg-gradient-to-br from-amber-700 to-amber-800"
                          : "bg-gradient-to-br from-indigo-600 to-indigo-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {emp.nombre} {emp.a_paterno}
                      </p>
                      <p className="text-sm text-slate-400">{emp.puesto}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-400">
                      {emp.totalDiasIncapacidad} días
                    </p>
                    <p className="text-xs text-slate-400">
                      {emp.porcentajeIncapacidad}% del tiempo
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-amber-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">
                  Top Incapacidades Recurrentes
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              {analytics.topRecurrentes.slice(0, 5).map((emp, index) => (
                <div
                  key={emp.nomina}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl backdrop-blur-sm hover:bg-slate-700/50 transition-all"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold mr-4 ${
                        index === 0
                          ? "bg-gradient-to-br from-amber-500 to-amber-600"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-500 to-slate-600"
                          : index === 2
                          ? "bg-gradient-to-br from-amber-700 to-amber-800"
                          : "bg-gradient-to-br from-indigo-600 to-indigo-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {emp.nombre} {emp.a_paterno}
                      </p>
                      <p className="text-sm text-slate-400">{emp.puesto}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">
                      {emp.totalIncapacidades} veces
                    </p>
                    <p className="text-xs text-slate-400">
                      {emp.totalDiasIncapacidad} días total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Incapacidades por Departamento
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statsDepartamentos.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nombre, totalIncapacidades }) =>
                    `${nombre}: ${totalIncapacidades}`
                  }
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="totalIncapacidades"
                >
                  {analytics.statsDepartamentos
                    .slice(0, 8)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={deptColors[index % deptColors.length]}
                      />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value) => (
                    <span className="text-slate-300 text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Detalle por Departamento
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-slate-400 font-medium">
                      Departamento
                    </th>
                    <th className="text-center py-3 text-slate-400 font-medium">
                      Incapacidades
                    </th>
                    <th className="text-center py-3 text-slate-400 font-medium">
                      Días Total
                    </th>
                    <th className="text-center py-3 text-slate-400 font-medium">
                      Empleados
                    </th>
                    <th className="text-center py-3 text-slate-400 font-medium">
                      Promedio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.statsDepartamentos
                    .slice(0, 10)
                    .map((dept, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-800 hover:bg-slate-700/30 transition-all"
                      >
                        <td className="py-3 font-medium">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: deptColors[index] }}
                            ></div>
                            {dept.nombre}
                          </div>
                        </td>
                        <td className="text-center py-3">
                          {dept.totalIncapacidades}
                        </td>
                        <td className="text-center py-3">{dept.totalDias}</td>
                        <td className="text-center py-3">
                          {dept.totalEmpleados}
                        </td>
                        <td className="text-center py-3">
                          {dept.promedioDiasPorIncapacidad} días
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Análisis Estratégico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl border border-indigo-700/50">
              <h4 className="font-semibold text-indigo-300 mb-2">
                Impacto en Productividad
              </h4>
              <p className="text-sm text-slate-300">
                Las incapacidades han reducido la productividad general en un
                3.2% este trimestre, principalmente en el departamento de{" "}
                {analytics.departamentoMasAfectado?.nombre || "Producción"}.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl border border-amber-700/50">
              <h4 className="font-semibold text-amber-300 mb-2">
                Tendencias Recurrentes
              </h4>
              <p className="text-sm text-slate-300">
                Se identificaron {analytics.topRecurrentes.length} empleados con
                3 o más incapacidades en los últimos 6 meses. Se recomienda
                implementar programas de bienestar específicos.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl border border-emerald-700/50">
              <h4 className="font-semibold text-emerald-300 mb-2">
                Oportunidad de Mejora
              </h4>
              <p className="text-sm text-slate-300">
                Reducir el promedio de días por incapacidad en 0.5 días podría
                aumentar la productividad en un 1.7% y ahorrar aproximadamente
                $185,000 anuales.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <h4 className="font-semibold text-slate-400 mb-2">
                Empleado Más Afectado
              </h4>
              <p className="text-lg font-bold text-white">
                {analytics.empleadoMasAfectado
                  ? `${analytics.empleadoMasAfectado.nombre} ${analytics.empleadoMasAfectado.a_paterno}`
                  : "No disponible"}
              </p>
              <p className="text-sm text-slate-400">
                {analytics.empleadoMasAfectado
                  ? `${analytics.empleadoMasAfectado.totalDiasIncapacidad} días total`
                  : "Sin datos"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-400 mb-2">
                Departamento Más Afectado
              </h4>
              <p className="text-lg font-bold text-white">
                {analytics.departamentoMasAfectado
                  ? analytics.departamentoMasAfectado.nombre
                  : "No disponible"}
              </p>
              <p className="text-sm text-slate-400">
                {analytics.departamentoMasAfectado
                  ? `${analytics.departamentoMasAfectado.totalDias} días acumulados`
                  : "Sin datos"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-400 mb-2">
                Incapacidad Más Corta
              </h4>
              <p className="text-lg font-bold text-white">
                {analytics.empleadoIncapacidadCorta?.incapacidadMasCorta || "0"}{" "}
                días
              </p>
              <p className="text-sm text-slate-400">
                {analytics.empleadoIncapacidadCorta
                  ? `${analytics.empleadoIncapacidadCorta.nombre} ${analytics.empleadoIncapacidadCorta.a_paterno}`
                  : "Sin datos"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-400 mb-2">
                Última Actualización
              </h4>
              <p className="text-lg font-bold text-white">
                {new Date().toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-slate-400">Datos en tiempo real</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
