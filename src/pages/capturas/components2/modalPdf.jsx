import React, { useEffect, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import JsBarcode from "jsbarcode";
import styles from "../../css/SURTIMIENTOS_ESTILOS/modalPdf.module.css";

const ModalPdf = ({ folio, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataReceta, setDataReceta] = useState(null);
  const [nombreDoctor, setNombreDoctor] = useState("Dr.");

  // Función para obtener el nombre del doctor desde /api/getDoctor
  const fetchDoctorName = async (claveusuario) => {
    try {
      const response = await fetch(`/api/getDoctor?claveusuario=${claveusuario}`);
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

  // Función para generar el PDF, recibiendo además el nombre del empleado obtenido
  const generatePdf = async (data, nombreEmpleado) => {
    try {
      const response = await fetch("/Receta-Farmacia.pdf");
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];

      const {
        FECHA_EMISION,
        NOMINA,
        NOMBRE_PACIENTE,
        EDAD,
        DIAGNOSTICO,
        DEPARTAMENTO,
        SINDICATO,
        doctor,     // Nombre del doctor
        cedula,     // Cédula del doctor
        elaboro,    // Usuario que elaboró la receta
        medicamentos = [],
      } = data;

      // Datos generales
      page.drawText(String(FECHA_EMISION ?? "N/A"), { x: 102, y: 664, size: 10 });
      page.drawText(String(NOMINA ?? "N/A"), { x: 109, y: 645, size: 10 });

      // Dibujar el nombre del empleado obtenido desde el componente
      page.drawText(String(nombreEmpleado ?? "N/A"), { x: 120, y: 627, size: 10 });

      // --- Generación del código de barras ---
      // Se asume que el API retorna también el campo FOLIO_SURTIMIENTO.
      // Se forma el string concatenando NOMINA, CLAVEMEDICO, el folio (FOLIO_PASE) y (FOLIO_SURTIMIENTO + 1)
      const barcodeString = `${data.NOMINA} ${data.CLAVEMEDICO} ${folio} ${Number(data.FOLIO_SURTIMIENTO)}`;
      console.log("Barcode string generado:", barcodeString);
      // Crear un canvas y generar el código de barras usando JsBarcode
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, barcodeString, {
        format: "CODE128",
        displayValue: true,
        width: 2, // Ajusta según convenga
        height: 40,
      });
      const barcodeDataUrl = canvas.toDataURL("image/png");
      const barcodeImage = await pdfDoc.embedPng(barcodeDataUrl);
      // Dibujar el código de barras en el PDF (ajusta las coordenadas según tu plantilla)
      page.drawImage(barcodeImage, { x: 275, y: 710, width: 220, height: 50 });
      // --- Fin código de barras ---

      // Dibujar el departamento (dividiendo el texto en líneas)
      const wrapText = (text, maxCharsPerLine) => {
        return text.match(new RegExp(`.{1,${maxCharsPerLine}}`, "g")) || [text];
      };
      const departamentoTexto = String(DEPARTAMENTO?.trim() ?? "N/A");
      const departamentoLineas = wrapText(departamentoTexto, 33);
      let yDepartamento = 664;
      departamentoLineas.forEach((line) => {
        page.drawText(line, { x: 410, y: yDepartamento, size: 10 });
        yDepartamento -= 12;
      });
      page.drawText(String(SINDICATO ?? "N/A"), { x: 410, y: 626, size: 10 });

      // Datos del paciente
      page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), { x: 115, y: 571, size: 10 });
      page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), { x: 400, y: 75, size: 10 });
      page.drawText(String(EDAD ?? "N/A"), { x: 435, y: 571, size: 10 });
      page.drawText(String(DIAGNOSTICO ?? "N/A"), { x: 50, y: 510, size: 10 });

      // Tabla de medicamentos
      let yPos = 350;
      const step = 25;
      medicamentos.forEach((med) => {
        page.drawText(String(med.nombreMedicamento ?? "Desconocido"), { x: 60, y: yPos, size: 10 });
        page.drawText(String(med.indicaciones ?? "Sin indicaciones"), { x: 230, y: yPos, size: 10 });
        page.drawText(String(med.cantidad), { x: 410, y: yPos, size: 10 });
        page.drawText(String(med.piezas), { x: 550, y: yPos, size: 10 });
        yPos -= step;
      });

      // Datos del doctor y firma
      page.drawText(`Dr. ${doctor ?? "Desconocido"}`, { x: 71, y: 95, size: 12, color: rgb(0, 0, 0) });
      page.drawText(` ${cedula ?? "No disponible"}`, { x: 40, y: 82, size: 9, color: rgb(0, 0, 0) });
      page.drawText(`${elaboro ?? "Desconocido"}`, { x: 400, y: 18, size: 10, color: rgb(0, 0, 0) });

      return await pdfDoc.save();
    } catch (err) {
      console.error("❌ Error al procesar el PDF:", err);
      throw new Error("Error al generar el PDF.");
    }
  };

  // Función para obtener los datos de la receta y generar el PDF
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
        if (!data || Object.keys(data).length === 0) throw new Error("No se encontraron datos para este folio.");
        console.log("📌 Datos recibidos de la API:", data);
        setDataReceta(data);
        if (data.claveusuario) {
          fetchDoctorName(data.claveusuario);
        }
        // Obtener el nombre del empleado usando el número de nómina
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

  // Abrir el PDF en una nueva pestaña cuando esté listo
  useEffect(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Receta Generada</h2>
        {loading ? (
          <p>Cargando PDF...</p>
        ) : error ? (
          <p className={styles.errorText}>{error}</p>
        ) : (
          <>
            {dataReceta && (
              <div className={styles.infoContainer}>
                <p><strong>Nombre Paciente:</strong> {dataReceta.NOMBRE_PACIENTE}</p>
                <p><strong>Diagnóstico:</strong> {dataReceta.DIAGNOSTICO}</p>
                <p><strong>Departamento:</strong> {dataReceta.DEPARTAMENTO}</p>
                <h4>Medicamentos:</h4>
                {dataReceta.medicamentos && dataReceta.medicamentos.length > 0 ? (
                  dataReceta.medicamentos.map((med, idx) => (
                    <div key={idx} className={styles.medItem}>
                      <p>
                        <strong>Clave:</strong> {med.claveMedicamento} &nbsp;
                        <strong>Cantidad:</strong> {med.cantidad} &nbsp;
                        <strong>Indicaciones:</strong> {med.indicaciones}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No hay medicamentos.</p>
                )}
              </div>
            )}
            {pdfUrl && (
              <>
                <iframe src={pdfUrl} width="100%" height="500px" title="Vista previa PDF"></iframe>
                <a href={pdfUrl} download="Receta-Farmacia.pdf" className={styles.downloadLink}>
                  Descargar PDF
                </a>
              </>
            )}
          </>
        )}
        <button className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ModalPdf;
