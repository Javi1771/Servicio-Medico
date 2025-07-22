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
  FaPercentage,
  FaFileExport,
} from "react-icons/fa";
import { TbFolderCancel } from "react-icons/tb";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const PAGE_SIZE = 7;

/*
 * Dada una cadena como "DíaSemana, DD/MM/YYYY, hh:mm a. m.",
 * extrae DD, MM y YYYY y devuelve una ISO "YYYY-MM-DDT00:00:00Z".
 * Si no coincide, retorna null.
 */
const extractIsoFromFormatted = (fechaFormateada) => {
  if (!fechaFormateada) return null;
  //* Ejemplo: "Sábado, 20/06/1964, 6:00 a.m."
  const m = fechaFormateada.match(/,\s*(\d{2})\/(\d{2})\/(\d{4})\s*,/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}T00:00:00Z`;
};

/*
 * Devuelve la fecha ISO a usar para el cálculo de edad:
 * 1) Si existe `iso` (fechanacimientoISO), la devuelve tal cual.
 * 2) Si no, intenta extraerla desde `formatted` (fechanacimiento).
 * 3) Si falla todo, retorna null.
 */
const getFechaParaEdad = (iso, formatted) => {
  if (iso) return iso;
  return extractIsoFromFormatted(formatted);
};

/*
 * Calcula la edad en años completos a partir de una fecha ISO.
 * Si `fechaIso` es null o inválida, retorna 0.
 */
const calcularEdad = (fechaIso) => {
  if (!fechaIso) return 0;
  const fecha = new Date(fechaIso);
  if (isNaN(fecha)) return 0;
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
    edad--;
  }
  return edad;
};

//* Etiquetas legibles para cada clave de documento
const labelPorKey = {
  URL_CONSTANCIA: "Constancia de Estudios",
  URL_CURP: "CURP",
  URL_ACTA_NAC: "Acta de Nacimiento",
  URL_INE: "INE",
  URL_CONCUBINATO: "Acta de Concubinato",
  URL_ACTAMATRIMONIO: "Acta de Matrimonio",
  URL_NOISSTE: "Carta No Afiliación IMSS/ISSSTE",
  URL_INCAP: "Acta de Incapacidad",
  URL_ACTADEPENDENCIAECONOMICA: "Acta Dependencia Económica",
  VIGENCIA_ESTUDIOS: "Vigencia de Estudios",
};

/*
 * Según parentesco, edad, discapacidad y estudiante, devuelve un array
 * con las claves (keys) de los documentos que son obligatorios.
 *
 * Nuevo comportamiento para "Hijo(a)":
 *  - Si es menor de 16 → solo Acta de Nacimiento y CURP.
 *  - Si es >= 16:
 *     • Si ESDISCAPACITADO === true → URL_INE + URL_INCAP.
 *     • Si NO es discapacitado → URL_INE + URL_CONSTANCIA + VIGENCIA_ESTUDIOS.
 */
const getRequiredKeys = (b) => {
  const fechaIso = getFechaParaEdad(b.fechanacimientoISO, b.fechanacimiento);
  const edad = calcularEdad(fechaIso);
  const docs = ["URL_ACTA_NAC", "URL_CURP"];

  const parentesco = b.parentesco;
  const esDisca = b.ESDISCAPACITADO === true;

  switch (parentesco) {
    case "Esposo(a)":
      docs.push("URL_ACTAMATRIMONIO", "URL_NOISSTE", "URL_INE");
      break;
    case "Hijo(a)":
      if (edad >= 16) {
        //* siempre pedimos INE a partir de 16
        docs.push("URL_INE");
        if (esDisca) {
          //* si es discapacitado, pide Acta Incapacidad
          docs.push("URL_INCAP");
        } else {
          //! si NO es discapacitado, pide Constancia y Vigencia
          docs.push("URL_CONSTANCIA", "VIGENCIA_ESTUDIOS");
        }
      }
      break;
    case "Concubino(a)":
      docs.push("URL_CONCUBINATO", "URL_NOISSTE", "URL_INE");
      break;
    case "Padre":
    case "Madre":
      docs.push("URL_ACTADEPENDENCIAECONOMICA", "URL_NOISSTE", "URL_INE");
      break;
    default:
      break;
  }
  return docs;
};

/*
 * Recorre las claves requeridas y devuelve las etiquetas
 * de aquellos documentos que falten (null, cadena vacía) o estén vencidos:
 *  - Si es VIGENCIA_ESTUDIOS y la fecha está en el pasado → "Vigencia de Estudios Vencida".
 *  - Si es cualquier otro (p. ej. URL_INCAP) y no existe o está vacío → "Acta de Incapacidad", etc.
 */
const getMissingDocs = (b) => {
  const required = getRequiredKeys(b);
  const faltantes = [];

  required.forEach((key) => {
    const valor = b[key];
    if (key === "VIGENCIA_ESTUDIOS") {
      if (!valor || valor.toString().trim() === "") {
        //! no tiene vigencia
        faltantes.push(labelPorKey[key]);
      } else {
        // *intentamos convertir a ISO (si viene formateada) o usarla directamente
        const iso = extractIsoFromFormatted(valor) || valor;
        const fechaVig = new Date(iso);
        const hoy = new Date();
        //* comparamos solo la fecha (ignoramos horas)
        const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        if (isNaN(fechaVig) || fechaVig < hoySinHora) {
          faltantes.push("Vigencia de Estudios Vencida");
        }
      }
    } else {
      //! Para el resto de documentos: si no existe o está vacío → faltar
      if (!valor || valor.toString().trim() === "") {
        faltantes.push(labelPorKey[key] || key);
      }
    }
  });

  return faltantes;
};

//? Borde fino color negro para ExcelJS
const thinBorder = {
  top: { style: "thin", color: { argb: "000000" } },
  bottom: { style: "thin", color: { argb: "000000" } },
  left: { style: "thin", color: { argb: "000000" } },
  right: { style: "thin", color: { argb: "000000" } },
};

const buildMainSheet = (items, wb) => {
  const ws = wb.addWorksheet("Faltantes", {
    pageSetup: { fitToWidth: 1 },
    properties: { tabColor: { argb: "920A0A" } },
  });

  //* Título en A1:F1
  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Reporte de Beneficiarios Faltantes";
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "920A0A" },
  };

  //* Fecha de generación en A2:F2
  ws.mergeCells("A2:F2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Generado el ${new Date().toLocaleDateString()}`;
  dateCell.font = { bold: true, size: 12, color: { argb: "FFFFFF" } };
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
  dateCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "B10303" },
  };

  ws.addRow([]);

  //* Encabezados de columna en fila 4
  const headerRow = ws.addRow([
    "Nómina",
    "Empleado",
    "Beneficiario",
    "Parentesco",
    "Edad",
    "Documentos Faltantes",
  ]);
  headerRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D70000" },
    };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = thinBorder;
  });

  //* Congelar hasta la fila 4
  ws.views = [{ state: "frozen", ySplit: 4 }];

  //* Filas con datos
  items.forEach((item, idx) => {
    const fechaParaEdad = getFechaParaEdad(
      item.fechanacimientoISO,
      item.fechanacimiento
    );
    const edad = calcularEdad(fechaParaEdad);
    const faltantes = getMissingDocs(item);

    const row = ws.addRow([
      item.no_nomina,
      item.empName,
      item.beneficiaryName,
      item.parentesco,
      edad,
      faltantes.join(", "),
    ]);

    const bgColor = idx % 2 === 0 ? "FFF0F0" : "FFFFFF";
    row.eachCell((c) => {
      c.font = { color: { argb: "000000" } };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      c.border = thinBorder;
      c.alignment = { vertical: "middle", wrapText: true };
    });
  });

  //* Anchos de columna
  ws.columns = [
    { width: 10 }, //? A: Nómina
    { width: 25 }, //? B: Empleado
    { width: 30 }, //? C: Beneficiario
    { width: 15 }, //? D: Parentesco
    { width: 8 },  //? E: Edad
    { width: 40 }, //? F: Documentos faltantes
  ];
};

