"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  FaSyncAlt,
  FaTimes,
  FaSearch,
  FaUsers,
  FaCoins,
  FaPercentage,
  FaLayerGroup,
  FaChevronUp,
  FaChevronDown,
  FaFilePdf,
  FaUserAlt,
  FaFilter,
  FaIdCard,
  FaBuilding,
  FaUserFriends,
  FaChild,
  FaRing,
  FaHeart,
  FaUser,
  FaCrown,
  FaFileExcel,
  FaArrowLeft,
} from "react-icons/fa";
import { TbFolderCancel } from "react-icons/tb";
import { AnimatePresence, motion } from "framer-motion";
import MissingBeneficiaries from "./components/MissingBeneficiaries";
import DocumentModal from "./components/DocumentModal";
import { exportToExcel } from "../../utils/exportUtils";
import { useRouter } from "next/router";

const PAGE_SIZE = 12;

export default function EmpleadosBeneficiarios() {
  //* Sonido de interacción
  const tapSound = useMemo(() => new Audio("/assets/tap.mp3"), []);
  const router = useRouter();

  //* Estados principales
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    withBenefits: 0,
    hijos: 0,
    esposos: 0,
    concubinos: 0,
    padres: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //* Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [sindFilter, setSindFilter] = useState("");
  const [beneficiaryTypeFilter, setBeneficiaryTypeFilter] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  //* Estados de UI
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  //* NUEVOS estados para mostrar lista de beneficiarios sin acta
  const [showMissingList, setShowMissingList] = useState(false);
  const [missingPage, setMissingPage] = useState(1);

  const handleRegresar = () => {
    router.replace("/inicio-servicio-medico");
  };

  //* Carga de datos
  const fetchData = () => {
    setLoading(true);
    fetch("/api/beneficiarios/consolidado")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((json) => {
        setData(json);

        //* Calcular estadísticas de parentesco
        let hijos = 0;
        let esposos = 0;
        let concubinos = 0;
        let padres = 0;

        json.forEach((emp) => {
          emp.beneficiarios.forEach((b) => {
            const parentesco = b.PARENTESCO_DESCRIPCION;
            if (parentesco === "Hijo(a)") hijos++;
            else if (parentesco === "Esposo(a)") esposos++;
            else if (parentesco === "Concubino(a)") concubinos++;
            else if (parentesco === "Padre" || parentesco === "Madre") padres++;
          });
        });

        setStats({
          total: json.length,
          withBenefits: json.filter((e) => e.beneficiarios.length).length,
          hijos,
          esposos,
          concubinos,
          padres,
        });
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  //* Normalización de datos (coerce no_nomina a string)
  const normalized = useMemo(
    () =>
      data.map((item) => {
        const { empleado = {}, no_nomina: rawNomina, sinActaCount } = item;
        // forzamos siempre string y quitamos espacios
        const no_nomina = String(rawNomina).trim();
        const rawName = [
          empleado.nombre,
          empleado.a_paterno,
          empleado.a_materno,
        ]
          .filter(Boolean)
          .join(" ");
        return {
          ...item,
          no_nomina,
          empName: rawName || `Empleado #${no_nomina}`,
          departamento: empleado.departamento,
          puesto: empleado.puesto,
          sindicato:
            empleado.grupoNomina === "NS"
              ? empleado.cuotaSindical === "S"
                ? "SUTSMSJR"
                : "SITAM"
              : "",
          sinActaCount,
        };
      }),
    [data]
  );

  //! ────────────────────────────────────────────────────────────────────────────
  //! Eliminar duplicados por no_nomina (string key)
  const uniqueNormalized = useMemo(() => {
    const map = new Map();
    normalized.forEach((emp) => {
      const key = emp.no_nomina; // ya es string
      map.set(key, emp);
    });
    return Array.from(map.values());
  }, [normalized]);
  //! ────────────────────────────────────────────────────────────────────────────

  //* Lista de beneficiarios sin “URL_ACTA_NAC”
  const beneficiariesWithoutActa = useMemo(() => {
    const list = [];
    uniqueNormalized.forEach((emp) => {
      emp.beneficiarios.forEach((b) => {
        if (!b.URL_ACTA_NAC) {
          list.push({
            no_nomina: emp.no_nomina,
            empName: emp.empName,
            beneficiaryId: b.ID_BENEFICIARIO,
            beneficiaryName: `${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}`,
            parentesco: b.PARENTESCO_DESCRIPCION,
            fechanacimiento: b.F_NACIMIENTO,
            fechanacimientoISO: b.F_NACIMIENTO_ISO,
          });
        }
      });
    });
    return list;
  }, [uniqueNormalized]);

  //* Suma global de beneficiarios sin acta
  const sinActaCount = useMemo(
    () =>
      uniqueNormalized.reduce(
        (total, emp) => total + (emp.sinActaCount || 0),
        0
      ),
    [uniqueNormalized]
  );

  //* Listas de filtro
  const departments = useMemo(
    () => [
      ...new Set(uniqueNormalized.map((i) => i.departamento).filter(Boolean)),
    ],
    [uniqueNormalized]
  );

  //* Datos filtrados con búsqueda
  const filtered = useMemo(
    () =>
      uniqueNormalized.filter((i) => {
        const matchesSearch =
          !searchTerm ||
          i.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.no_nomina.includes(searchTerm) ||
          i.beneficiarios.some((b) =>
            `${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        const matchesDept = !deptFilter || i.departamento === deptFilter;
        const matchesSind = !sindFilter || i.sindicato === sindFilter;
        const matchesType =
          !beneficiaryTypeFilter ||
          i.beneficiarios.some((b) =>
            beneficiaryTypeFilter === "hijos"
              ? b.PARENTESCO_DESCRIPCION === "Hijo(a)"
              : beneficiaryTypeFilter === "esposos"
              ? b.PARENTESCO_DESCRIPCION === "Esposo(a)"
              : beneficiaryTypeFilter === "concubinos"
              ? b.PARENTESCO_DESCRIPCION === "Concubino(a)"
              : beneficiaryTypeFilter === "padres"
              ? b.PARENTESCO_DESCRIPCION === "Padre" ||
                b.PARENTESCO_DESCRIPCION === "Madre"
              : true
          );
        return matchesSearch && matchesDept && matchesSind && matchesType;
      }),
    [
      uniqueNormalized,
      searchTerm,
      deptFilter,
      sindFilter,
      beneficiaryTypeFilter,
    ]
  );

  //* Paginación empleados
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  //* Paginación beneficiarios sin acta
  const missingTotalPages = Math.ceil(
    beneficiariesWithoutActa.length / PAGE_SIZE
  );

  //* Métricas
  const totalBeneficiaries = useMemo(
    () => data.reduce((sum, e) => sum + e.beneficiarios.length, 0),
    [data]
  );
  const avgPerEmployee = useMemo(
    () =>
      stats.total ? (totalBeneficiaries / stats.total).toFixed(2) : "0.00",
    [stats, totalBeneficiaries]
  );

  //* Handlers
  const clearAll = useCallback(() => {
    setSearchTerm("");
    setDeptFilter("");
    setSindFilter("");
    setBeneficiaryTypeFilter("");
    setCurrentPage(1);
    setMobileFiltersOpen(false);
  }, []);

  const changePage = (delta) => {
    setCurrentPage((p) => Math.min(Math.max(1, p + delta), totalPages));
  };
  const changeMissingPage = (delta) => {
    setMissingPage((p) => Math.min(Math.max(1, p + delta), missingTotalPages));
  };

  const handleBeneficiaryTypeClick = (type) => {
    setBeneficiaryTypeFilter((prev) => (prev === type ? "" : type));
    setCurrentPage(1);
  };

  //* Loader mejorado
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

  //! Componente de error
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

  //* Componente de tarjeta de empleado
  const EmployeeCard = ({ emp }) => {
    const isOpen = expanded === emp.no_nomina;
    const hasBeneficiaries = emp.beneficiarios.length > 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className={`relative overflow-hidden rounded-2xl group ${
          isOpen ? "bg-gradient-to-br from-indigo-50 to-purple-50" : "bg-white"
        } shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200`}
      >
        {/* Header de la tarjeta */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full p-5 text-left flex items-start gap-4"
          onClick={() => {
            tapSound.play();
            setExpanded(isOpen ? null : emp.no_nomina);
          }}
        >
          <div className="relative">
            <div className="bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-xl w-14 h-14 flex items-center justify-center flex-shrink-0">
              <FaUserAlt className="text-white text-xl" />
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                hasBeneficiaries ? "bg-green-400" : "bg-gray-300"
              }`}
            ></div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 truncate">{emp.empName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                #{emp.no_nomina}
              </span>
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full truncate max-w-[120px]">
                {emp.puesto}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <FaBuilding className="text-gray-400 text-xs" />
              <p className="text-xs text-gray-500 truncate">
                {emp.departamento}
              </p>
            </div>
          </div>

          <div
            className={`text-lg ${
              isOpen ? "text-indigo-500" : "text-gray-400"
            }`}
          >
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </motion.button>

        {/* Contenido expandible */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="px-5 pb-5"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-4"></div>

              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaUserFriends className="text-indigo-500" />
                  Beneficiarios ({emp.beneficiarios.length})
                </h4>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    emp.sindicato === "SUTSMSJR"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {emp.sindicato || "Sin sindicato"}
                </span>
              </div>

              {emp.beneficiarios.length === 0 ? (
                <div className="text-center py-4 bg-indigo-50 rounded-xl">
                  <p className="italic text-gray-500">
                    Sin beneficiarios registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emp.beneficiarios.map((b) => (
                    <motion.div
                      key={b.ID_BENEFICIARIO}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-cyan-100 rounded-lg w-10 h-10 flex items-center justify-center">
                          <FaUserAlt className="text-cyan-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-700 truncate">
                            {b.NOMBRE} {b.A_PATERNO} {b.A_MATERNO}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                b.PARENTESCO_DESCRIPCION === "Hijo(a)"
                                  ? "bg-blue-500"
                                  : b.PARENTESCO_DESCRIPCION === "Esposo(a)"
                                  ? "bg-pink-500"
                                  : b.PARENTESCO_DESCRIPCION === "Concubino(a)"
                                  ? "bg-red-500"
                                  : "bg-green-500"
                              }`}
                            ></span>
                            {b.PARENTESCO_DESCRIPCION}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          tapSound.play();
                          setSelected(b);
                        }}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all"
                        title="Ver documento"
                      >
                        <FaFilePdf />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  //* Si el usuario hizo clic en “Beneficiarios sin Documentos”, mostramos componente externo
  if (showMissingList) {
    return (
      <MissingBeneficiaries
        beneficiariesWithoutActa={beneficiariesWithoutActa}
        missingPage={missingPage}
        setMissingPage={setMissingPage}
        missingTotalPages={missingTotalPages}
        changeMissingPage={changeMissingPage}
        setShowMissingList={setShowMissingList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Barra superior */}
      <header className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white p-4 shadow-2xl">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <FaIdCard className="text-cyan-300" />
              <span>Dashboard de Beneficiarios</span>
            </h1>
            <p className="text-indigo-200 text-sm mt-1">
              Administra los beneficiarios de los empleados
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Botón Regresar */}
            <div className="absolute left-5">
              <button
                onClick={handleRegresar}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] transition-all duration-300"
              >
                <FaArrowLeft />
                <span className="hidden sm:inline">Regresar</span>
              </button>
            </div>
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
                onClick={() => {
                  tapSound.play();

                  //* Pasar los datos FILTRADOS (filtered) en lugar de normalized
                  exportToExcel(filtered, stats);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <FaFileExcel />
                <span className="hidden md:inline">Exportar Excel</span>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Filtros rápidos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaFilter className="text-indigo-500" />
            Filtros Rápidos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBeneficiaryTypeClick("hijos")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-md ${
                beneficiaryTypeFilter === "hijos"
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              <FaChild className="text-2xl mb-2" />
              <span>Hijos</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBeneficiaryTypeClick("esposos")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-md ${
                beneficiaryTypeFilter === "esposos"
                  ? "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              <FaRing className="text-2xl mb-2" />
              <span>Esposos</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBeneficiaryTypeClick("concubinos")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-md ${
                beneficiaryTypeFilter === "concubinos"
                  ? "bg-gradient-to-br from-red-500 to-red-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              <FaHeart className="text-2xl mb-2" />
              <span>Concubinos</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBeneficiaryTypeClick("padres")}
              className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-md ${
                beneficiaryTypeFilter === "padres"
                  ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              <FaUser className="text-2xl mb-2" />
              <span>Padres</span>
            </motion.button>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
          {[
            {
              icon: <FaUsers className="text-2xl" />,
              label: "Empleados Con Beneficiarios",
              value: stats.total,
              color: "from-indigo-500 to-indigo-600",
            },
            {
              icon: <FaCoins className="text-2xl" />,
              label: "Total De Beneficiarios",
              value: totalBeneficiaries,
              color: "from-cyan-500 to-cyan-600",
            },
            {
              icon: <FaPercentage className="text-2xl" />,
              label: "Promedio",
              value: avgPerEmployee,
              color: "from-emerald-500 to-emerald-600",
            },
            {
              icon: <FaLayerGroup className="text-2xl" />,
              label: "Departamentos",
              value: departments.length,
              color: "from-amber-500 to-amber-600",
            },
            {
              icon: <TbFolderCancel className="text-2xl" />,
              label: "Sin Documentos",
              value: sinActaCount,
              color: "from-red-500 to-red-600",
              onClick: () => {
                setShowMissingList(true);
                setMissingPage(1);
              },
            },
          ].map(({ icon, label, value, color, onClick }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative overflow-hidden rounded-2xl shadow-xl p-5 text-white bg-gradient-to-br ${color} ${
                onClick ? "cursor-pointer" : ""
              }`}
              onClick={onClick}
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full"></div>

              <div className="relative z-10 flex flex-col items-start">
                <div className="mb-2">{icon}</div>
                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                <p className="font-light text-white/90">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Estadísticas de parentesco */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
          {[
            {
              icon: <FaChild className="text-2xl" />,
              label: "Hijos",
              value: stats.hijos,
              color: "from-blue-500 to-blue-600",
              type: "hijos",
            },
            {
              icon: <FaRing className="text-2xl" />,
              label: "Esposos",
              value: stats.esposos,
              color: "from-pink-500 to-pink-600",
              type: "esposos",
            },
            {
              icon: <FaHeart className="text-2xl" />,
              label: "Concubinos",
              value: stats.concubinos,
              color: "from-red-500 to-red-600",
              type: "concubinos",
            },
            {
              icon: <FaUserFriends className="text-2xl" />,
              label: "Padres",
              value: stats.padres,
              color: "from-green-500 to-green-600",
              type: "padres",
            },
          ].map(({ icon, label, value, color, type }, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBeneficiaryTypeClick(type)}
              className={`relative overflow-hidden rounded-2xl shadow-xl p-5 text-white bg-gradient-to-br ${color} ${
                beneficiaryTypeFilter === type ? "ring-4 ring-white/50" : ""
              }`}
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full"></div>

              <div className="relative z-10">
                <div className="mb-4">{icon}</div>
                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                <p className="font-light text-white/90">{label}</p>
              </div>
            </motion.button>
          ))}
        </div>

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
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="w-4/5 max-w-sm h-full bg-gradient-to-b from-indigo-900 to-purple-900 p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold text-white">Filtros</h2>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={clearAll}
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
                  <div className="relative">
                    <FaSearch className="absolute top-3 left-3 text-indigo-300" />
                    <input
                      type="text"
                      placeholder="Buscar empleado o beneficiario..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-indigo-800/50 border border-indigo-600 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-indigo-200 font-medium">
                      Departamento
                    </label>
                    <select
                      value={deptFilter}
                      onChange={(e) => {
                        setDeptFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-indigo-800/50 border border-indigo-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="" className="bg-indigo-900 text-white">
                        Todos los departamentos
                      </option>
                      {departments.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                          className="bg-indigo-900 text-white"
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-indigo-200 font-medium">
                      Sindicato
                    </label>
                    <select
                      value={sindFilter}
                      onChange={(e) => {
                        setSindFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-indigo-800/50 border border-indigo-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="" className="bg-indigo-900 text-white">
                        Todos los sindicatos
                      </option>
                      <option
                        value="SUTSMSJR"
                        className="bg-indigo-900 text-white"
                      >
                        SUTSMSJR
                      </option>
                      <option
                        value="SITAM"
                        className="bg-indigo-900 text-white"
                      >
                        SITAM
                      </option>
                    </select>
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
                onClick={clearAll}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <FaTimes /> Limpiar
              </motion.button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Buscar
                </label>
                <div className="relative">
                  <FaSearch className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre o nómina..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Departamento
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => {
                    setDeptFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                >
                  <option value="">Todos</option>
                  {departments.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 font-medium">
                  Sindicato
                </label>
                <select
                  value={sindFilter}
                  onChange={(e) => {
                    setSindFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                >
                  <option value="">Todos</option>
                  <option value="SUTSMSJR">SUTSMSJR</option>
                  <option value="SITAM">SITAM</option>
                </select>
              </div>

              <div className="pt-4">
                <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-center py-3 rounded-xl font-medium">
                  {filtered.length} empleados encontrados
                </div>
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
                {filtered.length} resultados
              </div>
            </div>

            {/* Encabezado de resultados */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 mb-6 flex flex-wrap justify-between items-center">
              <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                <FaUserFriends className="text-indigo-500" />
                Empleados con Beneficiarios
              </h2>

              {beneficiaryTypeFilter && (
                <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">
                    Filtrado por:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      beneficiaryTypeFilter === "hijos"
                        ? "bg-blue-100 text-blue-800"
                        : beneficiaryTypeFilter === "esposos"
                        ? "bg-pink-100 text-pink-800"
                        : beneficiaryTypeFilter === "concubinos"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {beneficiaryTypeFilter === "hijos"
                      ? "Hijos"
                      : beneficiaryTypeFilter === "esposos"
                      ? "Esposos"
                      : beneficiaryTypeFilter === "concubinos"
                      ? "Concubinos"
                      : "Padres"}
                  </span>
                  <button
                    onClick={() => setBeneficiaryTypeFilter("")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* Tarjetas de empleados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pageItems.map((emp) => (
                <EmployeeCard key={emp.no_nomina} emp={emp} />
              ))}
            </div>

            {/* Paginación empleados */}
            {filtered.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 bg-white rounded-2xl p-5 shadow-xl border border-gray-100"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Mostrando{" "}
                    <span className="font-semibold">
                      {(currentPage - 1) * PAGE_SIZE + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold">
                      {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                    </span>{" "}
                    de <span className="font-semibold">{filtered.length}</span>{" "}
                    empleados
                  </p>

                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => changePage(-1)}
                      disabled={currentPage === 1}
                      className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
                    >
                      <FaChevronUp className="-rotate-90" /> Anterior
                    </motion.button>

                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        const isCurrent = page === currentPage;
                        const isNear = Math.abs(page - currentPage) <= 1;

                        if (
                          isCurrent ||
                          isNear ||
                          page === 1 ||
                          page === totalPages
                        ) {
                          return (
                            <motion.button
                              key={page}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl font-medium ${
                                isCurrent
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </motion.button>
                          );
                        }

                        if (
                          (page === 2 && currentPage > 3) ||
                          (page === totalPages - 1 &&
                            currentPage < totalPages - 2)
                        ) {
                          return (
                            <span key={page} className="px-2 flex items-center">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => changePage(1)}
                      disabled={currentPage === totalPages}
                      className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
                    >
                      Siguiente <FaChevronUp className="rotate-90" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sin resultados */}
            {filtered.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 text-center shadow-xl border border-gray-100 mt-6"
              >
                <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FaSearch className="text-white text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No se encontraron empleados
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No encontramos empleados que coincidan con tus criterios de
                  búsqueda. Intenta ajustar los filtros.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearAll}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg"
                >
                  Limpiar todos los filtros
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de documentos */}
      <AnimatePresence>
        {selected && (
          <DocumentModal
            beneficiary={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaCrown className="text-amber-300" />
                Sistema de Gestión de Beneficiarios
              </h3>
              <p className="text-indigo-200 text-sm mt-1">
                © {new Date().getFullYear()} Todos los derechos reservados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur p-3 rounded-xl">
                <FaUsers className="text-cyan-300" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Total empleados</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
