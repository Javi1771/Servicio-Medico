/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

export default function GenerarIncapacidad() {
  const router = useRouter();
  const [claveconsulta, setClaveconsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  //* Obtener y desencriptar la claveconsulta de la URL
  useEffect(() => {
    if (router.query.claveconsulta) {
      const decodedClave = atob(router.query.claveconsulta);
      setClaveconsulta(decodedClave);
    }
  }, [router.query.claveconsulta]);

  //* Función para dibujar texto automáticamente envuelto en un ancho máximo
  const drawWrappedText = (page, text, x, y, maxWidth, fontSize, font) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    const lineHeight = fontSize + 2;
    //* Aproximación del ancho de cada carácter (puedes ajustar el factor 0.6)
    const approxCharWidth = fontSize * 0.6;
    
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (testLine.length * approxCharWidth > maxWidth) {
        //* Si al agregar la palabra se excede el ancho máximo, dibuja la línea actual
        page.drawText(line, { x, y: currentY, size: fontSize, font });
        currentY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font });
    }
  };

  //* Función para obtener los datos de incapacidad desde la API
  const fetchIncapacidadData = async () => {
    try {
      //console.log("📡 Consultando API con claveconsulta:", claveconsulta);
      const response = await fetch(
        `/api/incapacidades/obtenerImpresion?claveconsulta=${claveconsulta}`
      );
      if (!response.ok) {
        throw new Error("Error al obtener datos de incapacidades");
      }
      const data = await response.json();
      //* Suponiendo que data es un arreglo y se usa el primer registro
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("❌ Error en fetchIncapacidadData:", error);
      return null;
    }
  };

  //* Función para generar el PDF de incapacidad
  const generatePdf = async () => {
    try {
      setLoading(true);
      const data = await fetchIncapacidadData();
      if (!data) {
        console.error("❌ No se obtuvieron datos de incapacidad");
        return;
      }

      //* Cargar la plantilla base "Incapacidad.pdf" 
      const existingPdfBytes = await fetch("/Incapacidad.pdf").then((res) => {
        if (!res.ok) throw new Error("Error al cargar la plantilla base");
        return res.arrayBuffer();
      });
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const nombreUsuario = Cookies.get("nombreusuario") || "N/A";

      //* Posicionamiento de los datos en el PDF:

      //? Clave de Consulta
      firstPage.drawText(String(data.claveconsulta || "N/A"), { x: 395, y: 739, size: 10, font, });
      firstPage.drawText(String(data.claveconsulta || "N/A"), { x: 395, y: 474, size: 10, font, }); 
      firstPage.drawText(String(data.claveconsulta || "N/A"), { x: 395, y: 218, size: 10, font, });

      //? Folio de Incapacidad
      firstPage.drawText(String(data.claveincapacidad || "N/A"), { x: 378, y: 723, size: 10, font, });
      firstPage.drawText(String(data.claveincapacidad || "N/A"), { x: 378, y: 456, size: 10, font, });
      firstPage.drawText(String(data.claveincapacidad || "N/A"), { x: 378, y: 200, size: 10, font, });

      //? Nómina
      firstPage.drawText(String(data.nomina || "N/A"), { x: 390, y: 706, size: 10, font, });
      firstPage.drawText(String(data.nomina || "N/A"), { x: 390, y: 438, size: 10, font, });
      firstPage.drawText(String(data.nomina || "N/A"), { x: 390, y: 182, size: 10, font, });

      //? Nombre del paciente
      firstPage.drawText(String(data.nombrepaciente || "N/A"), { x: 90, y: 668, size: 10, font, });
      firstPage.drawText(String(data.nombrepaciente || "N/A"), { x: 94, y: 404, size: 10, font, });
      firstPage.drawText(String(data.nombrepaciente || "N/A"), { x: 94, y: 141, size: 10, font, });

      //? Departamento (se asume que data.departamento ya puede tener saltos de línea, si no, se aplica el wrap)
      firstPage.drawText(String(data.departamento || "N/A"), { x: 100, y: 652, size: 10, font, });
      firstPage.drawText(String(data.departamento || "N/A"), { x: 106, y: 386, size: 10, font, });
      firstPage.drawText(String(data.departamento || "N/A"), { x: 106, y: 125, size: 10, font, });      
      
      //? Rango de Fechas
      const rangoFechas = `Del ${data.fechainicio || "N/A"} hasta el ${ data.fechafin || "N/A" } (${data.dias} días)`;
      firstPage.drawText(rangoFechas, { x: 90, y: 598, size: 9, font, });
      firstPage.drawText(rangoFechas, { x: 96, y: 336, size: 9, font, });
      firstPage.drawText(rangoFechas, { x: 96, y: 75, size: 9, font, });
      
      //? Nombre del Proveedor (Médico)
      firstPage.drawText(String(data.nombreproveedor || "N/A"), { x: 148, y: 581, size: 10, font, });
      firstPage.drawText(String(data.nombreproveedor || "N/A"), { x: 154, y: 320, size: 10, font, });
      firstPage.drawText(String(data.nombreproveedor || "N/A"), { x: 154, y: 58, size: 10, font, });

      //? Observaciones 
      drawWrappedText(firstPage, String(data.observaciones || "N/A"), 106, 565, 320, 8, font);
      drawWrappedText(firstPage, String(data.observaciones || "N/A"), 112, 304, 320, 8, font);
      drawWrappedText(firstPage, String(data.observaciones || "N/A"), 112, 43, 320, 8, font);

      //? Dibujar la cookie (nombre de usuario) en el PDF
      firstPage.drawText(String(nombreUsuario), { x: 40, y: 546, size: 6, font, });
      firstPage.drawText(String(nombreUsuario), { x: 40, y: 284, size: 6, font, });
      firstPage.drawText(String(nombreUsuario), { x: 40, y: 23, size: 6, font, });

      //? Guardar el PDF y crear un Blob para la previsualización y descarga
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl);
      //console.log("✅ PDF generado correctamente");
    } catch (error) {
      console.error("❌ Error al generar el PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  //* Generar el PDF cuando la claveconsulta esté disponible
  useEffect(() => {
    if (claveconsulta) {
      generatePdf();
    }
  }, [claveconsulta]);

  //* Abrir el PDF en una nueva pestaña cuando esté listo
  useEffect(() => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  }, [pdfUrl]);

  return (
    <div className="relative min-h-screen bg-black text-white p-10">
      {loading && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">Generando PDF...</p>
        </div>
      )}
      {pdfUrl && (
        <div className="mt-10 w-full max-w-4xl bg-gray-900 p-6 rounded-2xl border-2 border-cyan-400 shadow-lg">
          <iframe
            src={pdfUrl}
            className="w-full h-[70vh] rounded-lg border-none"
            scrolling="no"
            style={{ overflow: "hidden", backgroundColor: "transparent" }}
          />
          <div className="flex justify-center mt-6">
            <button
              onClick={() => saveAs(pdfUrl, "Incapacidad.pdf")}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md transition transform hover:scale-105"
            >
              ⬇️ Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
