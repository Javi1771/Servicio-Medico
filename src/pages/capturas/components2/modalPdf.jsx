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
  // No necesitamos leer la receta, solo guardarla en un state si quieres.
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

  // Ejemplo para obtener el nombre del doctor si te hace falta
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
      console.log(`📡 Consultando nombre del empleado con num_nom: ${num_nom}`);
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom }),
      });
      const data = await response.json();
      console.log("👤 Datos del empleado recibidos:", data);
      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }
      const nombreCompleto = `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${data.a_materno ?? ""}`.trim();
      console.log("✅ Nombre completo obtenido:", nombreCompleto);
      return nombreCompleto;
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  /**
   * Dibuja campos generales en la página (fecha, nómina, empleado).
   */
  const drawGeneralFields = (page, data, nombreEmpleado, folio) => {
    page.drawText(String(data.FECHA_EMISION ?? "N/A"), { x: 102, y: 664, size: 10 });
    page.drawText(String(data.NOMINA ?? "N/A"), { x: 109, y: 645, size: 10 });
    page.drawText(String(nombreEmpleado ?? "N/A"), { x: 120, y: 627, size: 10 });

    // Solo para logging, el barcode real lo dibujamos en generatePdf.
    const barcodeString = `${data.NOMINA} ${data.CLAVEMEDICO} ${folio} ${Number(data.FOLIO_SURTIMIENTO)}`;
    console.log("Barcode string (para esta página):", barcodeString);
  };

  /**
   * Dibuja la "tabla" de medicamentos (nombre, indicaciones, etc.).
   */
  const drawMedicationsTable = (page, medsArray) => {
    let yPos = 350;
    const step = 25;
    medsArray.forEach((med) => {
      // Nombre (con wrap)
      const medName = String(med.nombreMedicamento ?? "Desconocido");
      const medNameLines = wrapText(medName, 25);
      medNameLines.forEach((line, i) => {
        page.drawText(line, {
          x: 60,
          y: yPos - i * 10,
          size: 10,
        });
      });
      // Indicaciones, cantidad y piezas
      page.drawText(String(med.indicaciones ?? "Sin indicaciones"), {
        x: 230,
        y: yPos,
        size: 10,
      });
      page.drawText(String(med.cantidad ?? "N/A"), {
        x: 410,
        y: yPos,
        size: 10,
      });
      page.drawText(String(med.piezas ?? "N/A"), {
        x: 550,
        y: yPos,
        size: 10,
      });
      yPos -= step;
    });
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
    page.drawText(String(data.SINDICATO ?? "N/A"), { x: 410, y: 626, size: 10 });

    // Paciente
    page.drawText(String(data.NOMBRE_PACIENTE ?? "N/A"), { x: 115, y: 571, size: 10 });
    page.drawText(String(data.NOMBRE_PACIENTE ?? "N/A"), { x: 400, y: 75, size: 10 });
    page.drawText(String(data.EDAD ?? "N/A"), { x: 435, y: 571, size: 10 });
    page.drawText(String(data.DIAGNOSTICO ?? "N/A"), { x: 50, y: 510, size: 10 });

    // Firma del doctor y nombre de quien elaboró
    page.drawText(`${data.doctor ?? "Desconocido"}`, { x: 71, y: 95, size: 12, color: rgb(0, 0, 0) });
    page.drawText(` ${data.cedula ?? "No disponible"}`, { x: 40, y: 82, size: 9, color: rgb(0, 0, 0) });
    page.drawText(`${data.elaboro ?? "Desconocido"}`, { x: 400, y: 18, size: 10, color: rgb(0, 0, 0) });
  };

  /**
   * Genera el PDF, separando controlados (C) de no controlados.
   * - Todos los no controlados en la primera página.
   * - Para cada controlado, una página individual.
   */
/**
 * Genera el PDF separando los no controlados en 1 sola hoja
 * y cada controlado en hojas aparte, SIN sobreescribir la base.
 */