const buildSummarySheet = (items, wb) => {
  const ws = wb.addWorksheet("Resumen", {
    properties: { tabColor: { argb: "800000" } },
  });

  //* Título en A1:C1
  ws.mergeCells("A1:C1");
  const title = ws.getCell("A1");
  title.value = "Resumen de Beneficiarios Faltantes";
  title.font = { bold: true, size: 16, color: { argb: "FFFFFF" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "920A0A" },
  };

  ws.addRow([]);

  //* Métricas
  const total = items.length;
  const uniqueEmp = new Set(items.map((b) => b.no_nomina)).size;
  const counts = items.reduce((acc, curr) => {
    acc[curr.parentesco] = (acc[curr.parentesco] || 0) + 1;
    return acc;
  }, {});
  const hijos = counts["Hijo(a)"] || 0;
  const esposos = counts["Esposo(a)"] || 0;
  const concubinos = counts["Concubino(a)"] || 0;
  const padres = (counts["Padre"] || 0) + (counts["Madre"] || 0);
  const totalBen = hijos + esposos + concubinos + padres;
  const pct = (val) => ((val / (totalBen || 1)) * 100).toFixed(1);

  //* Encabezados tabla resumen (fila 3)
  const hdr = ws.addRow(["Métrica", "Valor", "Detalle"]);
  hdr.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFF" } };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D70000" },
    };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = thinBorder;
  });

  //* Filas de datos
  const rows = [
    ["Total Faltantes", total, ""],
    ["Empleados Afectados", uniqueEmp, ""],
    ["Total Beneficiarios", totalBen, ""],
    ["Hijos", hijos, `${pct(hijos)}%`],
    ["Esposos", esposos, `${pct(esposos)}%`],
    ["Concubinos", concubinos, `${pct(concubinos)}%`],
    ["Padres/Madres", padres, `${pct(padres)}%`],
  ];

  rows.forEach((r, i) => {
    const row = ws.addRow(r);
    const bgColor = i % 2 === 0 ? "FFDDDD" : "FFFFFF";
    row.eachCell((c, col) => {
      c.border = thinBorder;
      if (col === 1) {
        //? Métrica → fondo 300 (#FF9494), texto blanco
        c.font = { bold: true, color: { argb: "FFFFFF" } };
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9494" },
        };
      } else if (col === 2) {
        //? Valor → fondo 200 (#FFC0C0), texto negro
        c.font = { color: { argb: "000000" } };
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9494" },
        };
      } else {
        //? Detalle → fondo alternante 100 (#FFDDDD) o blanco
        c.font = { color: { argb: "000000" } };
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
      }
      c.alignment = { vertical: "middle", wrapText: true };
    });
  });

  //* Anchos de columna en “Resumen”
  ws.columns = [
    { width: 25 }, 
    { width: 15 }, 
    { width: 20 }, 
  ];
};

