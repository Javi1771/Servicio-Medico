//? -----------------------------------------------------------------------------
//? Genera un Excel profesional para “Incapacidades” usando la paleta Tangerine
//? (shades 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950).
//? Instalación previa:  npm i exceljs file-saver
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
  const [, datePart, timePart] = parts; // ej. ["Lunes", "05/06/2023", "10:30 a.m."]
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

/*
 * Construye la hoja principal "Incapacidades" con todos los registros.
 *
 * @param {Array} records  — arreglo de objetos con estructura:
 *   [
 *     {
 *       nomina: string,
 *       empleado: {
 *         nombre: string,
 *         a_paterno: string,
 *         a_materno: string,
 *         departamento: string,
 *         puesto: string,
 *       },
 *       fecha: string (formateada),
 *       fechainicio: string (formateada),
 *       fechafin: string (formateada),
 *       observaciones: string,
 *       nombreProveedor: string
 *     },
 *     ...
 *   ]
 * @param {Workbook} wb  — instancia de ExcelJS.Workbook
 */
const buildIncapSheet = (records, wb) => {
  // Colores Tangerine (sin '#'):
  //   50  = FFFBEC
  //   200 = FFE8A5
  //   500 = FFA00A
  //   600 = FF8800
  //   700 = CC6402
  //   900 = 82410C

  // Crear hoja “Incapacidades” con pestaña color Tangerine 900 (#82410C)
  const ws = wb.addWorksheet('Incapacidades', {
    pageSetup: { fitToWidth: 1 },
    properties: { tabColor: { argb: '82410C' } }
  });

  //? ---------- Título y fecha de generación ---------- */
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

  //* ---------- Encabezados de columnas ---------- */
  //* Columnas: Nómina, Empleado, Departamento, Puesto,
  //* Fecha Registro, Fecha Inicio, Fecha Fin, Días, Observaciones, Proveedor
  //* Fondo Tangerine 600 (#FF8800), texto blanco
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
  // Aumentamos la altura del encabezado a 30 para que quepa mejor el texto
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8800' }
    };
    // WrapText activado y alineación centrada verticalmente
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  //* Congelar la parte superior (hasta fila 4)
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  //? ---------- Datos de incapacidades ---------- */
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

    // Aumentamos la altura de cada fila de datos a 25 para que no se amontone el texto
    row.height = 25;
    row.eachCell((cell, colNumber) => {
      cell.font = { color: { argb: '000000' }, size: 11 };
      //* Alternar fondo para legibilidad: pares --> Tangerine 50 (#FFFBEC), nones --> blanco
      const bgColor = row.number % 2 === 0 ? 'FFFBEC' : 'FFFFFF';
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor },
      };
      // Alineación vertical al medio y wrapText para ajustar texto largo
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
      //* Alinear fechas y números centradamente
      if ([5, 6, 7, 8].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
  });

  //* ---------- Ajustar anchos de columnas ---------- */
  // Aumentamos ancho de algunas columnas críticas para que el contenido tenga más espacio
  ws.columns = [
    { width: 12 },  // A: Nómina
    { width: 30 },  // B: Empleado
    { width: 25 },  // C: Departamento
    { width: 25 },  // D: Puesto
    { width: 14 },  // E: Fecha Registro
    { width: 14 },  // F: Fecha Inicio
    { width: 14 },  // G: Fecha Fin
    { width: 8  },  // H: Días
    { width: 50 },  // I: Observaciones (más ancho para comentarios largos)
    { width: 25 },  // J: Proveedor
  ];

  //* Filtros automáticos sobre encabezados (fila 4)
  const lastCol = 'J';
  const headerRowNumber = 4;
  ws.autoFilter = { from: `A${headerRowNumber}`, to: `${lastCol}${headerRowNumber}` };
};


/* -------------------------------------------------- */
//?  📊  Hoja “Resumen”                                  */
/* -------------------------------------------------- */

/*
 * Construye la hoja resumen con métricas clave de incapacidades.
 *
 * @param {Object} stats  — objeto con métricas calculadas:
 *   {
 *     totalIncap: number,
 *     totalEmpleados: number,
 *     totalDias: number,
 *     empleadoMasIncap: { nombre: string, count: number },
 *     empleadoMasDias: { nombre: string, totalDuration: number },
 *     promedioDiasPorIncap: number
 *   }
 * @param {Workbook} wb  — instancia de ExcelJS.Workbook
 */
