/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PDFDocument, rgb } from "pdf-lib";
import JsBarcode from "jsbarcode";
import styles from "../../css/SURTIMIENTOS_ESTILOS/modalPdf.module.css";

const ModalPdf = ({ folio, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [, setDataReceta] = useState(null);
  const [, setNombreDoctor] = useState("Dr.");

  /**
   * Función para partir un texto en varias líneas según un número máximo de caracteres.
   */
  function wrapText(text, maxCharsPerLine) {
    if (!text) return [];
    const regex = new RegExp(`.{1,${maxCharsPerLine}}`, "g");
    return text.match(regex) || [];
  }

  // Obtener el nombre del doctor
  const fetchDoctorName = async (claveUsuario) => {
    try {
      const response = await fetch(`/api/getDoctor?claveusuario=${claveUsuario}`);
      const data = await response.json();
      if (data && data.nombreproveedor) {
        setNombreDoctor(`Dr. ${data.nombreproveedor}`);
      }
    } catch (error) {
      console.error("❌ Error obteniendo el nombre del doctor:", error);
    }
  };

  // Obtener el nombre completo del empleado
  const fetchNombreEmpleado = async (num_nom) => {
    try {
      //console.log(`📡 Consultando nombre del empleado con num_nom: ${num_nom}`);
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom }),
      });
      const data = await response.json();
      //console.log("👤 Datos del empleado recibidos:", data);
      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }
      const nombreCompleto = `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${data.a_materno ?? ""}`.trim();
      //console.log("✅ Nombre completo obtenido:", nombreCompleto);
      return nombreCompleto;
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  /**
   * Dibuja campos generales en la parte superior de la página (fecha, nómina, empleado).
   */
  // Función para formatear la fecha con día de la semana en español
