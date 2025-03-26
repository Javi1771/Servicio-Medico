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
  // A efectos prácticos, no necesitamos leer la receta, solo setearla
  const [, setDataReceta] = useState(null);
  const [, setNombreDoctor] = useState("Dr.");

  /**
   * Función para partir un texto en varias líneas
   * según un número máximo de caracteres por línea.
   */
  function wrapText(text, maxCharsPerLine) {
    if (!text) return [];
    const regex = new RegExp(`.{1,${maxCharsPerLine}}`, "g");
    return text.match(regex) || [];
  }

  // Función para obtener el nombre del doctor desde /api/getDoctor
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

  // Función para obtener el nombre del empleado desde /api/empleado
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

  // Función para generar el PDF
  const generatePdf = async (data, nombreEmpleado) => {
    try {
      // 1. Cargar la plantilla base del PDF
      const response = await fetch("/Receta-Farmacia.pdf");
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];

      // 2. Extraemos datos esperados
      const {
        FECHA_EMISION,
        NOMINA,
        NOMBRE_PACIENTE,
        EDAD,
        DIAGNOSTICO,
        DEPARTAMENTO,
        SINDICATO,
        doctor,
        cedula,
        elaboro,
        medicamentos = [],
        FOLIO_SURTIMIENTO, // En mayúsculas, devuelto por la API
        CLAVEMEDICO,       // En mayúsculas, devuelto por la API
      } = data;

      // 3. Llenar campos generales
      page.drawText(String(FECHA_EMISION ?? "N/A"), { x: 102, y: 664, size: 10 });
      page.drawText(String(NOMINA ?? "N/A"), { x: 109, y: 645, size: 10 });

      // Dibujar el nombre del empleado obtenido
      page.drawText(String(nombreEmpleado ?? "N/A"), {
        x: 120,
        y: 627,
        size: 10,
      });

      // 4. Generar código de barras
      const barcodeString = `${NOMINA} ${CLAVEMEDICO} ${folio} ${Number(FOLIO_SURTIMIENTO)}`;
      console.log("Barcode string generado:", barcodeString);

      // Crear un canvas para JsBarcode
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, barcodeString, {
        format: "CODE128",
        displayValue: true,
        width: 2,
        height: 40,
      });
      const barcodeDataUrl = canvas.toDataURL("image/png");
      const barcodeImage = await pdfDoc.embedPng(barcodeDataUrl);

      // Dibujar el código de barras
      page.drawImage(barcodeImage, { x: 275, y: 710, width: 220, height: 50 });

      // 5. Departamento y Sindicato (en la parte superior derecha)
      const departamentoTexto = String(DEPARTAMENTO?.trim() ?? "N/A");
      const departamentoLineas = wrapText(departamentoTexto, 33);
      let yDepartamento = 664;
      departamentoLineas.forEach((line) => {
        page.drawText(line, { x: 410, y: yDepartamento, size: 10 });
        yDepartamento -= 12;
      });
      page.drawText(String(SINDICATO ?? "N/A"), { x: 410, y: 626, size: 10 });

      // 6. Datos del paciente
      page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), {
        x: 115,
        y: 571,
        size: 10,
      });
      page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), {
        x: 400,
        y: 75,
        size: 10,
      });
      page.drawText(String(EDAD ?? "N/A"), { x: 435, y: 571, size: 10 });
      page.drawText(String(DIAGNOSTICO ?? "N/A"), { x: 50, y: 510, size: 10 });

      // 7. Tabla de medicamentos
      let yPos = 350;
      const step = 25;
      medicamentos.forEach((med) => {
        // a) Nombre del medicamento, con salto de línea si es muy largo
        const medName = String(med.nombreMedicamento ?? "Desconocido");
        const medNameLines = wrapText(medName, 25); // Ajusta 25 según convenga

        medNameLines.forEach((line, i) => {
          page.drawText(line, {
            x: 60,
            y: yPos - i * 10,
            size: 10,
          });
        });

        // b) Indicaciones (se quedan en la línea principal)
        page.drawText(String(med.indicaciones ?? "Sin indicaciones"), {
          x: 230,
          y: yPos,
          size: 10,
        });

        // c) Cantidad
        page.drawText(String(med.cantidad ?? "N/A"), {
          x: 410,
          y: yPos,
          size: 10,
        });

        // d) Piezas
        page.drawText(String(med.piezas ?? "N/A"), {
          x: 550,
          y: yPos,
          size: 10,
        });

        yPos -= step;
      });

      // 8. Datos del doctor y firma
      page.drawText(`${doctor ?? "Desconocido"}`, {
        x: 71,
        y: 95,
        size: 12,
        color: rgb(0, 0, 0),
      });
      page.drawText(` ${cedula ?? "No disponible"}`, {
        x: 40,
        y: 82,
        size: 9,
        color: rgb(0, 0, 0),
      });
      page.drawText(`${elaboro ?? "Desconocido"}`, {
        x: 400,
        y: 18,
        size: 10,
        color: rgb(0, 0, 0),
      });

      // 9. Retornar los bytes del PDF ya modificado
      return await pdfDoc.save();
    } catch (err) {
      console.error("❌ Error al procesar el PDF:", err);
      throw new Error("Error al generar el PDF.");
    }
  };

  // Hook principal: Obtener los datos de la receta y generar el PDF
  useEffect(() => {
    if (!folio || isNaN(folio)) {
      console.error("⚠️ Folio inválido en ModalPdf:", folio);
      setError("Folio inválido. No se puede generar el PDF.");
      setLoading(false);
      return;
    }

    console.log("📌 Solicitando PDF para folio:", folio);
    const fetchPdf = async () => {
      try {
        const response = await fetch(`/api/SURTIMIENTOS2/getRecetaPDF?folio=${folio}`);
        if (!response.ok) throw new Error("Error al obtener la receta");

        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
          throw new Error("No se encontraron datos para este folio.");
        }

        console.log("📌 Datos recibidos de la API:", data);

        setDataReceta(data);

        if (data.CLAVEUSUARIO) {
          fetchDoctorName(data.CLAVEUSUARIO);
        }

        const nombreEmpleado = await fetchNombreEmpleado(data.NOMINA);

        const pdfBytes = await generatePdf(data, nombreEmpleado);
        const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
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

  // Renderizamos el modal usando un portal para aislarlo del árbol principal
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
0