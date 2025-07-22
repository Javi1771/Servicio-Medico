//? -----------------------------------------------------------------------------
//? Genera un Excel con formato profesional usando la paleta Regal Blue
//? -----------------------------------------------------------------------------

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

//? Paleta de colores Regal Blue
const COLORS = {
  DARK_900: "0B3B60",
  DARK_800: "085184",
  MEDIUM_700: "045EA0",
  MEDIUM_600: "0377C6",
  LIGHT_500: "0F96E8",
  LIGHT_200: "BAE1FD",
  LIGHT_50: "F0F8FF",
  FILTER_BG: "E3F2FD",
};

/* -------------------------------------------------- */
//*  🛠️  Utilidades                                     */
/* -------------------------------------------------- */

/*
 * Extrae DD/MM/YYYY de "DíaSemana, DD/MM/YYYY, hh:mm a. m."
 * y devuelve la edad en años completos a la fecha actual.
 * Si el patrón no coincide devuelve "N/A".
 */
const calcEdad = (fechaStr) => {
  if (!fechaStr) return "N/A";

  //* Intentar diferentes formatos de fecha
  try {
    //? Formato 1: "DíaSemana, DD/MM/YYYY, hh:mm a. m."
    let match = fechaStr.match(/,\s*(\d{2})\/(\d{2})\/(\d{4})/);

    //? Formato 2: ISO 8601
    if (!match) {
      const isoDate = new Date(fechaStr);
      if (!isNaN(isoDate)) {
        return Math.floor(
          (Date.now() - isoDate.getTime()) / (365.25 * 24 * 3600 * 1000)
        );
      }
    }

    //? Formato 1 encontrado
    if (match) {
      const [, dd, mm, yyyy] = match;
      const date = new Date(+yyyy, +mm - 1, +dd);
      if (isNaN(date)) return "N/A";
      return Math.floor(
        (Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000)
      );
    }

    return "N/A";
  } catch {
    return "N/A";
  }
};

/*
 * Devuelve un objeto ExcelJS.Border con borde fino y color negro.
 */
const thinBorder = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

/*
 * Función para aplicar estilos a una celda
 */
const applyCellStyle = (
  cell,
  bgColor,
  textColor = "000000",
  bold = false,
  horizontal = "left"
) => {
  cell.font = {
    bold,
    color: { argb: textColor },
    name: "Arial",
    size: textColor === "FFFFFF" ? 12 : 11,
  };

  if (bgColor) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: bgColor },
    };
  }

  cell.border = thinBorder;
  cell.alignment = {
    vertical: "middle",
    wrapText: true,
    horizontal: horizontal,
  };
};

/* -------------------------------------------------- */
//?  📄  Hoja principal                                 */
/* -------------------------------------------------- */

