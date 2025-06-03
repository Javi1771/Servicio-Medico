//? -----------------------------------------------------------------------------
//? Genera un Excel con formato profesional usando la paleta Regal Blue
//? (shades 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).
//? Instalación previa:  npm i exceljs file-saver
//? -----------------------------------------------------------------------------

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/* -------------------------------------------------- */
//*  🛠️  Utilidades                                     */
/* -------------------------------------------------- */

/*
 * Extrae DD/MM/YYYY de "DíaSemana, DD/MM/YYYY, hh:mm a. m."
 * y devuelve la edad en años completos a la fecha actual.
 * Si el patrón no coincide devuelve "N/A".
 */
const calcEdad = (fechaStr) => {
  if (!fechaStr) return 'N/A';
  const m = fechaStr.match(/,\s*(\d{2})\/(\d{2})\/(\d{4})/); //* captura DD/MM/YYYY
  if (!m) return 'N/A';
  const [, dd, mm, yyyy] = m;
  const date = new Date(+yyyy, +mm - 1, +dd);
  if (isNaN(date)) return 'N/A';
  return Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 3600 * 1000));
};

/*
 * Devuelve un objeto ExcelJS.Border con borde fino y color negro.
 */
const thinBorder = {
  top:    { style: 'thin' },
  bottom: { style: 'thin' },
  left:   { style: 'thin' },
  right:  { style: 'thin' }
};

/* -------------------------------------------------- */
//?  📄  Hoja principal                                 */
/* -------------------------------------------------- */

const buildMainSheet = (normalized, wb) => {
  // Crear hoja “Beneficiarios” y asignar el color de pestaña 900 (#0B3B60)
  const ws = wb.addWorksheet('Beneficiarios', {
    pageSetup: { fitToWidth: 1 },
    properties: { tabColor: { argb: '0B3B60' } } // Regal Blue 900
  });

  //? ---------- Título y fecha ---------- */
  ws.mergeCells('A1:G1');
  ws.mergeCells('A2:G2');

  //? Título principal (fondo Regal Blue 900)
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Reporte de Beneficiarios';
  titleCell.font  = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0B3B60' } 
  };

  //? Fecha generación (fondo Regal Blue 900, texto blanco)
  const dateCell = ws.getCell('A2');
  dateCell.value = `Generado el ${new Date().toLocaleDateString()}`;
  dateCell.font  = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0B3B60' } 
  };

  ws.addRow([]); 

  //* ---------- Encabezado “Empleado / Beneficiarios” ---------- */
  //? Fondo Regal Blue 700 (#045EA0), texto blanco
  const sectionRow = ws.addRow(['Empleado', '', '', '', 'Beneficiarios', '', '']);
  sectionRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '045EA0' } 
    };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = thinBorder;
  });

  //* ---------- Encabezados de columnas ---------- */
  //? Fondo Regal Blue 600 (#0377C6), texto blanco
  const headerRow = ws.addRow([
    'Nómina', 'Nombre', 'Departamento', 'Puesto',
    'Nombre Completo', 'Parentesco', 'Edad'
  ]);
  headerRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFF' } };
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0377C6' } 
    };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = thinBorder;
  });

  //* Congelar la parte superior (hasta fila 5) */
  ws.views = [{ state: 'frozen', ySplit: 5 }];

  //? ---------- Datos ---------- */
  normalized.forEach((emp) => {
    const startRow = ws.rowCount + 1;

    //? --- Fila del empleado ---
    //? Fondo Regal Blue 200 (#BAE1FD), texto negro
    const empRow = ws.addRow([
      emp.no_nomina,
      emp.empName,
      emp.departamento,
      emp.puesto,
      '', '', ''
    ]);
    empRow.eachCell((c) => {
      c.font = { bold: true, color: { argb: '000000' } };
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'BAE1FD' } 
      };
      c.border = thinBorder;
      c.alignment = { vertical: 'middle', wrapText: true };
    });

    //? --- Beneficiarios ---
    emp.beneficiarios.forEach((b) => {
      const edad = calcEdad(b.F_NACIMIENTO);

      //? Fondo Regal Blue 50 (#F0F8FF), texto negro
      const benRow = ws.addRow([
        '', '', '', '',
        `${b.NOMBRE} ${b.A_PATERNO} ${b.A_MATERNO}`,
        b.PARENTESCO_DESCRIPCION,
        edad
      ]);
      benRow.eachCell((c) => {
        c.font = { color: { argb: '000000' } };
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F0F8FF' } // 50
        };
        c.border = thinBorder;
        c.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    //? Combinar columnas A–D en el bloque del empleado (vertical)
    const endRow = ws.rowCount;
    ['A', 'B', 'C', 'D'].forEach((col) => {
      ws.mergeCells(`${col}${startRow}:${col}${endRow}`);
    });

    ws.addRow([]); 
  });

  //* ---------- Anchos de columnas ---------- */
  ws.columns = [
    { width: 10 },  //! A: Nómina
    { width: 30 },  //! B: Nombre
    { width: 25 },  //! C: Departamento
    { width: 25 },  //! D: Puesto
    { width: 35 },  //! E: Beneficiario
    { width: 15 },  //! F: Parentesco
    { width: 8 }    //! G: Edad
  ];

  //* Agregar filtros automáticos en la fila de encabezados (fila 5) */
  ws.autoFilter = { from: 'A5', to: 'G5' };
};