function formatFecha(fecha) {
  const date = new Date(fecha);
  const diasSemana = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const diaSemana = diasSemana[date.getUTCDay()];
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const año = date.getUTCFullYear();
  const horas = date.getUTCHours();
  const minutos = String(date.getUTCMinutes()).padStart(2, "0");
  const periodo = horas >= 12 ? "p.m." : "a.m.";
  const horas12 = horas % 12 === 0 ? 12 : horas % 12;

  return `${diaSemana}, ${dia}/${mes}/${año}, ${horas12}:${minutos} ${periodo}`;
}


  
  const drawGeneralFields = (page, data, nombreEmpleado, folio) => {
  // Usamos la función para formatear la fecha
  const formattedFecha = formatFecha(data.FECHA_EMISION);
  page.drawText(formattedFecha, { x: 102, y: 664, size: 10 });    page.drawText(String(data.NOMINA ?? "N/A"), { x: 109, y: 645, size: 10 });
    page.drawText(String(nombreEmpleado ?? "N/A"), { x: 120, y: 627, size: 10 });

    const barcodeString = `${data.NOMINA} ${data.CLAVEMEDICO} ${folio} ${Number(data.FOLIO_SURTIMIENTO)}`;
    console.log("Barcode string (para esta página):", barcodeString);
  };

  /**
   * Dibuja el resto de campos (departamento, sindicato, paciente, firmas).
   */
  const drawRemainingFields = (page, data) => {
    // Departamento
    const departamentoTexto = String(data.DEPARTAMENTO?.trim() ?? "N/A");
    const departamentoLineas = wrapText(departamentoTexto, 33);
    let yDepartamento = 664;
    departamentoLineas.forEach((line) => {
      page.drawText(line, { x: 410, y: yDepartamento, size: 10 });
      yDepartamento -= 12;
    });
  
    // Sindicato
    page.drawText(String(data.SINDICATO ?? ""), { x: 410, y: 626, size: 10 });
  
    // Paciente
    page.drawText(String(data.NOMBRE_PACIENTE ?? "N/A"), { x: 115, y: 571, size: 10 });
    page.drawText(String(data.NOMBRE_PACIENTE ?? "N/A"), { x: 345, y: 75, size: 10 });
    page.drawText(String(data.EDAD ?? "N/A"), { x: 435, y: 571, size: 10 });
  
    // === Aquí sustituimos el diagnóstico anterior por el nuevo bloque con wrapText y size=6 ===
    const diagnosticoTexto = String(data.DIAGNOSTICO ?? "N/A").trim();
    const diagnosticoLineas = wrapText(diagnosticoTexto, 130);
  
    let yDiag = 510;
    diagnosticoLineas.forEach((line) => {
      page.drawText(line, {
        x: 60,  // Margen horizontal
        y: yDiag,
        size: 6,  // Tamaño de letra 6
      });
      yDiag -= 8; // Espacio vertical entre líneas
    });
  
    // Firma del doctor y nombre de quien elaboró
    page.drawText(`${data.doctor ?? "Desconocido"}`, { x: 71, y: 95, size: 12, color: rgb(0, 0, 0) });
    page.drawText(` ${data.cedula ?? "No disponible"}`, { x: 40, y: 82, size: 9, color: rgb(0, 0, 0) });
    page.drawText(`${data.elaboro ?? "Desconocido"}`, { x: 400, y: 18, size: 10, color: rgb(0, 0, 0) });
  };
  

  /**
   * Crea una página nueva (clonada) y dibuja en ella los campos generales, remainingFields y el código de barras.
   */
  const createNewPage = async (outerDoc, templateDoc, data, nombreEmpleado, folio) => {
    const [newPage] = await outerDoc.copyPages(templateDoc, [0]);
    outerDoc.addPage(newPage);

    // 1) Campos generales arriba
    drawGeneralFields(newPage, data, nombreEmpleado, folio);

    // 2) Insertamos código de barras
    const barcodeString = `${data.NOMINA} ${data.CLAVEMEDICO} ${folio} ${Number(data.FOLIO_SURTIMIENTO)}`;
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeString, {
      format: "CODE128",
      displayValue: true,
      width: 2,
      height: 40,
    });
    const barcodeImage = await outerDoc.embedPng(canvas.toDataURL("image/png"));
    newPage.drawImage(barcodeImage, { x: 275, y: 710, width: 220, height: 50 });

    // 3) Dibujamos también los campos “restantes” (departamento, sindicato, etc.)
    drawRemainingFields(newPage, data);

    return newPage;
  };

  /**
   * Función que dibuja (paginando) los medicamentos no controlados.
   * - outerDoc y templateDoc se usan para clonar páginas cuando no cabe el siguiente med.
   * - page es la página actual donde dibujamos.
   */
  const drawMedicationsTablePaginated = async ({
    outerDoc,
    templateDoc,
    page,
    medsArray,
    data,
    nombreEmpleado,
    folio,
  }) => {
    let yPos = 350;             // Posición vertical inicial de la tabla
    const lineSpacing = 10;
    const rowSpacing = 25;
    const BOTTOM_MARGIN = 100;

    // Recorremos los medicamentos
    for (const med of medsArray) {
      const medName = String(med.nombreMedicamento ?? "Desconocido");
      const indicacionesText = String(med.indicaciones ?? "Sin indicaciones");
      const tratamientoText = String(med.cantidad ?? "N/A");
      const piezasText = String(med.piezas ?? "N/A");

      // Ajusta caracteres para cada columna
      const medNameLines = wrapText(medName, 35);
      const indicacionesLines = wrapText(indicacionesText, 26);
      const tratamientoLines = wrapText(tratamientoText, 27);

      // Máximo de líneas que se pintarán
      const maxLines = Math.max(
        medNameLines.length,
        indicacionesLines.length,
        tratamientoLines.length
      );

      // Altura total que ocupará este medicamento
      const totalHeightNeeded = rowSpacing + (maxLines - 1) * lineSpacing;

      // ¿Cabe en la página actual?
      if (yPos - totalHeightNeeded < BOTTOM_MARGIN) {
        // No cabe -> creamos nueva página (que también dibuja generalFields, remainingFields y barcode)
        page = await createNewPage(outerDoc, templateDoc, data, nombreEmpleado, folio);
        yPos = 350;
      }

      // Dibuja cada línea
      for (let i = 0; i < maxLines; i++) {
        if (i < medNameLines.length) {
          page.drawText(medNameLines[i], {
            x: 40,
            y: yPos - i * lineSpacing,
            size: 8,
          });
        }

        if (i < indicacionesLines.length) {
          page.drawText(indicacionesLines[i], {
            x: 220,
            y: yPos - i * lineSpacing,
            size: 8,
          });
        }

        if (i < tratamientoLines.length) {
          page.drawText(tratamientoLines[i], {
            x: 410,
            y: yPos - i * lineSpacing,
            size: 8,
          });
        }

        // Piezas solo en la primera línea
        if (i === 0) {
          page.drawText(piezasText, {
            x: 560,
            y: yPos,
            size: 8,
          });
        }
      }

      // Bajamos Y para el siguiente medicamento
      yPos -= totalHeightNeeded;
    }

    // Devuelve la página final en que terminamos
    return page;
  };

  /**
   * Genera el PDF final, con paginación para no controlados y
   * una página por cada medicamento controlado.
   * En cada página (sea la primera o creada después), se dibujan
   * los datos de "secretaria, sindicato, nombre, edad y diagnostico"
   * desde el principio.
   */
  const generatePdf = async (data, nombreEmpleado) => {
    try {
      // 1. Cargar la plantilla base
      const response = await fetch("/Receta-Farmacia.pdf");
      const templateBytes = await response.arrayBuffer();

      // 2. Crear documento final vacío
      const outerDoc = await PDFDocument.create();

      // 3. Cargar la plantilla
      const templateDoc = await PDFDocument.load(templateBytes);

      // 4. Separar medicamentos controlados y no controlados
      const controlledMeds = data.medicamentos.filter(
        (med) => (med.clasificacion || "").trim().toUpperCase() === "C"
      );
      const nonControlledMeds = data.medicamentos.filter(
        (med) => (med.clasificacion || "").trim().toUpperCase() !== "C"
      );

      // 5. Manejo de NO controlados (paginados)
      if (nonControlledMeds.length > 0) {
        // Creamos la primera página
        // (También dibuja fields + barcode + remainingFields)
        const firstPage = await createNewPage(outerDoc, templateDoc, data, nombreEmpleado, folio);

        // Dibujamos medicamentos no controlados con paginación
        await drawMedicationsTablePaginated({
          outerDoc,
          templateDoc,
          page: firstPage,
          medsArray: nonControlledMeds,
          data,
          nombreEmpleado,
          folio,
        });
      }

      // 6. Cada med controlado en su propia página
      for (const med of controlledMeds) {
        // Creamos página para este controlado
        const controlledPage = await createNewPage(outerDoc, templateDoc, data, nombreEmpleado, folio);

        // Dibujamos solo este medicamento controlado
        await drawMedicationsTablePaginated({
          outerDoc,
          templateDoc,
          page: controlledPage,
          medsArray: [med],
          data,
          nombreEmpleado,
          folio,
        });
      }

      // 7. Guardar doc final
      return await outerDoc.save();
    } catch (err) {
      console.error("❌ Error al procesar el PDF:", err);
      throw new Error("Error al generar el PDF.");
    }
  };

  // Hook principal: buscar datos y generar el PDF
  useEffect(() => {
    if (!folio || isNaN(folio)) {
      console.error("⚠️ Folio inválido:", folio);
      setError("Folio inválido. No se puede generar el PDF.");
      setLoading(false);
      return;
    }

    //console.log("📌 Solicitando PDF para folio:", folio);
    const fetchPdf = async () => {
      try {
        // 1. Obtener la receta de la API
        const response = await fetch(`/api/SURTIMIENTOS2/getRecetaPDF?folio=${folio}`);
        if (!response.ok) throw new Error("Error al obtener la receta de la API");

        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
          throw new Error("No se encontraron datos para este folio.");
        }

        //console.log("📌 Datos recibidos de la API:", data);
        setDataReceta(data);

        // 2. (Opcional) obtener nombre del doctor
        if (data.CLAVEUSUARIO) {
          await fetchDoctorName(data.CLAVEUSUARIO);
        }

        // 3. Nombre completo del empleado
        const nombreEmpleado = await fetchNombreEmpleado(data.NOMINA);

        // 4. Generar PDF
        const pdfBytes = await generatePdf(data, nombreEmpleado);
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

        // 5. Mostrar en el iframe
        setPdfUrl(URL.createObjectURL(pdfBlob));
      } catch (err) {
        console.error("❌ Error al generar PDF:", err);
        setError("No se pudo generar la receta.");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();
  }, [folio]);

  // Render modal
  return createPortal(
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Receta Generada</h2>
        {loading ? (
          <p>Cargando PDF...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          <>
            {pdfUrl && (
              <>
                <iframe
                  src={pdfUrl}
                  width="100%"
                  height="700px"
                  title="Vista previa PDF"
                ></iframe>
                <a
                  href={pdfUrl}
                  download="Receta-Farmacia.pdf"
                  className={styles.downloadLink}
                >
                  Descargar PDF
                </a>
              </>
            )}
          </>
        )}
        <button className={styles.closeButton} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ModalPdf;
