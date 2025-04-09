/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import JsBarcode from "jsbarcode";

export default function GenerarReceta() {
  const router = useRouter();
  const [claveconsulta, setClaveConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null); //* Estado para previsualizar el PDF
  const [, setCodigoBarras] = useState("");

  useEffect(() => {
    if (router.query.claveconsulta) {
      //* Descifrar la claveconsulta
      const decodedClave = atob(router.query.claveconsulta);
      setClaveConsulta(decodedClave);
    }
  }, [router.query.claveconsulta]);

  //* Función para obtener el nombre del empleado
  const fetchNombreEmpleado = async (clavenomina) => {
    try {
      console.log(`📡 Consultando nombre del empleado con clavenomina: ${clavenomina}`);
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: clavenomina }),
      });

      const data = await response.json();
      console.log("👤 Datos del empleado recibidos:", data);

      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }

      //* Concatenar nombre completo
      const nombreCompleto = `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${data.a_materno ?? ""}`.trim();
      console.log("✅ Nombre completo obtenido:", nombreCompleto);
      return nombreCompleto;
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  //* Función para generar código de barras
  const generarCodigoBarras = (clavenomina, claveproveedor, claveconsulta, folioSurtimiento) => {
    if (!clavenomina || !claveproveedor || !claveconsulta || !folioSurtimiento) {
      console.error("❌ Datos insuficientes para generar código de barras");
      return;
    }
    const codigo = `${clavenomina}-${claveproveedor}-${claveconsulta}-${folioSurtimiento}`;
    setCodigoBarras(codigo);
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, codigo, {
      format: "CODE128",
      displayValue: false,
      width: 3,
      height: 70,
      margin: 5,
    });
    return canvas.toDataURL("image/png");
  };

  //* Función para dibujar texto multilinea que retorna la posición Y final
  const drawMultilineText = (page, text, x, y, maxWidth, fontSize) => {
    const lines = text.split('\n');
    let currentY = y;
    const lineHeight = fontSize + 2; //* Ajuste de separación
    lines.forEach(lineText => {
      const words = lineText.split(' ');
      let line = '';
      const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length > maxCharsPerLine) {
          page.drawText(line, { x, y: currentY, size: fontSize });
          currentY -= lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      });
      page.drawText(line, { x, y: currentY, size: fontSize });
      currentY -= lineHeight;
    });
    return currentY;
  };

  //* Función para obtener los datos de la receta
  const fetchRecetaData = async () => {
    if (!claveconsulta) {
      console.error("⚠️ Clave de consulta no está definida.");
      return null;
    }
    console.log("📡 Consultando API con claveconsulta:", claveconsulta);
    const response = await fetch(`/api/recetas/recetaPaciente?claveconsulta=${claveconsulta}`);
    if (!response.ok) {
      console.error("❌ Error en la API:", await response.text());
      throw new Error("Error al obtener los datos de la receta");
    }
    const data = await response.json();
    let nombreCompleto = "No encontrado";
    let folioSurtimiento = data.folioSurtimiento ?? null;
    let codigoBarrasBase64 = null;
    if (data.consulta) {
      nombreCompleto = await fetchNombreEmpleado(data.consulta.clavenomina);
      codigoBarrasBase64 = generarCodigoBarras(
        data.consulta.clavenomina,
        data.consulta.claveproveedor,
        data.consulta.claveconsulta,
        folioSurtimiento
      );
    }
    console.log("✅ Datos de la receta recibidos:", data);
    console.log("✅ Folio surtimiento obtenido:", folioSurtimiento);
    return { ...data, nombreEmpleado: nombreCompleto, folioSurtimiento, codigoBarrasBase64 };
  };

  //* Genera el PDF con pdf-lib
  const generatePdf = async () => {
    try {
      console.log("🖨️ Iniciando la generación del PDF...");
      setLoading(true);
      const data = await fetchRecetaData();
      if (!data) {
        console.error("❌ Error: No se recibieron datos de la API.");
        return;
      }
      console.log("📥 Cargando el PDF base...");
      const existingPdfBytes = await fetch("/Receta-Paciente.pdf").then(res => {
        if (!res.ok) throw new Error("Error al cargar el PDF base");
        return res.arrayBuffer();
      });
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];
      console.log("✅ PDF base cargado correctamente.");

      //? Bloque: DATOS DE LA CONSULTA
      firstPage.drawText(data.consulta?.especialidadinterconsulta === null ? "General" : "Especialidad", { x: 114, y: 665, size: 10 });
      firstPage.drawText(String(data.consulta?.claveconsulta ?? "N/A"), { x: 152, y: 645, size: 10 });
      firstPage.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), { x: 102, y: 625, size: 10 });
      firstPage.drawText(String(data.consulta?.clavenomina ?? "N/A"), { x: 404, y: 665, size: 10 });
      drawMultilineText(firstPage, String(data.consulta?.departamento?.trim() ?? "N/A"), 410, 625, 170, 10);
      firstPage.drawText(String(data.consulta?.sindicato ? data.consulta.sindicato : ""), { x: 408, y: 645, size: 10 });

      //? Bloque: DATOS DEL PACIENTE
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 115, y: 574, size: 10 });
      firstPage.drawText(String(data.consulta?.edad ?? "N/A"), { x: 435, y: 574, size: 10 });
      firstPage.drawText(String(data.consulta?.presionarterialpaciente ?? "N/A"), { x: 37, y: 537, size: 10 });
      firstPage.drawText(String(data.consulta?.temperaturapaciente ?? "N/A"), { x: 130, y: 537, size: 10 });
      firstPage.drawText(String(data.consulta?.pulsosxminutopaciente ?? "N/A"), { x: 210, y: 537, size: 10 });
      firstPage.drawText(String(data.consulta?.respiracionpaciente ?? "N/A"), { x: 290, y: 537, size: 10 });
      firstPage.drawText(String(data.consulta?.estaturapaciente ?? "N/A"), { x: 373, y: 537, size: 10 });
      firstPage.drawText(String(data.consulta?.pesopaciente ?? "N/A"), { x: 459, y: 537, size: 10 });
      firstPage.drawText(String(data.consulta?.glucosapaciente ?? "N/A"), { x: 540, y: 537, size: 10 });

      //? Línea especial: Si el paciente NO es empleado, se muestra el parentesco en negrita
      if (data.consulta?.elpacienteesempleado === "N") {
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const parentescoTexto = `- ${data.consulta?.parentescoNombre ?? "N/A"}`;
        firstPage.drawText(parentescoTexto, { x: 162, y: 601, size: 13, font: boldFont });
      }

      //? Bloque: DIAGNÓSTICO
      drawMultilineText(firstPage, String(data.consulta?.diagnostico ?? "N/A"), 45, 493, 600, 7);

      //? Bloque: TRATAMIENTO en la primera hoja (primeros 4 medicamentos)
      let currentMedicationY = 358;
      const extraSpacing = 10;
      const medsFirstPage = data.receta.slice(0, 4);
      medsFirstPage.forEach((item) => {
        const y1 = drawMultilineText(firstPage, String(item.nombreMedicamento ?? "No Asignado"), 40, currentMedicationY, 130, 8);
        const y2 = drawMultilineText(firstPage, String(item.indicaciones ?? "No Asignado"), 180, currentMedicationY, 200, 8);
        //* Define la coordenada X en función del valor de item.cantidad
        const xCoordinate = item.cantidad === "Sin tiempo de toma estimado, sin medicamentos." ? 380 : 422;

        //* Dibuja el texto en la coordenada determinada
        const y3 = drawMultilineText(firstPage, String(item.cantidad ?? "No Asignado"), xCoordinate, currentMedicationY, 161, 8);
        const y4 = drawMultilineText(firstPage, String(item.piezas ?? "No Asignados"), 553, currentMedicationY, 100, 8);
        currentMedicationY = Math.min(y1, y2, y3, y4) - extraSpacing;
      });

      //? Bloque: OBSERVACIONES en la primera hoja
      drawMultilineText(firstPage, String(data.consulta?.motivoconsulta ?? "N/A"), 50, 180, 600, 7);

      //? Datos extra (incapacidad, especialidad y firmas) en la primera hoja
      firstPage.drawText(data.consulta?.seAsignoIncapacidad === 1 ? "Sí" : "No", { x: 150, y: 75, size: 10 });
      const incapacidad = data.incapacidades?.[0];
      firstPage.drawText(incapacidad ? incapacidad.fechaInicial : "No asignada", { x: 219, y: 83, size: 10 });
      firstPage.drawText(incapacidad ? incapacidad.fechaFinal : "No asignada", { x: 209, y: 68, size: 10 });
      const especialidadText = data.consulta?.seasignoaespecialidad === "S" 
        ? `Sí - ${data.detalleEspecialidad[0]?.nombreEspecialidad ?? "N/A"}` 
        : "No";
      firstPage.drawText(especialidadText, { x: 433, y: 75, size: 10 });
      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 110, y: 52, size: 10 });
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 370, y: 52, size: 10 });

      //* Si hay más de 4 medicamentos, se agrega una segunda hoja para mostrar el resto
      if (data.receta.length > 4) {
        const medPdfBytes = await fetch("/Receta-Paciente-Medicamentos.pdf").then(res => {
          if (!res.ok) throw new Error("Error al cargar el PDF Receta-Paciente-Medicamentos");
          return res.arrayBuffer();
        });
        const medPdfDoc = await PDFDocument.load(medPdfBytes);
        const [medPageTemplate] = await pdfDoc.copyPages(medPdfDoc, [0]);
        const secondPage = medPageTemplate;

        //? En la segunda hoja se reimprime también el bloque de OBSERVACIONES
        drawMultilineText(secondPage, String(data.consulta?.motivoconsulta ?? "N/A"), 50, 164, 600, 7);

        //? Lista de medicamentos adicionales empezando en Y=640
        let currentMedY = 640;
        const medsSecondPage = data.receta.slice(4); //* Medicamentos desde el quinto en adelante
        medsSecondPage.forEach((item) => {
          const y1 = drawMultilineText(secondPage, String(item.nombreMedicamento ?? "No Asignado"), 40, currentMedY, 130, 8);
          const y2 = drawMultilineText(secondPage, String(item.indicaciones ?? "No Asignado"), 180, currentMedY, 190, 8);
          const y3 = drawMultilineText(secondPage, String(item.cantidad ?? "No Asignado"), 422, currentMedY, 161, 8);
          const y4 = drawMultilineText(secondPage, String(item.piezas ?? "No Asignados"), 553, currentMedY, 100, 8);
          currentMedY = Math.min(y1, y2, y3, y4) - extraSpacing;
        });

        //? Se reimprimen los datos extra (incapacidad, especialidad y firmas) en las mismas coordenadas que en la primera hoja
        secondPage.drawText(data.consulta?.seAsignoIncapacidad === 1 ? "Sí" : "No", { x: 150, y: 76, size: 10 });
        secondPage.drawText(incapacidad ? incapacidad.fechaInicial : "No asignada", { x: 219, y: 82, size: 10 });
        secondPage.drawText(incapacidad ? incapacidad.fechaFinal : "No asignada", { x: 209, y: 68, size: 10 });
        secondPage.drawText(especialidadText, { x: 433, y: 76, size: 10 });
        secondPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 120, y: 51, size: 10 });
        secondPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 370, y: 51, size: 10 });

        pdfDoc.addPage(secondPage);
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl);
      console.log("✅ PDF generado y listo para previsualización.");
    } catch (error) {
      console.error("❌ Error al generar PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  //* Generar el PDF automáticamente cuando la claveconsulta esté lista
  useEffect(() => {
    if (claveconsulta) generatePdf();
  }, [claveconsulta]);

  //* Abrir el PDF en una nueva pestaña cuando esté listo
  useEffect(() => {
    if (pdfUrl) window.open(pdfUrl, "_blank");
  }, [pdfUrl]);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>
      {loading && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">Generando...</p>
        </div>
      )}
      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        {pdfUrl && (
          <div className="mt-10 w-full max-w-4xl bg-gray-900 p-6 rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 relative">
            <div className="border border-cyan-400 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/30">
              <iframe
                src={pdfUrl}
                className="w-full h-[70vh] rounded-lg border-none"
                style={{ overflow: "hidden", backgroundColor: "transparent" }}
                scrolling="no"
              />
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => saveAs(pdfUrl, "RecetaPaciente.pdf")}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-md shadow-cyan-500/50 transition transform hover:scale-105 hover:shadow-cyan-400/50"
              >
                ⬇️ Descargar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