const generatePdf = async (data, nombreEmpleado) => {
  try {
    // 1. Cargamos la plantilla base
    const response = await fetch("/Receta-Farmacia.pdf");
    const templateBytes = await response.arrayBuffer();

    // 2. Creamos el documento final vacío
    const outerDoc = await PDFDocument.create();

    // 3. Cargamos la plantilla en un doc aparte
    const templateDoc = await PDFDocument.load(templateBytes);
    // Obtenemos la “página base” (índice 0)
    const [templatePage] = templateDoc.getPages();

    // 4. Separamos los medicamentos
    const controlledMeds = data.medicamentos.filter((med) =>
      (med.clasificacion || "").trim().toUpperCase() === "C"
    );
    const nonControlledMeds = data.medicamentos.filter((med) =>
      (med.clasificacion || "").trim().toUpperCase() !== "C"
    );

    // 5. Si hay no controlados, clonamos la página base en outerDoc
    if (nonControlledMeds.length > 0) {
      const [outerPage] = await outerDoc.copyPages(templateDoc, [0]); 
      // Dibujamos su contenido en la página clonada
      drawGeneralFields(outerPage, data, nombreEmpleado, folio);

      // Insertar código de barras
      {
        const barcodeString = `${data.NOMINA} ${data.CLAVEMEDICO} ${folio} ${Number(
          data.FOLIO_SURTIMIENTO
        )}`;
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, barcodeString, {
          format: "CODE128",
          displayValue: true,
          width: 2,
          height: 40,
        });
        const barcodeDataUrl = canvas.toDataURL("image/png");
        const barcodeImage = await outerDoc.embedPng(barcodeDataUrl);
        outerPage.drawImage(barcodeImage, { x: 275, y: 710, width: 220, height: 50 });
      }

      drawMedicationsTable(outerPage, nonControlledMeds);
      drawRemainingFields(outerPage, data);

      // Agregamos la página resultante al doc final
      outerDoc.addPage(outerPage);
    }

    // 6. Para cada med controlado, clonamos de nuevo la página base “limpia”
    for (let med of controlledMeds) {
      const [outerPageControlled] = await outerDoc.copyPages(templateDoc, [0]);
      drawGeneralFields(outerPageControlled, data, nombreEmpleado, folio);

      // Código de barras
      {
        const barcodeString = `${data.NOMINA} ${data.CLAVEMEDICO} ${folio} ${Number(
          data.FOLIO_SURTIMIENTO
        )}`;
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, barcodeString, {
          format: "CODE128",
          displayValue: true,
          width: 2,
          height: 40,
        });
        const barcodeDataUrl = canvas.toDataURL("image/png");
        const barcodeImage = await outerDoc.embedPng(barcodeDataUrl);
        outerPageControlled.drawImage(barcodeImage, { x: 275, y: 710, width: 220, height: 50 });
      }

      // Dibuja solo este medicamento
      drawMedicationsTable(outerPageControlled, [med]);
      drawRemainingFields(outerPageControlled, data);

      // Agregamos la página al doc final
      outerDoc.addPage(outerPageControlled);
    }

    // 7. Retornamos los bytes del doc final
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

    console.log("📌 Solicitando PDF para folio:", folio);
    const fetchPdf = async () => {
      try {
        // 1. Llamar a la API que obtiene la receta
        const response = await fetch(`/api/SURTIMIENTOS2/getRecetaPDF?folio=${folio}`);
        if (!response.ok) throw new Error("Error al obtener la receta de la API");

        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
          throw new Error("No se encontraron datos para este folio.");
        }

        console.log("📌 Datos recibidos de la API:", data);
        setDataReceta(data);

        // 2. Si quieres, obtener el nombre del doctor:
        if (data.CLAVEUSUARIO) {
          await fetchDoctorName(data.CLAVEUSUARIO);
        }

        // 3. Obtener el nombre del empleado
        const nombreEmpleado = await fetchNombreEmpleado(data.NOMINA);

        // 4. Generar PDF con la función
        const pdfBytes = await generatePdf(data, nombreEmpleado);
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

        // 5. Crear un ObjectURL para mostrarlo en el iframe
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
