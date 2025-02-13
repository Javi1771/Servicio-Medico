/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument } from "pdf-lib";
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
                headers: {
                    "Content-Type": "application/json",
                },
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
            
            return nombreCompleto;  //* Retorna el nombre en lugar de modificar el estado
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

        //* Aumenta el tamaño del código de barras para mejorar la legibilidad
        JsBarcode(canvas, codigo, {
            format: "CODE128",
            displayValue: false,
            width: 3, 
            height: 70,
            margin: 5, 
        });
        
        return canvas.toDataURL("image/png");
               
    };

  //* Función para dibujar texto multilinea
  const drawMultilineText = (page, text, x, y, maxWidth, fontSize) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6)); //* Estimación de cuántos caracteres caben en la línea

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? ' ' : '') + words[i];

      if (testLine.length > maxCharsPerLine) {
        //* Si la línea es demasiado larga, dibuja la línea anterior y comienza una nueva
        page.drawText(line, { x, y: currentY, size: fontSize });
        line = words[i]; //* Comienza una nueva línea con la palabra actual
        currentY -= 12; //* Salto de línea (se puede cambiar la distancia entre líneas)
      } else {
        line = testLine;
      }
    }

    //* Dibuja la última línea
    page.drawText(line, { x, y: currentY, size: fontSize });
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

        let nombreCompleto = "No encontrado";  //* Variable local para el nombre
        let folioSurtimiento = data.folioSurtimiento ?? null; //* Obtener el folioSurtimiento de la respuesta

        let codigoBarrasBase64 = null;
        if (data.consulta) {
            nombreCompleto = await fetchNombreEmpleado(data.consulta.clavenomina);
            codigoBarrasBase64 = generarCodigoBarras(data.consulta.clavenomina, data.consulta.claveproveedor, data.consulta.claveconsulta, folioSurtimiento);
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

      //* Obtener la información desde el endpoint
      const data = await fetchRecetaData();
      if (!data) {
        console.error("❌ Error: No se recibieron datos de la API.");
        return;
      }

      console.log("📥 Cargando el PDF base...");
      const existingPdfBytes = await fetch("/Receta-Paciente.pdf").then(res => {
        if (!res.ok) {
          throw new Error("Error al cargar el PDF base");
        }
        return res.arrayBuffer();
      });

      console.log("✅ PDF base cargado correctamente.");

      //? Crear el PDF a partir del PDF base
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];

      console.log("✏️ Dibujando datos en el PDF...");

      //? Bloque: DATOS DE LA CONSULTA
      firstPage.drawText(data.consulta?.especialidadInterconsulta === null ? "General" : "Especialidad", { x: 114, y: 66, size: 10 });
      firstPage.drawText(String(data.consulta?.claveconsulta ?? "N/A"), { x: 152, y: 645, size: 10 });
      firstPage.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), { x: 102, y: 625, size: 10 });
      firstPage.drawText(String(data.consulta?.clavenomina ?? "N/A"), { x: 404, y: 665, size: 10 });
      firstPage.drawText(String(data.consulta?.departamento?.trim() ?? "N/A"), { x: 410, y: 645, size: 10 });
      firstPage.drawText(String(data.consulta?.sindicato ? data.consulta.sindicato : "No está sindicalizado"), { x: 408, y: 625, size: 10 });

      //? Bloque: DATOS DEL PACIENTE
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 115, y: 570, size: 10 });
      firstPage.drawText(String(data.consulta?.edad ?? "N/A"), { x: 435, y: 570, size: 10 });
      firstPage.drawText(String(data.consulta?.presionarterialpaciente ?? "N/A"), { x: 37, y: 525, size: 10 });
      firstPage.drawText(String(data.consulta?.temperaturapaciente ?? "N/A"), { x: 130, y: 525, size: 10 });
      firstPage.drawText(String(data.consulta?.pulsosxminutopaciente ?? "N/A"), { x: 210, y: 525, size: 10 });
      firstPage.drawText(String(data.consulta?.respiracionpaciente ?? "N/A"), { x: 290, y: 525, size: 10 });
      firstPage.drawText(String(data.consulta?.estaturapaciente ?? "N/A"), { x: 373, y: 525, size: 10 });
      firstPage.drawText(String(data.consulta?.pesopaciente ?? "N/A"), { x: 459, y: 525, size: 10 });
      firstPage.drawText(String(data.consulta?.glucosapaciente ?? "N/A"), { x: 540, y: 525, size: 10 });

      //? Bloque: DIAGNÓSTICO
      drawMultilineText(firstPage, String(data.consulta?.motivoconsulta ?? "N/A"), 50, 460, 750, 10);

      //? Bloque: TRATAMIENTO
      let recetaStartY = 357;
      const lineSpacing = 30; //* Espacio más grande entre medicamentos

      if (data.receta.length > 0) {
        data.receta.forEach((item, index) => {
          const posY = recetaStartY - index * lineSpacing; //* Aumenta el espacio entre líneas
          drawMultilineText(firstPage, String(item.nombreMedicamento ?? "No hay"), 45, posY, 250, 10);
          drawMultilineText(firstPage, String(item.indicaciones ?? "No hay"), 180, posY, 230, 10);
          drawMultilineText(firstPage, String(item.cantidad ?? "No hay"), 380, posY, 180, 10);
          drawMultilineText(firstPage, String(item.piezas ?? "No hay"), 553, posY, 100, 10);
        });
      }

      //? Bloque: OBSERVACIONES
      drawMultilineText(firstPage, String(data.consulta?.diagnostico ?? "N/A"), 50, 160, 750, 10);

      //? Bloque: EXTRAS
      const incapacidad = data.incapacidades?.[0]; //* Obtiene el primer elemento del array de incapacidades
      firstPage.drawText(data.consulta?.seAsignoIncapacidad === 1 ? "Sí" : "No", { x: 150, y: 78, size: 10 });
      firstPage.drawText(incapacidad ? incapacidad.fechaInicial : "No hay", { x: 219, y: 85, size: 10 });
      firstPage.drawText(incapacidad ? incapacidad.fechaFinal : "No hay", { x: 209, y: 72, size: 10 });
      
      const especialidadText = data.consulta?.seasignoaespecialidad === "S" ? `Sí - ${data.detalleEspecialidad[0]?.nombreEspecialidad ?? "N/A"}` : "No";
      firstPage.drawText(especialidadText, { x: 440, y: 78, size: 10 });
      
      //? Firmas
      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 120, y: 52, size: 10 });
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 410, y: 52, size: 10 });

      //? Guardar el PDF en memoria y generar una URL para previsualización
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl); //* Guardar la URL del PDF para previsualización

      console.log("✅ PDF generado y listo para previsualización.");
    } catch (error) {
      console.error("❌ Error al generar PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  //* Generar el PDF automáticamente cuando la claveconsulta esté lista
  useEffect(() => {
    if (claveconsulta) {
      generatePdf();
    }
  }, [claveconsulta]);

  //* Abrir automáticamente el PDF en una nueva pestaña cuando esté listo
  useEffect(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      {/* 🔥 FONDO ANIMADO */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      {/* Overlay Loader si loading es true */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">Guardando...</p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative z-10 w-full">

      {/* Previsualización del PDF */}
      {pdfUrl && (
        <div className="mt-10 w-full max-w-4xl bg-gray-900 p-6 rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 relative">
          
          {/* Contenedor del PDF con efecto futurista */}
          <div className="border border-cyan-400 rounded-xl overflow-hidden shadow-lg shadow-cyan-500/30">
            <iframe
              src={pdfUrl}
              className="w-full h-[70vh] rounded-lg border-none"
              style={{ overflow: "hidden", backgroundColor: "transparent" }}
              scrolling="no"
            />
          </div>

          {/* Botón de descarga con animación moderna */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => saveAs(pdfUrl, "RecetaFarmacia.pdf")}
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
