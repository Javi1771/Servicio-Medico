/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaSpinner, FaExclamationTriangle, FaTimes } from "react-icons/fa";

export default function GenerarReceta() {
  const router = useRouter();
  const [claveconsulta, setClaveConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null); //* Estado para previsualizar el PDF
  const [errorReceta, setErrorReceta] = useState(null); //* Estado para manejar errores de receta
  const [datosFaltantes, setDatosFaltantes] = useState([]); //* Estado para datos faltantes

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
      //console.log(`📡 Consultando nombre del empleado con clavenomina: ${clavenomina}`);
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: clavenomina }),
      });

      const data = await response.json();
      //console.log("👤 Datos del empleado recibidos:", data);

      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }

      //* Concatenar nombre completo
      const nombreCompleto = `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${
        data.a_materno ?? ""
      }`.trim();
      //console.log("✅ Nombre completo obtenido:", nombreCompleto);

      return nombreCompleto; //* Retorna el nombre en lugar de modificar el estado
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  //* Función para dibujar texto multilinea
  const drawMultilineText = (page, text, x, y, maxWidth, fontSize) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6)); //* Estimación de cuántos caracteres caben en la línea

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? " " : "") + words[i];

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

  //* Función para verificar datos faltantes
  const verificarDatosFaltantes = (data) => {
    const faltantes = [];

    if (!data.consulta) {
      faltantes.push("Datos de la consulta");
      return faltantes;
    }

    if (!data.consulta.claveconsulta) faltantes.push("Clave de consulta");
    if (!data.consulta.fechacita) faltantes.push("Fecha de cita");
    if (!data.consulta.departamento) faltantes.push("Departamento");
    if (!data.consulta.nombreproveedor) faltantes.push("Nombre del proveedor");
    if (!data.consulta.clavenomina) faltantes.push("Clave de nómina");
    if (!data.consulta.nombrepaciente) faltantes.push("Nombre del paciente");
    if (!data.consulta.edad) faltantes.push("Edad del paciente");
    if (!data.consulta.cedulaproveedor) faltantes.push("Cédula del proveedor");
    if (!data.consulta.fechaconsulta) faltantes.push("Fecha de consulta");

    return faltantes;
  };

  //* Función para obtener los datos de la receta
  const fetchRecetaData = async () => {
    if (!claveconsulta) {
      console.error("⚠️ Clave de consulta no está definida.");
      return null;
    }

    //console.log("📡 Consultando API con claveconsulta:", claveconsulta);

    const response = await fetch(
      `/api/recetas/recetaPaciente?claveconsulta=${claveconsulta}`
    );

    if (!response.ok) {
      console.error("❌ Error en la API:", await response.text());
      throw new Error("Error al obtener los datos de la receta");
    }

    const data = await response.json();

    let nombreCompleto = "No encontrado"; //* Variable local para el nombre
    let folioSurtimiento = data.folioSurtimiento ?? null; //* Obtener el folioSurtimiento de la respuesta

    if (data.consulta) {
      nombreCompleto = await fetchNombreEmpleado(data.consulta.clavenomina);
    }

    //console.log("✅ Datos de la receta recibidos:", data);
    //console.log("✅ Folio surtimiento obtenido:", folioSurtimiento);

    return {
      ...data,
      nombreEmpleado: nombreCompleto,
      folioSurtimiento,
      faltantes: data.faltantes ?? [], //! por si no vienen
    };
  };

  //* Genera el PDF con pdf-lib
  const generatePdf = async (nombreEmpleado) => {
    try {
      //console.log("🖨️ Iniciando la generación del PDF...");
      setLoading(true);
      setErrorReceta(null); //* Limpiar errores previos

      //* Obtener la información desde el endpoint
      const data = await fetchRecetaData();
      if (!data) {
        console.error("❌ Error: No se recibieron datos de la API.");
        setErrorReceta("No se obtuvieron datos de la receta");
        return;
      }

      //* Verificar datos faltantes
      const faltantes = data.faltantes || verificarDatosFaltantes(data);
      if (faltantes.length > 0) {
        setDatosFaltantes(faltantes);
        setErrorReceta("Datos insuficientes para generar la receta");
        return;
      }

      //console.log("📥 Cargando el PDF base...");
      const existingPdfBytes = await fetch("/Receta-Doctor.pdf").then((res) => {
        if (!res.ok) {
          throw new Error("Error al cargar el PDF base");
        }
        return res.arrayBuffer();
      });

      //console.log("✅ PDF base cargado correctamente.");

      //* Obtener la cookie con el nombre del usuario
      const nombreUsuario = getCookie("nombreusuario") || "N/A";

      //? Crear el PDF a partir del PDF base
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];

      //console.log("✏️ Dibujando datos en el PDF...");

      //? Bloque: DATOS DE LA CONSULTA
      firstPage.drawText(
        data.consulta?.especialidadinterconsulta === null
          ? "General"
          : `Especialidad - ${data.consulta?.especialidadNombre}`,
        { x: 110, y: 645, size: 10 }
      );
      firstPage.drawText(String(data.consulta?.claveconsulta ?? "N/A"), { x: 177, y: 663, size: 15, });
      firstPage.drawText(String(data.consulta?.fechacita ?? "N/A"), { x: 384, y: 665, size: 10, });
      drawMultilineText( firstPage, String(data.consulta?.departamento?.trim() ?? "N/A"), 414, 625, 150, 10 );
      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 120, y: 625, size: 10, });
      const nomina = data.consulta?.clavenomina ?? "N/A";
      const sindicato = data.consulta?.sindicato ? data.consulta.sindicato : "";
      const textoFinal = `${nomina}  ${sindicato}`;

      firstPage.drawText(textoFinal, { x: 403, y: 645, size: 10 });

      //* Nombre del empleado (recibido como argumento)
      firstPage.drawText(` Empleado: ${nombreEmpleado}`, { x: 175, y: 695, size: 9, });

      //? Bloque: DATOS DEL PACIENTE
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 115, y: 571, size: 10, });
      firstPage.drawText(String(data.consulta?.edad ?? "N/A"), {x: 435, y: 571, size: 10, });

      //? Línea especial: Si el paciente NO es empleado (elpacienteesempleado === "N"), se escribe el nombre con el parentesco en negrita y con un guion antes.
      if (data.consulta?.elpacienteesempleado === "N") {
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const parentescoTexto = `- ${data.consulta?.parentescoNombre ?? "N/A"}`;

        firstPage.drawText(parentescoTexto, { x: 162, y: 601, size: 13, font: boldFont, });
      }

      //? Firmas
      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 110, y: 96, size: 7.5, });
      firstPage.drawText(String(data.consulta?.cedulaproveedor ?? "N/A"), { x: 90, y: 87, size: 7.5, });
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 370, y: 87, size: 10, });

      //? Elaboró
      firstPage.drawText(`${nombreUsuario}`, { x: 460, y: 35, size: 8 });
      firstPage.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), { x: 480, y: 25, size: 8, });

      //? Guardar el PDF en memoria y generar una URL para previsualización
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl); //* Guardar la URL del PDF para previsualización

      //console.log("✅ PDF generado y listo para previsualización.");
    } catch (error) {
      console.error("❌ Error al generar PDF:", error);

      if (error.message === "Error al obtener los datos de la receta") {
        setErrorReceta("No se obtuvieron datos de la receta");
        setDatosFaltantes(["Datos de la consulta"]); //! Para mostrar algo en el banner aunque no haya entrado a verificar
      } else {
        setErrorReceta("Error al generar el PDF");
      }
    } finally {
      setLoading(false);
    }
  };

  //* Generar el PDF automáticamente cuando la claveconsulta esté lista
  useEffect(() => {
    if (claveconsulta) {
      (async () => {
        try {
          const data = await fetchRecetaData();
          if (data) generatePdf(data.nombreEmpleado, data.codigoBarrasBase64);
        } catch (error) {
          console.error("❌ Error capturado desde useEffect:", error);
          if (error.message === "Error al obtener los datos de la receta") {
            setErrorReceta("No se obtuvieron datos de la receta");
            setDatosFaltantes(["Datos de la consulta"]);
          } else {
            setErrorReceta("Ocurrió un error inesperado");
          }
        }
      })();
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
        {/* Banner de Error */}
        {errorReceta && (
          <div className="w-full max-w-4xl mb-8 bg-gradient-to-r from-red-900 via-red-800 to-red-700 border-l-8 border-red-500 rounded-xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start space-x-4">
              <FaExclamationTriangle className="text-yellow-400 text-4xl flex-shrink-0 mt-1 animate-pulse" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">
                  ⚠️ No se pudo generar el PDF de la receta
                </h3>
                <p className="text-red-200 mb-4">
                  Esta receta proviene del sistema anterior{" "}
                  <span className="text-yellow-300 font-semibold">ControlMed</span>. Debido a diferencias en estructura de datos, faltan campos obligatorios para generar correctamente el PDF en el sistema{" "}
                  <span className="text-cyan-300 font-semibold">PANDORA</span>.
                </p>

                {datosFaltantes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold text-yellow-300 mb-2">
                      🔍 Campos faltantes detectados:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {datosFaltantes.map((dato, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 bg-red-800/30 p-2 rounded-md border border-red-400 text-red-100 hover:bg-red-700/30 transition-colors"
                          title={`Este campo es obligatorio para generar el PDF`}
                        >
                          <FaTimes className="text-red-300 text-sm" />
                          <span className="text-sm">{dato}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-black/40 rounded-md border border-gray-500 shadow-inner">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <strong className="text-yellow-200">🛠 Recomendación:</strong> Completa los campos faltantes directamente en el sistema{" "}
                    <span className="font-semibold text-cyan-300">PANDORA</span> o solicita al área correspondiente la migración de la receta desde el sistema{" "}
                    <span className="font-semibold text-yellow-300">ControlMed</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
