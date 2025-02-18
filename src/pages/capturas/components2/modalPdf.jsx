import React, { useEffect, useState } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import styles from "../../css/SURTIMIENTOS_ESTILOS/modalPdf.module.css";

const ModalPdf = ({ folio, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataReceta, setDataReceta] = useState(null);
  const [nombreDoctor, setNombreDoctor] = useState("Dr.");

  // Función para obtener el nombre del doctor (sin cambios)
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

  // Función para obtener el nombre del empleado directamente desde el cliente
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
      if (!data || !data.nombre) {
        return "No encontrado";
      }
      const nombreCompleto = `${data.nombre || ""} ${data.a_paterno || ""} ${data.a_materno || ""}`.trim();
      console.log("✅ Nombre completo obtenido:", nombreCompleto);
      return nombreCompleto;
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  // Función para obtener los datos de la receta desde el endpoint
  const fetchRecetaData = async () => {
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
      return data;
    } catch (err) {
      console.error("❌ Error al obtener receta:", err);
      setError("No se pudo generar la receta.");
      return null;
    }
  };

  // Función para generar el PDF. Ahora recibe el nombre del empleado obtenido
  const generatePdf = async (nombreEmpleado) => {
    try {
      const response = await fetch("/Receta-Farmacia.pdf");
      const existingPdfBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const page = pdfDoc.getPages()[0];

      // Se extraen los campos de la receta (sin el campo "empleado" ya que ahora usamos nombreEmpleado)
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
      } = dataReceta;

      // 📌 DATOS GENERALES
      page.drawText(String(FECHA_EMISION ?? "N/A"), { x: 102, y: 664, size: 10 });
      page.drawText(String(NOMINA ?? "N/A"), { x: 109, y: 645, size: 10 });
      // Dibujar el nombre del empleado obtenido desde el endpoint /api/empleado
      page.drawText(String(nombreEmpleado ?? "N/A"), { x: 109, y: 630, size: 10 });

      // 🔹 Dividir el texto del departamento en líneas (aproximadamente 33 caracteres por línea)
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

      // Sindicato
      page.drawText(String(SINDICATO ?? "N/A"), { x: 410, y: 626, size: 10 });
      page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), { x: 115, y: 571, size: 10 });
      page.drawText(String(NOMBRE_PACIENTE ?? "N/A"), { x: 400, y: 75, size: 10 }); // Para firma
      page.drawText(String(EDAD ?? "N/A"), { x: 435, y: 571, size: 10 });
      page.drawText(String(DIAGNOSTICO ?? "N/A"), { x: 50, y: 510, size: 10 });

      // 📌 TABLA DE MEDICAMENTOS
      let yPos = 350;
      const step = 25;
      medicamentos.forEach((med) => {
        page.drawText(String(med.nombreMedicamento ?? "Desconocido"), { x: 60, y: yPos, size: 10 });
        page.drawText(String(med.indicaciones ?? "Sin indicaciones"), { x: 230, y: yPos, size: 10 });
        page.drawText(String(med.cantidad), { x: 410, y: yPos, size: 10 });
        page.drawText(String(med.piezas), { x: 550, y: yPos, size: 10 });
        yPos -= step;
      });

      // 📌 Datos del doctor y firma
      page.drawText(`Dr. ${doctor ?? "Desconocido"}`, { x: 71, y: 95, size: 12, color: rgb(0, 0, 0) });
      page.drawText(` ${cedula ?? "No disponible"}`, { x: 71, y: 80, size: 10, color: rgb(0, 0, 0) });
      page.drawText(`${elaboro ?? "Desconocido"}`, { x: 400, y: 18, size: 10, color: rgb(0, 0, 0) });

      return await pdfDoc.save();
    } catch (err) {
      console.error("❌ Error al procesar el PDF:", err);
      throw new Error("Error al generar el PDF.");
    }
  };

  // Al iniciar, se obtiene la receta y luego se obtiene el nombre del empleado para generar el PDF
  useEffect(() => {
    if (!folio || isNaN(folio)) {
      console.error("⚠️ Folio inválido en ModalPdf:", folio);
      setError("Folio inválido. No se puede generar el PDF.");
      setLoading(false);
      return;
    }

    const preparePdf = async () => {
      try {
        const recetaData = await fetchRecetaData();
        if (!recetaData) return;
        // Usamos el campo NOMINA para obtener el nombre del empleado
        const nombreEmpleado = await fetchNombreEmpleado(recetaData.NOMINA);
        await generatePdf(nombreEmpleado);
      } catch (err) {
        console.error("❌ Error al preparar PDF:", err);
        setError("No se pudo generar la receta.");
      } finally {
        setLoading(false);
      }
    };

    preparePdf();
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
