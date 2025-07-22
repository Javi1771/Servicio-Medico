/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaSpinner, FaExclamationTriangle } from "react-icons/fa";

export default function GenerarReceta() {
  const router = useRouter();
  const [claveconsulta, setClaveConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [, setDatosFaltantes] = useState([]);
  const [errorGeneracion, setErrorGeneracion] = useState(false);

  useEffect(() => {
    if (router.query.claveconsulta) {
      const decodedClave = atob(router.query.claveconsulta);
      setClaveConsulta(decodedClave);
    }
  }, [router.query.claveconsulta]);

  // Función mejorada para validar datos requeridos
  const validarDatosReceta = (data) => {
    // Primero verificar si existe data.consulta
    if (!data || !data.consulta) {
      return ["No se encontraron datos de consulta"];
    }

    const camposRequeridos = [
      { nombre: "Clave de consulta", valor: data.consulta.claveconsulta },
      { nombre: "Fecha de cita", valor: data.consulta.fechacita },
      { nombre: "Departamento", valor: data.consulta.departamento },
      { nombre: "Nombre del proveedor", valor: data.consulta.nombreproveedor },
      { nombre: "Clave nómina", valor: data.consulta.clavenomina },
      { nombre: "Nombre del paciente", valor: data.consulta.nombrepaciente },
      { nombre: "Edad del paciente", valor: data.consulta.edad },
      { nombre: "Cédula del proveedor", valor: data.consulta.cedulaproveedor },
      { nombre: "Fecha de consulta", valor: data.consulta.fechaconsulta }
    ];

    const faltantes = camposRequeridos
      .filter(campo => {
        const valor = campo.valor;
        
        // Validación más robusta
        if (valor === null || valor === undefined) return true;
        if (typeof valor === 'string') {
          const valorLimpio = valor.trim();
          return valorLimpio === '' || valorLimpio === 'N/A' || valorLimpio === 'null' || valorLimpio === 'undefined';
        }
        if (typeof valor === 'number') {
          return isNaN(valor);
        }
        
        return !valor;
      })
      .map(campo => campo.nombre);

    console.log("Campos evaluados:", camposRequeridos.map(c => ({nombre: c.nombre, valor: c.valor})));
    console.log("Campos faltantes:", faltantes);

    return faltantes;
  };

  const fetchNombreEmpleado = async (clavenomina) => {
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: clavenomina }),
      });

      const data = await response.json();
      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }

      return `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${data.a_materno ?? ""}`.trim();
    } catch (error) {
      console.error("Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  const drawMultilineText = (page, text, x, y, maxWidth, fontSize) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? ' ' : '') + words[i];

      if (testLine.length > maxCharsPerLine) {
        page.drawText(line, { x, y: currentY, size: fontSize });
        line = words[i];
        currentY -= 12;
      } else {
        line = testLine;
      }
    }

    page.drawText(line, { x, y: currentY, size: fontSize });
  };

  const getCookie = (name) => {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
  };

  const fetchRecetaData = async () => {
    if (!claveconsulta) return null;

    try {
      const response = await fetch(`/api/recetas/recetaPaciente?claveconsulta=${claveconsulta}`);
      if (!response.ok) throw new Error("Error al obtener datos de la receta");
      
      const data = await response.json();
      let nombreCompleto = "No encontrado";

      if (data.consulta) {
        nombreCompleto = await fetchNombreEmpleado(data.consulta.clavenomina);
      }

      return { 
        ...data, 
        nombreEmpleado: nombreCompleto,
        folioSurtimiento: data.folioSurtimiento ?? null
      };
    } catch (error) {
      console.error("Error al obtener datos de la receta:", error);
      return null;
    }
  };

  // Función generatePdf mejorada con mejor debugging
  const generatePdf = async () => {
    try {
      console.log("=== INICIANDO GENERACIÓN DE PDF ===");
      setLoading(true);
      setErrorGeneracion(false);
      setDatosFaltantes([]); // Limpiar datos faltantes anteriores
      
      const data = await fetchRecetaData();
      
      console.log("=== DEBUG: Datos completos recibidos ===");
      console.log(JSON.stringify(data, null, 2));
      
      if (!data) {
        throw new Error("No se recibieron datos de la receta");
      }

      // Validar datos faltantes con debugging mejorado
      const faltantes = validarDatosReceta(data);
      
      console.log("=== DEBUG: Validación completada ===");
      console.log("Cantidad de datos faltantes:", faltantes.length);
      console.log("Datos faltantes:", faltantes);
      
      if (faltantes.length > 0) {
        console.log("=== ERROR: Datos insuficientes ===");
        setDatosFaltantes(faltantes);
        setErrorGeneracion(true);
        setLoading(false);
        return;
      }

      console.log("=== SUCCESS: Todos los datos están presentes ===");
      
      // Continuar con la generación del PDF...
      const existingPdfBytes = await fetch("/Receta-Doctor.pdf").then(res => {
        if (!res.ok) throw new Error("Error al cargar el PDF base");
        return res.arrayBuffer();
      });

      const nombreUsuario = getCookie("nombreusuario") || "N/A";
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];

      //? Bloque: DATOS DE LA CONSULTA
      firstPage.drawText(data.consulta?.especialidadinterconsulta === null ? "General" : `Especialidad - ${data.consulta?.especialidadNombre}`, { x: 110, y: 645, size: 10 });
      firstPage.drawText(String(data.consulta?.claveconsulta ?? "N/A"), { x: 177, y: 663, size: 15 });
      firstPage.drawText(String(data.consulta?.fechacita ?? "N/A"), { x: 384, y: 665, size: 10 });
      drawMultilineText(firstPage, String(data.consulta?.departamento?.trim() ?? "N/A"), 414, 625, 150, 10);
      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 120, y: 625, size: 10 });
      
      const nomina = data.consulta?.clavenomina ?? "N/A";
      const sindicato = data.consulta?.sindicato ? data.consulta.sindicato : "";
      const textoFinal = `${nomina}  ${sindicato}`;
      firstPage.drawText(textoFinal, { x: 403, y: 645, size: 10 });

      //? Nombre del empleado
      firstPage.drawText(` Empleado: ${data.nombreEmpleado}`, { x: 175, y: 695, size: 9 });

      //? Bloque: DATOS DEL PACIENTE
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 115, y: 571, size: 10 });
      firstPage.drawText(String(data.consulta?.edad ?? "N/A"), { x: 435, y: 571, size: 10 });

      //? Si el paciente NO es empleado
      if (data.consulta?.elpacienteesempleado === "N") {
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); 
        const parentescoTexto = `- ${data.consulta?.parentescoNombre ?? "N/A"}`; 
        firstPage.drawText(parentescoTexto, { x: 162, y: 601, size: 13, font: boldFont });
      }

      //? Firmas
      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 110, y: 96, size: 7.5 });
      firstPage.drawText(String(data.consulta?.cedulaproveedor ?? "N/A"), { x: 90, y: 87, size: 7.5 });
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 370, y: 87, size: 10 });

      //? Elaboró 
      firstPage.drawText(`${nombreUsuario}`, { x: 460, y: 35, size: 8 });
      firstPage.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), { x: 480, y: 25, size: 8 });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl);

      console.log("=== PDF GENERADO CON ÉXITO ===");

    } catch (error) {
      console.error("=== ERROR en generatePdf ===", error);
      setErrorGeneracion(true);
      setDatosFaltantes(["Error interno al procesar la receta"]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claveconsulta) {
      generatePdf();
    }
  }, [claveconsulta]);

  useEffect(() => {
    if (pdfUrl && !errorGeneracion) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl, errorGeneracion]);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      {loading && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">Guardando...</p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        {/* Alerta de error con datos faltantes */}
        {errorGeneracion && (
          <div className="w-full max-w-4xl bg-red-900/80 p-6 rounded-2xl border-2 border-red-500 shadow-lg shadow-red-500/50 mb-8 ">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-3xl text-red-300 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-red-200 mb-3">
                  ❌ No se pudo generar el pase
                </h2>
                
                <div className="bg-black/30 p-4 rounded-lg mb-4">
                  <p className="text-red-300 mb-3">
                    La receta proviene del sistema ControlMed y presenta inconsistencias que impiden su generación en PANDORA.
                  </p>
                </div>
                
                <div className="bg-yellow-900/40 p-4 rounded-lg border border-yellow-600">
                  <p className="text-yellow-200 font-semibold">Recomendación:</p>
                  <p className="text-yellow-100">
                    Por favor, utiliza ControlMed para recetas originadas en ese sistema y PANDORA solo para recetas creadas dentro de su propio ecosistema. Esto nos ayudará a liberar ControlMed para su posterior retiro y migración completa a PANDORA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previsualización del PDF */}
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
                onClick={() => saveAs(pdfUrl, "RecetaPase.pdf")}
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