const buildSummarySheet = (stats, wb) => {
  //* Crear hoja “Resumen” y color de pestaña Tangerine 800 (#A14D0B)
  const ws = wb.addWorksheet('Resumen', {
    properties: { tabColor: { argb: 'A14D0B' } }
  });

  //* Título principal (merge A1:D1), fondo Tangerine 900 (#82410C)
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

  //* Encabezados de la tabla de resumen (fila 3), fondo Tangerine 700 (#CC6402)
  const hdr = ws.addRow(['Métrica', 'Valor', '', 'Detalle']);
  // Altura un poco mayor para no cortar el texto
  hdr.height = 22;
  hdr.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CC6402' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  //* Definir filas de datos basadas en stats
  const rowsData = [
    ['Total Registros', stats.totalIncap, '', 'Número total de incapacidades'],
    ['Total Empleados', stats.totalEmpleados, '', 'Empleados con al menos una incapacidad'],
    ['Total Días Perdidos', stats.totalDias, '', 'Suma de días perdidos'],
    [
      'Empleado con más Incap.',
      stats.empleadoMasIncap.count,
      '',
      `${stats.empleadoMasIncap.nombre}`,
    ],
    [
      'Empleado con más Días',
      stats.empleadoMasDias.totalDuration,
      '',
      `${stats.empleadoMasDias.nombre}`,
    ],
    [
      'Promedio Días/Incap',
      stats.promedioDiasPorIncap,
      '',
      'Días promedio por incapacidad',
    ],
  ];

  //* Rellenar filas de datos
  rowsData.forEach((r) => {
    const row = ws.addRow(r);
    // Aumentar altura para permitir texto extenso
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder;
      if (colNumber === 1) {
        //* Métrica: fondo Tangerine 500 (#FFA00A), texto blanco
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFA00A' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' };
      } else if (colNumber === 2) {
        //* Valor: fondo Tangerine 200 (#FFE8A5), texto negro
        cell.font = { color: { argb: '000000' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8A5' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'center' };
      } else {
        //* Vacío o Detalle: texto negro, sin relleno
        cell.font = { color: { argb: '000000' }, size: 11 };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' };
      }
    });
  });

  //* Ajustar anchos de columnas
  ws.columns = [
    { width: 28 }, // A: Métrica (más ancho para textos largos)
    { width: 14 }, // B: Valor
    { width: 5  }, // C: (vacío)
    { width: 40 }, // D: Detalle (más espacio para explicaciones)
  ];
};


/* -------------------------------------------------- */
/*  🚀  Exportador principal                            */
/* -------------------------------------------------- */

/*
 * Exporta un reporte de incapacidades a Excel con dos hojas:
 *  1) “Incapacidades” — lista de todos los registros con detalles.
 *  2) “Resumen”       — métricas clave calculadas.
 *
 * @param {Array} records  — arreglo de registros de incapacidades (obtenido de la API).
 *   Cada elemento tiene:
 *     {
 *       nomina: string,
 *       empleado: { nombre, a_paterno, a_materno, departamento, puesto },
 *       fecha, fechainicio, fechafin (strings),
 *       observaciones: string,
 *       nombreProveedor: string
 *     }
 */
export const exportToExcel = async (records) => {
  // 1) Calcular estadísticas sobre los registros
  const totalIncap = records.length;

  // Agrupar por nómina para obtener conteos y totales
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
  let empleadoMasDias = { nombre: 'N/A', totalDuration: 0 };

  Object.values(mapByNomina).forEach((info) => {
    totalDias += info.totalDuration;
    if (info.count > empleadoMasIncap.count) {
      empleadoMasIncap = { nombre: info.nombre, count: info.count };
    }
    if (info.totalDuration > empleadoMasDias.totalDuration) {
      empleadoMasDias = { nombre: info.nombre, totalDuration: info.totalDuration };
    }
  });

  const promedioDiasPorIncap = totalIncap > 0 ? Math.round(totalDias / totalIncap) : 0;

  const stats = {
    totalIncap,
    totalEmpleados,
    totalDias,
    empleadoMasIncap,
    empleadoMasDias,
    promedioDiasPorIncap,
  };

  // 2) Crear Workbook y metadatos
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Servicio Médico SJR';
  wb.created = new Date();

  // 3) Construir hojas con paleta Tangerine
  buildIncapSheet(records, wb);
  buildSummarySheet(stats, wb);

  // 4) Generar buffer y descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Reporte_Incapacidades_${dateStr}.xlsx`);
};
