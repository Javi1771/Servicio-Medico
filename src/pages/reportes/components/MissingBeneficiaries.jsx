"use client";

import { useState, useMemo } from "react";
import {
  FaArrowLeft,
  FaChevronUp,
  FaSearch,
  FaIdCard,
  FaUserAlt,
  FaUserFriends,
  FaLayerGroup,
  FaChartPie,
  FaChild,
  FaUser,
  FaFilter,
  FaPercentage
} from "react-icons/fa";
import { TbFolderCancel } from "react-icons/tb";
import { motion } from "framer-motion";

const PAGE_SIZE = 7;

export default function MissingBeneficiaries({
  beneficiariesWithoutActa,
  missingPage,
  setMissingPage,
  missingTotalPages,
  changeMissingPage,
  setShowMissingList,
}) {
  //* Estados para filtros y búsqueda
  const [missingSearchTerm, setMissingSearchTerm] = useState("");
  const [parentescoFilter, setParentescoFilter] = useState("Todos");

  //* Filtrar (texto + parentesco)
  const filteredMissing = useMemo(() => {
    const term = missingSearchTerm.trim().toLowerCase();
    return beneficiariesWithoutActa.filter((b) => {
      const matchesText =
        b.no_nomina.toString().includes(term) ||
        b.empName.toLowerCase().includes(term) ||
        b.beneficiaryName.toLowerCase().includes(term);
      const matchesRel =
        parentescoFilter === "Todos" || b.parentesco === parentescoFilter;
      return matchesText && matchesRel;
    });
  }, [beneficiariesWithoutActa, missingSearchTerm, parentescoFilter]);

  //* Paginación
  const missingPageItems = useMemo(() => {
    const start = (missingPage - 1) * PAGE_SIZE;
    return filteredMissing.slice(start, start + PAGE_SIZE);
  }, [filteredMissing, missingPage]);

  //* Métricas generales
  const totalMissing = filteredMissing.length;
  const uniqueEmployeesCount = useMemo(() => {
    const setIds = new Set(filteredMissing.map((b) => b.no_nomina));
    return setIds.size;
  }, [filteredMissing]);

  const countsByParentesco = useMemo(() => {
    return filteredMissing.reduce((acc, curr) => {
      const rel = curr.parentesco;
      acc[rel] = (acc[rel] || 0) + 1;
      return acc;
    }, {});
  }, [filteredMissing]);

  //* Porcentajes para cada parentesco
  const percentagesByParentesco = useMemo(() => {
    const total = totalMissing || 1;
    const pctObj = {};
    Object.entries(countsByParentesco).forEach(([key, val]) => {
      pctObj[key] = Math.round((val / total) * 100);
    });
    return pctObj;
  }, [countsByParentesco, totalMissing]);

  //* Lista única de valores de parentesco
  const parentescosUnicos = useMemo(() => {
    const setPar = new Set(beneficiariesWithoutActa.map((b) => b.parentesco));
    return ["Todos", ...Array.from(setPar)];
  }, [beneficiariesWithoutActa]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8">
      {/* ← Botón Volver */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            setShowMissingList(false);
            setMissingPage(1);
            setMissingSearchTerm("");
            setParentescoFilter("Todos");
          }}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
        >
          <FaArrowLeft className="text-2xl" />
          <span className="text-xl font-semibold">Volver al Dashboard</span>
        </button>
      </div>

      {/* Encabezado + Métricas */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
        {/* Fondos decorativos */}
        <div className="absolute -top-12 -left-12 w-80 h-80 bg-gradient-to-br from-red-200 to-red-400 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-gradient-to-br from-yellow-200 via-red-300 to-red-500 rounded-full blur-2xl opacity-40 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <TbFolderCancel className="text-red-500 text-4xl drop-shadow-lg" />
            <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
              Beneficiarios sin Documentos{" "}
              <span className="text-red-600 text-xl font-semibold">
                ({totalMissing})
              </span>
            </h2>
          </div>
          <p className="mt-2 text-gray-500 max-w-lg">
            Explora los registros que faltan; utiliza los filtros y busca por nómina,
            empleado o beneficiario.
          </p>
        </motion.div>

        {/* Tarjetas de métricas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-gradient-to-br from-red-500 to-red-600 text-white"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="relative z-10 flex items-center gap-4">
              <FaChartPie className="text-3xl" />
              <div>
                <p className="text-sm uppercase opacity-80">Total faltantes</p>
                <p className="text-2xl font-bold">{totalMissing}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="relative z-10 flex items-center gap-4">
              <FaUserFriends className="text-3xl" />
              <div>
                <p className="text-sm uppercase opacity-80">Empleados afectados</p>
                <p className="text-2xl font-bold">{uniqueEmployeesCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="relative z-10 flex items-center gap-4">
              <FaChild className="text-3xl" />
              <div>
                <p className="text-sm uppercase opacity-80">Hijos Afectados</p>
                <p className="text-2xl font-bold">
                  {countsByParentesco["Hijo(a)"] || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-gradient-to-br from-green-500 to-green-600 text-white"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="relative z-10 flex items-center gap-4">
              <FaUser className="text-3xl" />
              <div>
                <p className="text-sm uppercase opacity-80">Cónyuges/Padres</p>
                <p className="text-2xl font-bold">
                  {(countsByParentesco["Esposo(a)"] || 0) +
                    (countsByParentesco["Padre"] || 0) +
                    (countsByParentesco["Madre"] || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Barra porcentual por parentesco */}
        <div className="mt-8 bg-gray-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaPercentage /> Porcentaje por Parentesco
          </h3>
          <div className="space-y-4">
            {Object.entries(countsByParentesco).map(([rel]) => {
              const pct = percentagesByParentesco[rel];
              return (
                <div key={rel} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{rel}</p>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r from-red-400 to-red-600`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="w-12 text-right text-gray-700 font-semibold">
                    {pct}%
                  </p>
                </div>
              );
            })}
            {Object.keys(countsByParentesco).length === 0 && (
              <p className="text-gray-500 italic">No hay datos disponibles.</p>
            )}
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 max-w-lg mx-auto md:mx-0">
          <FaSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nómina, empleado o beneficiario..."
            value={missingSearchTerm}
            onChange={(e) => {
              setMissingSearchTerm(e.target.value);
              setMissingPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-800 placeholder-gray-400 transition-colors"
          />
        </div>

        {/* Selector de Parentesco */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-600" />
          <select
            value={parentescoFilter}
            onChange={(e) => {
              setParentescoFilter(e.target.value);
              setMissingPage(1);
            }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-gray-700 transition-colors"
          >
            {parentescosUnicos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenedor de tabla con cabecera fija */}
      <div className="overflow-x-auto bg-white rounded-3xl shadow-xl ring-1 ring-gray-200 mb-8">
        <div className="overflow-y-auto max-h-[500px]">
          <table className="min-w-full table-auto border-separate border-spacing-y-2">
            <thead className="bg-red-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider rounded-tl-2xl">
                  <div className="inline-flex items-center gap-2">
                    <FaIdCard className="text-white" />
                    # Nómina
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  <div className="inline-flex items-center gap-2">
                    <FaUserAlt className="text-white" />
                    Empleado
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  <div className="inline-flex items-center gap-2">
                    <FaUserFriends className="text-white" />
                    Beneficiario
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider rounded-tr-2xl">
                  <div className="inline-flex items-center gap-2">
                    <FaLayerGroup className="text-white" />
                    Parentesco
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {missingPageItems.length > 0 ? (
                missingPageItems.map((item, idx) => (
                  <motion.tr
                    key={`${item.beneficiaryId}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`${
                      idx % 2 === 0
                        ? "bg-white"
                        : "bg-red-50"
                    } hover:bg-red-100 transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.no_nomina}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.empName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.beneficiaryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.parentesco}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-gray-500 italic"
                  >
                    No se encontraron coincidencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación interna */}
      {filteredMissing.length > PAGE_SIZE && (
        <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-6">
          <button
            onClick={() => changeMissingPage(-1)}
            disabled={missingPage === 1}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <FaChevronUp className="w-4 h-4 transform -rotate-90 text-gray-600" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            {[...Array(missingTotalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrent = page === missingPage;
              const isNear = Math.abs(page - missingPage) <= 1;

              if (
                isCurrent ||
                isNear ||
                page === 1 ||
                page === missingTotalPages
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setMissingPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-all duration-200 ${
                      isCurrent
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg"
                        : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (
                (page === 2 && missingPage > 3) ||
                (page === missingTotalPages - 1 &&
                  missingPage < missingTotalPages - 2)
              ) {
                return (
                  <span key={page} className="px-2 text-gray-500 text-lg">
                    …
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => changeMissingPage(1)}
            disabled={missingPage === missingTotalPages}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <span>Siguiente</span>
            <FaChevronUp className="w-4 h-4 transform rotate-90 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