const buildMainSheet = (filteredData, wb, filters) => {
  const ws = wb.addWorksheet("Beneficiarios", {
    pageSetup: {
      fitToWidth: 1,
      orientation: "landscape",
    },
    properties: { tabColor: { argb: COLORS.DARK_900 } },
  });

  //? Título principal
  ws.mergeCells("A1:H1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Reporte de Beneficiarios";
  applyCellStyle(titleCell, COLORS.DARK_900, "FFFFFF", true, "center");
  titleCell.font.size = 16;

  //? Fecha generación
  ws.mergeCells("A2:H2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Generado el ${new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  applyCellStyle(dateCell, COLORS.DARK_900, "FFFFFF", true, "center");

  //? Filtros aplicados
  const filterValues = [
    `Búsqueda: ${filters.searchTerm || "Ninguna"}`,
    `Departamento: ${filters.deptFilter || "Todos"}`,
    `Sindicato: ${filters.sindFilter || "Todos"}`,
    `Tipo: ${filters.beneficiaryTypeFilter || "Todos"}`,
  ];

  ws.addRow(filterValues);
  const filterRow = ws.getRow(3);
  filterRow.eachCell((cell, colNumber) => {
    if (colNumber <= filterValues.length) {
      applyCellStyle(cell, COLORS.FILTER_BG, "000000", true, "center");
    }
  });
  ws.mergeCells("A3:H3");

  ws.addRow([]);

  //? Encabezado "Empleado / Beneficiarios"
  const sectionRow = ws.addRow([
    "Empleado",
    "",
    "",
    "",
    "Beneficiarios",
    "",
    "",
    "",
  ]);
  sectionRow.eachCell((cell) => {
    applyCellStyle(cell, COLORS.MEDIUM_700, "FFFFFF", true, "center");
  });

  //? Encabezados de columnas
  const headerRow = ws.addRow([
    "Nómina",
    "Nombre",
    "Departamento",
    "Puesto",
    "Sindicato",
    "Nombre Completo",
    "Parentesco",
    "Edad",
  ]);

  headerRow.eachCell((cell) => {
    applyCellStyle(cell, COLORS.MEDIUM_600, "FFFFFF", true, "center");
  });

  //? Congelar encabezados
  ws.views = [{ state: "frozen", ySplit: 5 }];

  //? Datos filtrados
  let rowCounter = 0;

  filteredData.forEach((emp) => {
    rowCounter++;
    const startRow = ws.rowCount + 1;

    //* Fila del empleado
    const empRow = ws.addRow([
      emp.no_nomina,
      emp.empName,
      emp.departamento,
      emp.puesto,
      emp.sindicato || "N/A",
      "",
      "",
      "",
    ]);

    empRow.eachCell((cell) => {
      applyCellStyle(cell, COLORS.LIGHT_200, "000000", true);
    });

    //* Beneficiarios
    if (emp.beneficiarios && emp.beneficiarios.length > 0) {
      emp.beneficiarios.forEach((b) => {
        const edad = calcEdad(b.F_NACIMIENTO);
        const benRow = ws.addRow([
          "",
          "",
          "",
          "",
          "",
          `${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}`,
          b.PARENTESCO_DESCRIPCION,
          isNaN(edad) ? "N/A" : edad,
        ]);

        benRow.eachCell((cell, colNumber) => {
          if (colNumber >= 6) {
            //! Solo aplicar estilo a las celdas de beneficiario
            applyCellStyle(cell, COLORS.LIGHT_50);
          }
        });
      });
    } else {
      //! Si no hay beneficiarios
      const emptyRow = ws.addRow([
        "",
        "",
        "",
        "",
        "",
        "Sin beneficiarios",
        "",
        "",
      ]);
      emptyRow.eachCell((cell) => {
        applyCellStyle(cell, COLORS.LIGHT_50);
      });
    }

    //* Combinar celdas del empleado
    const endRow = ws.rowCount;
    ["A", "B", "C", "D", "E"].forEach((col) => {
      ws.mergeCells(`${col}${startRow}:${col}${endRow}`);
    });

    ws.addRow([]);
  });

  //* Anchos de columnas
  ws.columns = [
    { width: 12 }, //? Nómina
    { width: 32 }, //? Nombre
    { width: 22 }, //? Departamento
    { width: 22 }, //? Puesto
    { width: 15 }, //? Sindicato
    { width: 35 }, //? Beneficiario
    { width: 18 }, //? Parentesco
    { width: 8 }, //? Edad
  ];

  //* Filtros automáticos
  ws.autoFilter = {
    from: {
      row: 5,
      column: 1,
    },
    to: {
      row: 5,
      column: 8,
    },
  };

  //* Total de registros en el pie
  const totalRow = ws.addRow([`Total empleados: ${rowCounter}`]);
  totalRow.eachCell((cell) => {
    applyCellStyle(cell, COLORS.DARK_800, "FFFFFF", true, "center");
  });
  ws.mergeCells(`A${ws.rowCount}:H${ws.rowCount}`);
};

/* -------------------------------------------------- */
//?  📊  Hoja Resumen                                   */
/* -------------------------------------------------- */

const buildSummarySheet = (stats, wb, filters) => {
  const ws = wb.addWorksheet("Resumen", {
    properties: { tabColor: { argb: COLORS.DARK_800 } },
  });

  //* Título
  ws.mergeCells("A1:D1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Resumen Estadístico";
  applyCellStyle(titleCell, COLORS.DARK_900, "FFFFFF", true, "center");
  titleCell.font.size = 16;

  //* Filtros aplicados
  ws.addRow(["Filtros aplicados:", "", "", ""]);
  ws.addRow(["Búsqueda:", filters.searchTerm || "Ninguna"]);
  ws.addRow(["Departamento:", filters.deptFilter || "Todos"]);
  ws.addRow(["Sindicato:", filters.sindFilter || "Todos"]);
  ws.addRow(["Tipo beneficiario:", filters.beneficiaryTypeFilter || "Todos"]);

  //* Aplicar estilo a la sección de filtros
  for (let i = 2; i <= 6; i++) {
    const row = ws.getRow(i);
    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        applyCellStyle(cell, COLORS.LIGHT_200, "000000", true);
      } else if (colNumber === 2) {
        applyCellStyle(cell, null, "000000");
      }
    });
  }

  ws.addRow([]);

  //* Datos estadísticos
  const totalBenef =
    stats.hijos + stats.esposos + stats.concubinos + stats.padres;
  const withBenefitsPercentage = stats.total
    ? (stats.withBenefits / stats.total) * 100
    : 0;

  const rows = [
    ["Total Empleados", stats.total, "", "Empleados con beneficiarios"],
    [
      "Empleados con Beneficiarios",
      stats.withBenefits,
      "",
      `(${withBenefitsPercentage.toFixed(1)}%)`,
    ],
    ["Total Beneficiarios", totalBenef, "", "Distribución por parentesco"],
    [
      "Hijos",
      stats.hijos,
      "",
      `(${totalBenef ? ((stats.hijos / totalBenef) * 100).toFixed(1) : 0}%)`,
    ],
    [
      "Esposos",
      stats.esposos,
      "",
      `(${totalBenef ? ((stats.esposos / totalBenef) * 100).toFixed(1) : 0}%)`,
    ],
    [
      "Concubinos",
      stats.concubinos,
      "",
      `(${
        totalBenef ? ((stats.concubinos / totalBenef) * 100).toFixed(1) : 0
      }%)`,
    ],
    [
      "Padres",
      stats.padres,
      "",
      `(${totalBenef ? ((stats.padres / totalBenef) * 100).toFixed(1) : 0}%)`,
    ],
    [
      "Promedio por Empleado",
      stats.total ? (totalBenef / stats.total).toFixed(2) : 0,
      "",
      "",
    ],
  ];

  rows.forEach((rowData) => {
    const row = ws.addRow(rowData);
    row.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        applyCellStyle(cell, COLORS.LIGHT_500, "FFFFFF", true);
      } else if (colNumber === 2) {
        applyCellStyle(cell, COLORS.LIGHT_200);
      } else if (colNumber === 4) {
        applyCellStyle(cell, null, "000000", false, "right");
      } else {
        applyCellStyle(cell, null);
      }
    });
  });

  //* Agregar gráfico (solo estructura, ExcelJS requiere configuración adicional)
  ws.addRow([]);
  ws.addRow([
    "Nota: Abra este archivo en Excel para ver los gráficos interactivos",
  ]);
  const noteRow = ws.getRow(ws.rowCount);
  noteRow.font = { italic: true, color: { argb: "666666" } };

  //* Anchos de columnas
  ws.columns = [{ width: 28 }, { width: 18 }, { width: 5 }, { width: 35 }];

  //* Proteger la hoja de modificaciones
  ws.protect("", {
    selectLockedCells: false,
    selectUnlockedCells: false,
  });
};

