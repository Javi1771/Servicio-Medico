import React, { useEffect, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import styles from "../../css/SURTIMIENTOS_ESTILOS/modalPdf.module.css";

const ModalPdf = ({ folio, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const pdfBytes = await generatePdf(data);
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

  const generatePdf = async (data) => {
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
        FECHA_DESPACHO,
        SINDICATO,
      } = data;

      page.drawText(String(FECHA_EMISION ?? "N/A FECHA DE EMISION"), { x: 102, y: 664, size: 10 }); 
    page.drawText(String(NOMINA ?? "N/A NOMIA"), { x: 109, y: 645, size: 10 }); 
    page.drawText(String(DEPARTAMENTO?.trim() ?? "N/A DE DEPART"), { x: 317, y: 645, size: 10 }); 
    page.drawText(String(SINDICATO ? SINDICATO : ""), { x: 315, y: 664, size: 10 }); 
    page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), { x: 115, y: 571, size: 10 }); 
    page.drawText(String(EDAD ?? "N/A DE EDAD"), { x: 435, y: 571, size: 10 }); 
    page.drawText(String(NOMBRE_PACIENTE ?? "N/A DE DIAGNOSTICO"), { x: 119, y: 626, size: 10 }); 
    page.drawText(String(DIAGNOSTICO ?? "N/A DE DIAGNOSTICO"), { x:50, y: 510, size: 10 }); 


      return await pdfDoc.save();
    } catch (err) {
      console.error("❌ Error al procesar el PDF:", err);
      throw new Error("Error al generar el PDF.");
    }
  };

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
            {pdfUrl && <iframe src={pdfUrl} width="100%" height="500px"></iframe>}
            {pdfUrl && (
              <a href={pdfUrl} download="Receta-Farmacia.pdf" className={styles.downloadLink}>
                Descargar PDF
              </a>
            )}
          </>
        )}

        <button className={styles.closeButton} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ModalPdf;
