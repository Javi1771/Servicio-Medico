//? -----------------------------------------------------------------------------
//? Genera un Excel profesional para “Incapacidades” usando la paleta Tangerine
//? -----------------------------------------------------------------------------

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


/* -------------------------------------------------- */
//*  🛠️  Utilidades                                     */
/* -------------------------------------------------- */

/*
 * Parsea fechas en formato "DíaSemana, DD/MM/YYYY, hh:mm a.m./p.m."
 * y devuelve un objeto Date. Retorna null si no es válido.
 */
const parseFormattedDate = (str) => {
  if (!str) return null;
  const parts = str.split(', ');
  if (parts.length < 3) return null;
  const [, datePart, timePart] = parts; 
  const [dd, mm, yyyy] = datePart.split('/').map(Number);
  let [time, period] = timePart.split(' ');
  const [hh, min] = time.split(':').map(Number);
  let hours24 = hh % 12;
  if (period === 'p.m.') hours24 += 12;
  const date = new Date(yyyy, mm - 1, dd, hours24, min);
  return isNaN(date.getTime()) ? null : date;
};

/*
 * Calcula la duración en días (inclusive) entre dos cadenas de fecha formateada.
 * Retorna 0 si alguna no es válida.
 */
const calculateDuration = (startStr, endStr) => {
  const start = parseFormattedDate(startStr);
  const end = parseFormattedDate(endStr);
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

/*
 * Devuelve un objeto ExcelJS.Border con borde fino color negro.
 */
const thinBorder = {
  top:    { style: 'thin', color: { argb: '000000' } },
  bottom: { style: 'thin', color: { argb: '000000' } },
  left:   { style: 'thin', color: { argb: '000000' } },
  right:  { style: 'thin', color: { argb: '000000' } }
};

/*
 * Convierte la fecha formateada "DíaSemana, DD/MM/YYYY, hh:mm a.m./p.m." 
 * a una cadena "DD/MM/YYYY" para mostrar en Excel.
 */
const formatToDDMMYYYY = (str) => {
  const date = parseFormattedDate(str);
  if (!date) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};


/* -------------------------------------------------- */
//?  📄  Hoja “Incapacidades”                           */
/* -------------------------------------------------- */

const buildIncapSheet = (records, wb) => {

  const ws = wb.addWorksheet('Incapacidades', {
    pageSetup: { fitToWidth: 1 },
    properties: { tabColor: { argb: '82410C' } }
  });

  //* Título
  ws.mergeCells('A1:J1');
  ws.mergeCells('A2:J2');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Reporte de Incapacidades';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '82410C' }
  };

  const dateCell = ws.getCell('A2');
  dateCell.value = `Generado el ${new Date().toLocaleDateString()}`;
  dateCell.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  dateCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '82410C' },
  };

  ws.addRow([]);

  //* Encabezados
  const headerRow = ws.addRow([
    'Nómina',
    'Empleado',
    'Departamento',
    'Puesto',
    'Fecha Registro',
    'Fecha Inicio',
    'Fecha Fin',
    'Días',
    'Observaciones',
    'Proveedor',
  ]);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8800' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  ws.views = [{ state: 'frozen', ySplit: 4 }];

  //* Datos
  records.forEach((rec) => {
    const empFullName = `${rec.empleado.nombre} ${rec.empleado.a_paterno} ${rec.empleado.a_materno}`;
    const fechaReg = formatToDDMMYYYY(rec.fecha);
    const fechaini = formatToDDMMYYYY(rec.fechainicio);
    const fechafin = formatToDDMMYYYY(rec.fechafin);
    const dias = calculateDuration(rec.fechainicio, rec.fechafin);
    const observ = rec.observaciones || '';
    const proveedor = rec.nombreProveedor || '';

    const row = ws.addRow([
      rec.nomina,
      empFullName,
      rec.empleado.departamento || '',
      rec.empleado.puesto || '',
      fechaReg,
      fechaini,
      fechafin,
      dias,
      observ,
      proveedor,
    ]);
    row.height = 25;
    row.eachCell((cell, colNumber) => {
      cell.font = { color: { argb: '000000' }, size: 11 };
      const bgColor = row.number % 2 === 0 ? 'FFFBEC' : 'FFFFFF';
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
      if ([5, 6, 7, 8].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
  });

  ws.columns = [
    { width: 12 },
    { width: 30 },
    { width: 25 },
    { width: 25 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 8  },
    { width: 50 },
    { width: 25 },
  ];

  ws.autoFilter = { from: 'A4', to: 'J4' };
};


/* -------------------------------------------------- */
//?  📊  Hoja “Resumen”                                  */
/* -------------------------------------------------- */

const buildSummarySheet = (stats, wb) => {
  const ws = wb.addWorksheet('Resumen', {
    properties: { tabColor: { argb: 'A14D0B' } }
  });

  ws.mergeCells('A1:D1');
  const title = ws.getCell('A1');
  title.value = 'Resumen de Incapacidades';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '82410C' },
  };

  ws.addRow([]);

  const hdr = ws.addRow(['Métrica', 'Valor', '', 'Detalle']);
  hdr.height = 22;
  hdr.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CC6402' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  const rowsData = [
    ['Total Registros', stats.totalIncap, '', 'Número total de incapacidades'],
    ['Total Empleados', stats.totalEmpleados, '', 'Empleados con al menos una incapacidad'],
    ['Total Días Perdidos', stats.totalDias, '', 'Suma de días perdidos'],
    ['Empleado c/ más Incap.', stats.empleadoMasIncap.count, '', stats.empleadoMasIncap.nombre],
    ['Empleado c/ más Días', stats.empleadoMasDias.totalDuration, '', stats.empleadoMasDias.nombre],
    ['Promedio Días/Incap', stats.promedioDiasPorIncap, '', 'Días promedio por incapacidad'],
  ];

  rowsData.forEach((r) => {
    const row = ws.addRow(r);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder;
      if (colNumber === 1) {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA00A' } };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' };
      } else if (colNumber === 2) {
        cell.font = { color: { argb: '000000' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8A5' } };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'center' };
      } else {
        cell.font = { color: { argb: '000000' }, size: 11 };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' };
      }
    });
  });

  ws.columns = [
    { width: 28 },
    { width: 14 },
    { width: 5  },
    { width: 40 },
  ];
};