/* -------------------------------------------------- */
//*  🚀  Exportador principal                            */
/* -------------------------------------------------- */

export const exportToExcel = async (filteredData, stats, filters = {}) => {
  //* Validar datos antes de exportar
  if (
    !filteredData ||
    !Array.isArray(filteredData) ||
    filteredData.length === 0
  ) {
    console.warn("No hay datos válidos para exportar");
    return;
  }

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Servicio Médico PANDORA";
    wb.created = new Date();
    wb.modified = new Date();
    wb.lastPrinted = new Date();

    //* Normalizar nombres de filtros para el nombre de archivo
    const filterAliases = {
      searchTerm: "busq",
      deptFilter: "depto",
      sindFilter: "sind",
      beneficiaryTypeFilter: "tipo",
    };

    //* Construir nombre de archivo
    const activeFilters = Object.entries(filters)
      .filter(([, value]) => value && value !== "Ninguno" && value !== "Todos")
      .map(([key, value]) => {
        const alias = filterAliases[key] || key.substring(0, 4);
        return `${alias}_${value.replace(/\s+/g, "_")}`;
      })
      .join("_");

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `Beneficiarios_${dateStr}${
      activeFilters ? `_${activeFilters}` : ""
    }`;

    //* Construir hojas
    buildMainSheet(filteredData, wb, filters);
    buildSummarySheet(stats, wb, filters);

    wb.eachSheet((ws) => {
      ws.protect("P4nd0r4!", {
        //! qué acciones permites tras desbloquear (o bloquear)
        selectLockedCells: false,
        selectUnlockedCells: false,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        //! si quieres habilitar solo la ordenación/auto-filtros:
        //! sort: true,
        //! autoFilter: true
      });
    });

    //* Generar Excel
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    //* Descargar
    saveAs(blob, `${fileName}.xlsx`);

    return true;
  } catch (error) {
    console.error("Error crítico al generar el Excel:", error);

    //* Mostrar alerta al usuario
    if (typeof window !== "undefined" && window.alert) {
      alert(
        `Error al generar el reporte: ${error.message || "Intente nuevamente"}`
      );
    }

    return false;
  }
};