/*
 * Exporta a Excel usando ExcelJS + FileSaver.js
 */
const exportToExcel = async (items) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Dashboard SJR";
  wb.created = new Date();

  //* Construcción de las hojas
  buildMainSheet(items, wb);
  buildSummarySheet(items, wb);

  //* ───── Proteger todas las hojas con contraseña ─────
  wb.eachSheet((worksheet) => {
    worksheet.protect('P4nd0r4!', {
      selectLockedCells:    false,
      selectUnlockedCells:  false,
      formatCells:          false,
      formatColumns:        false,
      formatRows:           false,
      insertColumns:        false,
      insertRows:           false,
      deleteColumns:        false,
      deleteRows:           false,
      sort:                 false,
      autoFilter:           false
    });
  });

  //* Generar buffer y descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Beneficiarios_Faltantes_${dateStr}.xlsx`);
};

export default function MissingBeneficiaries({
  beneficiariesWithoutActa,
  missingPage,
  setMissingPage,
  setShowMissingList,
}) {
  const [missingSearchTerm, setMissingSearchTerm] = useState("");
  const [parentescoFilter, setParentescoFilter] = useState("Todos");

  // Filtrado por término de búsqueda y parentesco
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

  // Recalcular total de páginas cada vez que cambie filteredMissing
  const totalMissing = filteredMissing.length;
  const totalPages = Math.ceil(totalMissing / PAGE_SIZE) || 1;

  // Si la página actual excede totalPages, la ajustamos hacia atrás
  if (missingPage > totalPages) {
    setMissingPage(totalPages);
  }

  // Items de la página actual
  const missingPageItems = useMemo(() => {
    const start = (missingPage - 1) * PAGE_SIZE;
    return filteredMissing.slice(start, start + PAGE_SIZE);
  }, [filteredMissing, missingPage]);

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

  const percentagesByParentesco = useMemo(() => {
    const total = totalMissing || 1;
    const pctObj = {};
    Object.entries(countsByParentesco).forEach(([key, val]) => {
      pctObj[key] = Math.round((val / total) * 100);
    });
    return pctObj;
  }, [countsByParentesco, totalMissing]);

  const parentescosUnicos = useMemo(() => {
    const setPar = new Set(beneficiariesWithoutActa.map((b) => b.parentesco));
    return ["Todos", ...Array.from(setPar)];
  }, [beneficiariesWithoutActa]);

  // Funciones para cambiar página
  const goToPrevious = () => {
    if (missingPage > 1) {
      setMissingPage(missingPage - 1);
    }
  };
  const goToNext = () => {
    if (missingPage < totalPages) {
      setMissingPage(missingPage + 1);
    }
  };

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
          className="flex items-center gap-2 text-red-700 hover:text-red-900 transition-colors duration-200"
        >
          <FaArrowLeft className="text-2xl" />
          <span className="text-xl font-semibold">Volver al Dashboard</span>
        </button>
      </div>

      {/* Encabezado + Métricas + Botón Exportar */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
        {/* Fondos decorativos */}
        <div className="absolute -top-12 -left-12 w-80 h-80 bg-gradient-to-br from-red-200 to-red-300 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-gradient-to-br from-red-300 to-red-400 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <TbFolderCancel className="text-red-600 text-4xl drop-shadow-lg" />
            <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
              Beneficiarios sin Documentos{" "}
              <span className="text-red-600 text-xl font-semibold">
                ({totalMissing})
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="mt-2 text-gray-600 max-w-lg">
              Explora los registros faltantes; utiliza los filtros y busca por
              nómina, empleado o beneficiario.
            </p>
            <button
              onClick={() => exportToExcel(filteredMissing)}
              className="ml-auto flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full shadow-lg hover:from-red-700 hover:to-red-800 transition-colors"
            >
              <FaFileExport /> Exportar a Excel
            </button>
          </div>
        </motion.div>

        {/* Tarjetas de métricas */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-red-600 text-white"
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
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-red-600 text-white"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="relative z-10 flex items-center gap-4">
              <FaUserFriends className="text-3xl" />
              <div>
                <p className="text-sm uppercase opacity-80">
                  Empleados afectados
                </p>
                <p className="text-2xl font-bold">{uniqueEmployeesCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-red-600 text-white"
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
            className="relative overflow-hidden rounded-2xl shadow-lg p-6 bg-red-600 text-white"
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
        <div className="mt-8 bg-red-50 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center gap-2">
            <FaPercentage /> Porcentaje por Parentesco
          </h3>
          <div className="space-y-4">
            {Object.entries(countsByParentesco).map(([rel]) => {
              const pct = percentagesByParentesco[rel];
              return (
                <div key={rel} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">{rel}</p>
                    <div className="mt-1 h-2 bg-red-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-red-600`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="w-12 text-right text-red-700 font-semibold">
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
          <FaSearch className="absolute top-3 left-3 text-red-400" />
          <input
            type="text"
            placeholder="Buscar por nómina, empleado o beneficiario..."
            value={missingSearchTerm}
            onChange={(e) => {
              setMissingSearchTerm(e.target.value);
              setMissingPage(1);
            }}
            className="w-full pl-10 pr-4 py-3 bg-white border border-red-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 placeholder-red-400 transition-colors"
          />
        </div>

        {/* Selector de Parentesco */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-red-600" />
          <select
            value={parentescoFilter}
            onChange={(e) => {
              setParentescoFilter(e.target.value);
              setMissingPage(1);
            }}
            className="px-4 py-2 bg-white border border-red-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-700 transition-colors"
          >
            {parentescosUnicos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="overflow-x-auto bg-white rounded-3xl shadow-xl ring-1 ring-red-200 mb-8">
        <div className="overflow-y-auto max-h-[500px]">
          <table className="min-w-full table-auto border-separate border-spacing-y-2">
            <thead className="bg-red-600">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider rounded-tl-2xl">
                  <div className="inline-flex items-center gap-2">
                    <FaIdCard className="text-white" /># Nómina
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
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  <div className="inline-flex items-center gap-2">
                    <FaLayerGroup className="text-white" />
                    Parentesco
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                  <div className="inline-flex items-center gap-2">
                    <FaChild className="text-white" />
                    Edad
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider rounded-tr-2xl">
                  <div className="inline-flex items-center gap-2">
                    <TbFolderCancel className="text-white" />
                    Documentos Faltantes
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {missingPageItems.length > 0 ? (
                missingPageItems.map((item, idx) => {
                  const fechaParaEdad = getFechaParaEdad(
                    item.fechanacimientoISO,
                    item.fechanacimiento
                  );
                  const faltantes = getMissingDocs(item);
                  const edad = calcularEdad(fechaParaEdad);

                  return (
                    <motion.tr
                      key={`${item.beneficiaryId}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`${
                        idx % 2 === 0 ? "bg-red-50" : "bg-white"
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {edad} años
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {faltantes.length > 0 ? faltantes.join(", ") : "-"}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
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

      {/* Paginación interna (solo si hay más de una página) */}
      {totalMissing > PAGE_SIZE && (
        <div className="flex flex-col md:flex-row items-center justify-between mt-8 gap-6">
          <button
            onClick={goToPrevious}
            disabled={missingPage === 1}
            className={`flex items-center gap-2 px-5 py-3 bg-white border ${
              missingPage === 1
                ? "border-red-200 text-red-200 cursor-not-allowed"
                : "border-red-300 text-red-600 hover:bg-red-50"
            } rounded-full transition-all duration-200 shadow-sm`}
          >
            <FaChevronUp className="w-4 h-4 transform -rotate-90" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrent = page === missingPage;
              const isNear = Math.abs(page - missingPage) <= 1;

              if (isCurrent || isNear || page === 1 || page === totalPages) {
                return (
                  <button
                    key={page}
                    onClick={() => setMissingPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-all duration-200 ${
                      isCurrent
                        ? "bg-red-600 text-white shadow-lg"
                        : "bg-white border border-red-300 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (
                (page === 2 && missingPage > 3) ||
                (page === totalPages - 1 && missingPage < totalPages - 2)
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
            onClick={goToNext}
            disabled={missingPage === totalPages}
            className={`flex items-center gap-2 px-5 py-3 bg-white border ${
              missingPage === totalPages
                ? "border-red-200 text-red-200 cursor-not-allowed"
                : "border-red-300 text-red-600 hover:bg-red-50"
            } rounded-full transition-all duration-200 shadow-sm`}
          >
            <span>Siguiente</span>
            <FaChevronUp className="w-4 h-4 transform rotate-90" />
          </button>
        </div>
      )}
    </div>
  );
}