/* -------------------------------------------------- */
//*  🚀  Exportador principal                            */
/* -------------------------------------------------- */

export const exportToExcel = async (records) => {
  // Calcular estadísticas
  const totalIncap = records.length;
  const mapByNomina = {};
  records.forEach((rec) => {
    const key = rec.nomina;
    const dias = calculateDuration(rec.fechainicio, rec.fechafin);
    if (!mapByNomina[key]) {
      mapByNomina[key] = {
        nombre: `${rec.empleado.nombre} ${rec.empleado.a_paterno} ${rec.empleado.a_materno}`,
        count: 0,
        totalDuration: 0,
      };
    }
    mapByNomina[key].count += 1;
    mapByNomina[key].totalDuration += dias;
  });
  const totalEmpleados = Object.keys(mapByNomina).length;
  let totalDias = 0;
  let empleadoMasIncap = { nombre: 'N/A', count: 0 };
  let empleadoMasDias  = { nombre: 'N/A', totalDuration: 0 };
  Object.values(mapByNomina).forEach((info) => {
    totalDias += info.totalDuration;
    if (info.count > empleadoMasIncap.count)   empleadoMasIncap = { nombre: info.nombre, count: info.count };
    if (info.totalDuration > empleadoMasDias.totalDuration) empleadoMasDias = { nombre: info.nombre, totalDuration: info.totalDuration };
  });
  const promedioDiasPorIncap = totalIncap > 0 ? Math.round(totalDias / totalIncap) : 0;
  const stats = { totalIncap, totalEmpleados, totalDias, empleadoMasIncap, empleadoMasDias, promedioDiasPorIncap };

  //* Crear Workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Servicio Médico SJR';
  wb.created = new Date();

  //* Construir hojas
  buildIncapSheet(records, wb);
  buildSummarySheet(stats, wb);

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
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Reporte_Incapacidades_${dateStr}.xlsx`);
};
