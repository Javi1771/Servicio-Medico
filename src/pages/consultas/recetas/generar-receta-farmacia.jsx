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
  const [errorMessage, setErrorMessage] = useState(null); //* Estado para el mensaje de error

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

    //* Función para generar código de barras con CODE128 mostrando los asteriscos
    const generarCodigoBarras = (clavenomina, claveproveedor, claveconsulta, folioSurtimiento) => {
      if (!clavenomina || !claveproveedor || !claveconsulta || !folioSurtimiento) {
          console.error("❌ Datos insuficientes para generar código de barras");
          return;
      }

      //* Convertir los asteriscos en caracteres ASCII válidos
      const codigo = `${clavenomina} ${claveproveedor} ${claveconsulta} ${folioSurtimiento}`;

      console.log('El código generado es:', codigo); //* Se verá con asteriscos en consola y al escanear

      setCodigoBarras(codigo); //* Guardar el código en el estado

      const canvas = document.createElement("canvas");

      //* Generar el código de barras con CODE128
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

  const getCookie = (name) => {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
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
  
      console.log("✅ Datos de la receta recibidos:", data);
  
      //* 🔴 VALIDACIÓN: Si hay algún medicamento con idMedicamento = 0, NO generar la receta
      const medicamentoInvalido = data.receta?.some(item => item.idMedicamento === '0');
  
      if (medicamentoInvalido) {
          console.warn("⚠️ Se detectó un medicamento inválido con idMedicamento = 0. Cancelando la generación de la receta.");
          setPdfUrl(null);
          setLoading(false);
          setErrorMessage("⚠️ No se puede generar la receta porque no hay medicamentos asignados.");
          return null;
      }
  
      let nombreCompleto = "No encontrado";  
      let folioSurtimiento = data.folioSurtimiento ?? null;
  
      let codigoBarrasBase64 = null;
      if (data.consulta) {
          nombreCompleto = await fetchNombreEmpleado(data.consulta.clavenomina);
          codigoBarrasBase64 = generarCodigoBarras(data.consulta.clavenomina, data.consulta.claveproveedor, data.consulta.claveconsulta, folioSurtimiento);
      }        
  
      return { ...data, nombreEmpleado: nombreCompleto, folioSurtimiento, codigoBarrasBase64 };
  };
  
    //* Genera el PDF con pdf-lib
    const generatePdf = async (nombreEmpleado, codigoBarrasBase64) => {
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
        const existingPdfBytes = await fetch("/Receta-Farmacia.pdf").then(res => {
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

        //* Obtener la cookie con el nombre del usuario
        const nombreUsuario = getCookie("nombreusuario") || "N/A";

        //? Bloque: DATOS DE LA CONSULTA
        firstPage.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), { x: 102, y: 664, size: 10 });
        firstPage.drawText(String(data.consulta?.clavenomina ?? "N/A"), { x: 109, y: 645, size: 10 });
        drawMultilineText(firstPage, String(data.consulta?.departamento?.trim() ?? "N/A"), 410, 665, 150, 10);
        firstPage.drawText(String(data.consulta?.sindicato ? data.consulta.sindicato : ""), { x: 408, y: 625, size: 10 });

        //* Nombre del empleado (recibido como argumento)
        firstPage.drawText(`${nombreEmpleado}`, { x: 119, y: 626, size: 10 });

        //? Bloque: DATOS DEL PACIENTE
        firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 115, y: 571, size: 10 });
        firstPage.drawText(String(data.consulta?.edad ?? "N/A"), { x: 435, y: 571, size: 10 });

        //? Línea especial: Si el paciente NO es empleado (elpacienteesempleado === "N"), se escribe el nombre con el parentesco en negrita y con un guion antes.
        if (data.consulta?.elpacienteesempleado === "N") {
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); 
          const parentescoTexto = `- ${data.consulta?.parentescoNombre ?? "N/A"}`; 
        
            firstPage.drawText(parentescoTexto, { 
              x: 162, 
              y: 601, 
              size: 13, 
              font: boldFont 
            });
          }

        //? Código de Barras con información adicional
        if (codigoBarrasBase64) {
          const barcodeImage = await pdfDoc.embedPng(codigoBarrasBase64);
          firstPage.drawImage(barcodeImage, {
              x: 275,  
              y: 727, 
              width: 220,
              height: 30, 
          });

          //? Generar información textual debajo del código de barras con asteriscos
          const infoCodigoBarras = [
              data.consulta?.clavenomina ?? "N/A",
              data.consulta?.claveproveedor ?? "N/A",
              data.consulta?.claveconsulta ?? "N/A",
              data.folioSurtimiento ?? "N/A"
          ].filter(value => value !== "N/A").join(" "); //* Elimina valores "N/A" para evitar espacios extra

          firstPage.drawText(`*${infoCodigoBarras}*`, { 
              x: 330,  
              y: 720, 
              size: 8, 
              font: await pdfDoc.embedFont(StandardFonts.HelveticaBold) 
          });
        }

        //? Bloque: DIAGNÓSTICO
        drawMultilineText(firstPage, String(data.consulta?.motivoconsulta ?? "N/A"), 50, 510, 750, 10);

        //? Bloque: TRATAMIENTO
        let recetaStartY = 357;
        const lineSpacing = 30; //* Espacio más grande entre medicamentos

        if (data.receta.length > 0) {
            data.receta.forEach((item, index) => {
            const posY = recetaStartY - index * lineSpacing; //* Aumenta el espacio entre líneas
            drawMultilineText(firstPage, String(item.nombreMedicamento ?? "No Asignado"), 40, posY, 120, 10);
            drawMultilineText(firstPage, String(item.indicaciones ?? "No Asignado"), 180, posY, 250, 10);
            drawMultilineText(firstPage, String(item.cantidad ?? "No Asignado"), 380, posY, 250, 10);
            drawMultilineText(firstPage, String(item.piezas ?? "No haAsignadoy"), 553, posY, 100, 10);
            });
        }

        //? Firmas
        firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 108, y: 96, size: 10 });
        firstPage.drawText(String(data.consulta?.cedulaproveedor ?? "N/A"), { x: 65, y: 78, size: 10 });
        firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 370, y: 78, size: 10 });

        //? Elaboró
        firstPage.drawText(`${nombreUsuario}`, { x: 396, y: 17, size: 8 });

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
          fetchRecetaData().then(data => {
              if (data) {
                  generatePdf(data.nombreEmpleado, data.codigoBarrasBase64);
              } else {
                  console.warn("⛔ PDF no generado debido a medicamentos inválidos.");
              }
          });
      }
  }, [claveconsulta]);  

  //* Abrir automáticamente el PDF en una nueva pestaña cuando esté listo
  useEffect(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

    //* Mostrar mensaje de error a pantalla completa si no hay medicamentos asignados
    if (errorMessage) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white text-center">
          <div className="bg-orange-700 text-white p-10 rounded-lg shadow-lg border border-red-600">
            <h1 className="text-3xl font-bold mb-4">🚨 Alerta: No se Generó la Receta 🚨</h1>
            <p className="text-lg">{errorMessage}</p>
          </div>
        </div>
      );
    }

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
