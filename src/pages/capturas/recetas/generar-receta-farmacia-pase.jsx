/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaSpinner, FaExclamationTriangle, FaSearch, FaSync, FaTimesCircle } from "react-icons/fa";

export default function GenerarReceta() {
  const router = useRouter();
  const [claveconsulta, setClaveConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [errorReceta, setErrorReceta] = useState(null);
  const [datosFaltantes, setDatosFaltantes] = useState([]);

  useEffect(() => {
    if (router.query.claveconsulta) {
      const decodedClave = atob(router.query.claveconsulta);
      setClaveConsulta(decodedClave);
    }
  }, [router.query.claveconsulta]);

  const fetchNombreEmpleado = async (clavenomina) => {
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: clavenomina }),
      });

      const data = await response.json();

      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }

      const nombreCompleto = `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${
        data.a_materno ?? ""
      }`.trim();

      return nombreCompleto;
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  const drawMultilineText = (page, text, x, y, maxWidth, fontSize) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));

    for (let i = 0; i < words.length; i++) {
      const testLine = line + (line ? " " : "") + words[i];

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

  const verificarDatosFaltantes = (data) => {
    const camposRequeridos = [
      { campo: "claveconsulta", nombre: "Clave de consulta" },
      { campo: "fechacita", nombre: "Fecha de cita" },
      { campo: "departamento", nombre: "Departamento" },
      { campo: "nombreproveedor", nombre: "Nombre del proveedor" },
      { campo: "clavenomina", nombre: "Clave de nómina" },
      { campo: "nombrepaciente", nombre: "Nombre del paciente" },
      { campo: "edad", nombre: "Edad del paciente" },
      { campo: "cedulaproveedor", nombre: "Cédula del proveedor" },
      { campo: "fechaconsulta", nombre: "Fecha de consulta" },
      { campo: "sindicato", nombre: "Sindicato" },
      { campo: "especialidadNombre", nombre: "Especialidad" },
    ];

    const faltantes = [];

    if (!data.consulta) {
      return ["Datos completos de la consulta"];
    }

    camposRequeridos.forEach(({ campo, nombre }) => {
      if (!data.consulta[campo] && data.consulta[campo] !== 0) {
        faltantes.push(nombre);
      }
    });

    return faltantes;
  };

  const obtenerDescripcionCampo = (campo) => {
    const descripciones = {
      "Clave de consulta": "Identificador único de la consulta médica",
      "Fecha de cita": "Fecha programada para la atención médica",
      "Departamento": "Área administrativa del paciente",
      "Nombre del proveedor": "Nombre completo del médico tratante",
      "Clave de nómina": "Identificador del empleado en nómina",
      "Nombre del paciente": "Nombre completo del paciente atendido",
      "Edad del paciente": "Edad actual del paciente en años",
      "Cédula del proveedor": "Número de cédula profesional del médico",
      "Fecha de consulta": "Fecha real en que se realizó la consulta",
      "Sindicato": "Afiliación sindical del empleado",
      "Especialidad": "Especialidad médica de la consulta",
      "Datos completos de la consulta": "Información básica de la consulta médica"
    };

    return descripciones[campo] || "Campo obligatorio para generar el documento";
  };

  const fetchRecetaData = async () => {
    if (!claveconsulta) {
      console.error("⚠️ Clave de consulta no está definida.");
      return null;
    }

    const response = await fetch(
      `/api/recetas/recetaPaciente?claveconsulta=${claveconsulta}`
    );

    if (!response.ok) {
      console.error("❌ Error en la API:", await response.text());
      throw new Error("Error al obtener los datos de la receta");
    }

    const data = await response.json();

    let nombreCompleto = "No encontrado";
    let folioSurtimiento = data.folioSurtimiento ?? null;

    if (data.consulta) {
      nombreCompleto = await fetchNombreEmpleado(data.consulta.clavenomina);
    }

    return {
      ...data,
      nombreEmpleado: nombreCompleto,
      folioSurtimiento,
      faltantes: data.faltantes ?? [],
    };
  };

  const generatePdf = async (nombreEmpleado) => {
    try {
      setLoading(true);
      setErrorReceta(null);

      const data = await fetchRecetaData();
      if (!data) {
        console.error("❌ Error: No se recibieron datos de la API.");
        setErrorReceta("No se obtuvieron datos de la receta");
        return;
      }

      const faltantes = data.faltantes || verificarDatosFaltantes(data);
      if (faltantes.length > 0) {
        console.warn("⚠️ Datos faltantes detectados:", faltantes);
        setDatosFaltantes(faltantes);
        const esErrorControlMed = faltantes.includes("Datos completos de la consulta");
        setErrorReceta(esErrorControlMed
          ? "Receta incompleta de sistema anterior (ControlMed)"
          : "Faltan datos esenciales en la receta"
        );
        return;
      }

      const existingPdfBytes = await fetch("/Receta-Doctor.pdf").then((res) => {
        if (!res.ok) {
          throw new Error("Error al cargar el PDF base");
        }
        return res.arrayBuffer();
      });

      const nombreUsuario = getCookie("nombreusuario") || "N/A";

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const firstPage = pdfDoc.getPages()[0];

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
      firstPage.drawText(` Empleado: ${nombreEmpleado}`, { x: 175, y: 695, size: 9, });
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 115, y: 571, size: 10, });
      firstPage.drawText(String(data.consulta?.edad ?? "N/A"), {x: 435, y: 571, size: 10, });

      if (data.consulta?.elpacienteesempleado === "N") {
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const parentescoTexto = `- ${data.consulta?.parentescoNombre ?? "N/A"}`;
        firstPage.drawText(parentescoTexto, { x: 162, y: 601, size: 13, font: boldFont, });
      }

      firstPage.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), { x: 110, y: 96, size: 7.5, });
      firstPage.drawText(String(data.consulta?.cedulaproveedor ?? "N/A"), { x: 90, y: 87, size: 7.5, });
      firstPage.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), { x: 370, y: 87, size: 10, });
      firstPage.drawText(`${nombreUsuario}`, { x: 460, y: 35, size: 8 });
      firstPage.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), { x: 480, y: 25, size: 8, });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfBlobUrl);
    } catch (error) {
      console.error("❌ Error al generar PDF:", error);

      let mensajeError = "Error en la generación del documento";
      if (error.message.includes("consulta") || error.message === "Error al obtener los datos de la receta") {
        mensajeError = "Estructura de datos incompleta";
        setDatosFaltantes(["Datos completos de la consulta"]);
      } else if (error.message.includes("PDF base")) {
        mensajeError = "Error al cargar la plantilla del PDF";
      }
      
      setErrorReceta(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claveconsulta) {
      (async () => {
        try {
          const data = await fetchRecetaData();
          if (data) generatePdf(data.nombreEmpleado);
        } catch (error) {
          console.error("❌ Error capturado desde useEffect:", error);
          if (error.message === "Error al obtener los datos de la receta") {
            setErrorReceta("No se obtuvieron datos de la receta");
            setDatosFaltantes(["Datos completos de la consulta"]);
          } else {
            setErrorReceta("Ocurrió un error inesperado");
          }
        }
      })();
    }
  }, [claveconsulta]);

  useEffect(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      {loading && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white">
          <FaSpinner className="text-6xl animate-spin mb-4" />
          <p className="text-xl font-semibold">Guardando...</p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        {errorReceta && (
          <div className="w-full max-w-4xl mb-8 bg-gradient-to-r from-red-900 via-red-800 to-red-700 border-l-8 border-red-500 rounded-xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-start space-x-4">
              <FaExclamationTriangle className="text-yellow-400 text-4xl flex-shrink-0 mt-1 animate-pulse" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">
                  ⚠️ {errorReceta}
                </h3>
                
                <div className="mb-4 p-4 bg-red-900/40 rounded-lg border border-red-400">
                  <p className="text-red-200">
                    Esta receta requiere los siguientes datos para generarse correctamente:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-red-100">
                    <li>Datos completos de la consulta médica</li>
                    <li>Información del empleado y paciente</li>
                    <li>Datos del proveedor médico</li>
                    <li>Fecha y especialidad médica</li>
                  </ul>
                </div>

                {datosFaltantes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold text-yellow-300 mb-2 flex items-center">
                      <FaSearch className="mr-2" /> Campos específicos faltantes:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {datosFaltantes.map((dato, idx) => (
                        <div 
                          key={idx}
                          className="bg-red-800/40 p-3 rounded-lg border border-red-500 flex items-start"
                        >
                          <FaTimesCircle className="text-red-300 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <span className="font-medium">{dato}</span>
                            <div className="text-xs text-red-200 mt-1">
                              {obtenerDescripcionCampo(dato)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-black/40 rounded-md border border-gray-500">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <strong className="text-yellow-200">🛠 Solución recomendada:</strong> Complete los campos faltantes directamente en el sistema o solicite la migración completa de la receta desde ControlMed a PANDORA.
                  </p>
                  <button 
                    className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-md transition-colors"
                    onClick={() => window.location.reload()}
                  >
                    <FaSync className="inline mr-2" /> Reintentar generación
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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