/* -------------------------------------------------- */
//?  📊  Hoja Resumen                                   */
/* -------------------------------------------------- */

const buildSummarySheet = (stats, wb) => {
  //* Crear hoja “Resumen” y color de pestaña Regal Blue 800 (#085184)
  const ws = wb.addWorksheet('Resumen', {
    properties: { tabColor: { argb: '085184' } }
  });

  //* Título de resumen (merge A1:D1), fondo Regal Blue 900 (#0B3B60)
  ws.mergeCells('A1:D1');
  const title = ws.getCell('A1');
  title.value = 'Resumen Estadístico';
  title.font  = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0B3B60' } 
  };

  ws.addRow([]); 

  //* Encabezados de la tabla de resumen (fila 3), fondo Regal Blue 700 (#045EA0)
  const hdr = ws.addRow(['Métrica', 'Valor', '', 'Detalle']);
  hdr.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFF' } };
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '045EA0' } 
    };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = thinBorder;
  });

  const totalBenef = stats.hijos + stats.esposos + stats.concubinos + stats.padres;
  const filas = [
    ['Total Empleados', stats.total, '', 'Empleados con beneficiarios'],
    [
      'Empleados con Beneficiarios',
      stats.withBenefits,
      '',
      `(${((stats.withBenefits / stats.total) * 100 || 0).toFixed(1)}%)`
    ],
    ['Total Beneficiarios', totalBenef, '', 'Distribución por parentesco'],
    ['Hijos', stats.hijos, '', `(${((stats.hijos / totalBenef) * 100 || 0).toFixed(1)}%)`],
    ['Esposos', stats.esposos, '', `(${((stats.esposos / totalBenef) * 100 || 0).toFixed(1)}%)`],
    ['Concubinos', stats.concubinos, '', `(${((stats.concubinos / totalBenef) * 100 || 0).toFixed(1)}%)`],
    ['Padres', stats.padres, '', `(${((stats.padres / totalBenef) * 100 || 0).toFixed(1)}%)`],
    ['Promedio por Empleado', stats.total ? (totalBenef / stats.total).toFixed(2) : 0, '', '']
  ];

  rows: for (let i = 0; i < filas.length; i++) {
    const r = filas[i];
    const row = ws.addRow(r);
    row.eachCell((c, col) => {
      c.border = thinBorder;

      if (col === 1) {
        //? Columna "Métrica": fondo Regal Blue 500 (#0F96E8), texto blanco
        c.font = { bold: true, color: { argb: 'FFFFFF' } };
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0F96E8' }
        };
      } else if (col === 2) {
        //? Columna "Valor": fondo Regal Blue 200 (#BAE1FD), texto negro
        c.font = { color: { argb: '000000' } };
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'BAE1FD' } 
        };
      } else {
        //? Columnas vacías o "Detalle": texto negro, sin relleno
        c.font = { color: { argb: '000000' } };
      }
    });
  }

  ws.columns = [
    { width: 25 }, // A: Métrica
    { width: 15 }, // B: Valor
    { width: 5 },  // C: (vacío)
    { width: 35 }  // D: Detalle
  ];
};

/* -------------------------------------------------- */
/*  🚀  Exportador principal                            */
/* -------------------------------------------------- */

export const exportToExcel = async (normalized, stats) => {
  // 1) Crear el Workbook y metadatos básicos
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Servicio Médico SJR';
  wb.created = new Date();

  // 2) Construir cada hoja
  buildMainSheet(normalized, wb);
  buildSummarySheet(stats, wb);

  // 3) Generar el buffer y disparar la descarga
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );

  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Reporte_Beneficiarios_${dateStr}.xlsx`);
};
