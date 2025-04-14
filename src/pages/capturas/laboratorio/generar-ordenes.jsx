/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { PDFDocument, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import JsBarcode from "jsbarcode";

export default function GenerarOrdenLaboratorio() {
  const router = useRouter();
  const [claveconsulta, setClaveConsulta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  //? 1. Decodificar claveconsulta de la URL
  useEffect(() => {
    if (router.query.claveconsulta) {
      const decodedClave = atob(router.query.claveconsulta);
      setClaveConsulta(decodedClave);
    }
  }, [router.query.claveconsulta]);

  //? 2. Generar código de barras
  const generarCodigoBarras = (nomina, claveconsulta, folioOrden) => {
    if (!nomina || !claveconsulta || !folioOrden) {
      console.error("❌ Datos insuficientes para generar código de barras");
      return null;
    }
    const codigo = `${nomina}-${claveconsulta}-${folioOrden}`;
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

  //? 3. Llamar a la API real para obtener datos
  const fetchConsultaData = async () => {
    if (!claveconsulta) {
      console.error("⚠️ Clave de consulta no definida");
      return null;
    }
    try {
      console.log("📡 Consultando API con claveconsulta:", claveconsulta);
      const response = await fetch(
        `/api/laboratorio/estudioLaboratorio?claveconsulta=${claveconsulta}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error en la API:", errorText);
        throw new Error("Error al obtener los datos de la consulta");
      }
      const data = await response.json();
      console.log("✅ Datos de consulta recibidos:", data);
      return data;
    } catch (error) {
      console.error("❌ Error al obtener datos de consulta:", error);
      return null;
    }
  };

  /*
   * Agrega una nueva página al PDF final copiando la página base y dibujando la
   * información del laboratorio sobre ella. Se conserva el tamaño original del PDF base.
   */
  async function agregarPaginaEscalada(
    nuevoPdfDoc,
    basePdfDoc,
    consulta,
    lab,
    index,
    claveconsulta
  ) {
    const [copiedPage] = await nuevoPdfDoc.copyPages(basePdfDoc, [0]);
    nuevoPdfDoc.addPage(copiedPage);

    const { width, height } = copiedPage.getSize();
    console.log(`Página copiada: ${width} x ${height}`);

    const blackColor = rgb(0, 0, 0);

    //? Nombre del Laboratorio
    copiedPage.drawText(`${lab.laboratorio || "N/A"}`, { x: 45, y: height - 12.8, size: 2, color: blackColor, });
    copiedPage.drawText(`${lab.laboratorio || "N/A"}`, { x: 175, y: height - 12.8, size: 2, color: blackColor, });

    //? Número de nómina
    copiedPage.drawText(`${consulta.NOMINA || "N/A"}`, { x: 80, y: height - 20.6, size: 2, color: blackColor, });
    copiedPage.drawText(`${consulta.NOMINA || "N/A"}`, { x: 206.1, y: height - 20.6, size: 2, color: blackColor, });

    //? Folio de orden
    copiedPage.drawText(`${consulta.FOLIO_ORDEN_LABORATORIO || "N/A"}`, { x: 83, y: height - 24.2, size: 2, color: blackColor, });
    copiedPage.drawText(`${consulta.FOLIO_ORDEN_LABORATORIO || "N/A"}`, { x: 209.1, y: height - 24.2, size: 2, color: blackColor, });

    //? Nombre del paciente
    copiedPage.drawText(`${consulta.NOMBRE_PACIENTE || "N/A"}`, { x: 25, y: height - 37.9, size: 2, color: blackColor, });
    copiedPage.drawText(`${consulta.NOMBRE_PACIENTE || "N/A"}`, { x: 151, y: height - 37.9, size: 2, color: blackColor, });

    //? Edad del paciente
    copiedPage.drawText(`${consulta.EDAD || "N/A"}`, { x: 87.5, y: height - 37.9, size: 2, color: blackColor, });
    copiedPage.drawText(`${consulta.EDAD || "N/A"}`, { x: 213.5, y: height - 37.9, size: 2, color: blackColor, });

    //? Secretaria
    copiedPage.drawText(`${consulta.DEPARTAMENTO || "N/A"}`, { x: 26, y: height - 27.8, size: 2, color: blackColor, });
    copiedPage.drawText(`${consulta.DEPARTAMENTO || "N/A"}`, { x: 152, y: height - 27.8, size: 2, color: blackColor, });

    //? Parentesco
    copiedPage.drawText(`- ${consulta.parentesco || "Empleado"}`, { x: 34, y: height - 32.1, size: 2.5, color: blackColor, });
    copiedPage.drawText(`- ${consulta.parentesco || "Empleado"}`, { x: 160, y: height - 32.1, size: 2.5, color: blackColor, });

    //? Fecha de elaboración
    copiedPage.drawText(`${lab.FECHA_EMISION || "N/A"}`, { x: 35, y: height - 20.6, size: 2, color: blackColor, });
    copiedPage.drawText(`${lab.FECHA_EMISION || "N/A"}`, { x: 161.5, y: height - 20.6, size: 2, color: blackColor, });

    //? Fecha de cita
    copiedPage.drawText(`${lab.FECHA_CITA || "N/A"}`, { x: 29, y: height - 24.2, size: 2, color: blackColor, });
    copiedPage.drawText(`${lab.FECHA_CITA || "N/A"}`, { x: 155.5, y: height - 24.2, size: 2, color: blackColor, });

    //? Diagnóstico
    copiedPage.drawText(`${lab.DIAGNOSTICO || "N/A"}`, { x: 13, y: height - 49, size: 2, color: blackColor, });
    copiedPage.drawText(`${lab.DIAGNOSTICO || "N/A"}`, { x: 139, y: height - 49, size: 2, color: blackColor, });

    //? Lista de estudios
    let currentY = height - 56;
    currentY -= 10;
    if (lab.estudios && lab.estudios.length > 0) {
      lab.estudios.forEach((est) => {

        copiedPage.drawText(`${est.estudio}`, { x: 13, y: currentY, size: 2, color: blackColor, });
        copiedPage.drawText(`${est.estudio}`, { x: 139, y: currentY, size: 2, color: blackColor, });
        currentY -= 3;
      });
    } else {
      copiedPage.drawText("No hay estudios asignados", { x: 13, y: currentY, size: 2, color: blackColor, });
    }

    //? Firma del médico
    copiedPage.drawText(`${lab.medico || "N/A"}`, { x: 50, y: height - 123, size: 2, color: blackColor, });
    copiedPage.drawText(`${lab.medico || "N/A"}`, { x: 175, y: height - 123, size: 2, color: blackColor, });

    //? Quien elaboró
    copiedPage.drawText(`${consulta.nombreelaborador || "N/A"}`, { x: 98, y: height - 132, size: 1.5, color: blackColor, });
    copiedPage.drawText(`${consulta.nombreelaborador || "N/A"}`, { x: 228, y: height - 132, size: 1.5, color: blackColor, });
  }

  //? 4. Generar un único PDF con una página por laboratorio
  const generateAllPdfs = async () => {
    try {
      setLoading(true);
      const data = await fetchConsultaData();
      if (!data) {
        setErrorMessage("No se recibieron datos.");
        setLoading(false);
        return;
      }
      const consulta = data.consulta;
      if (!consulta) {
        setErrorMessage("No existe la propiedad 'consulta' en la respuesta.");
        setLoading(false);
        return;
      }
      if (!consulta.laboratorios || consulta.laboratorios.length === 0) {
        setErrorMessage("No hay laboratorios para generar PDFs.");
        setLoading(false);
        return;
      }

      console.log("📥 Cargando PDF base...");
      const basePdfArrayBuffer = await fetch("/Laboratorio.pdf").then((res) => {
        if (!res.ok) throw new Error("Error al cargar PDF base");
        return res.arrayBuffer();
      });
      console.log("✅ PDF base cargado.");
      const basePdfDoc = await PDFDocument.load(basePdfArrayBuffer);

      const nuevoPdfDoc = await PDFDocument.create();

      for (let i = 0; i < consulta.laboratorios.length; i++) {
        const lab = consulta.laboratorios[i];
        console.log(`Generando página para laboratorio #${i + 1}...`);
        await agregarPaginaEscalada(
          nuevoPdfDoc,
          basePdfDoc,
          consulta,
          lab,
          i,
          claveconsulta
        );
      }

      const pdfBytes = await nuevoPdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);

      setPdfUrl(pdfBlobUrl);
      console.log("✅ PDF con múltiples páginas generado correctamente.");
    } catch (err) {
      console.error("❌ Error al generar PDFs:", err);
      setErrorMessage("Error al generar PDFs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claveconsulta) {
      generateAllPdfs();
    }
  }, [claveconsulta]);

  return (
    <div
      className="relative min-h-screen p-8 overflow-hidden bg-gradient-to-br from-[#EAFFFE] to-[#CBFFFE]"
    >
      {/* Fondo animado similar */}
      <div className="absolute inset-0 bg-turquoise-animated -z-10"></div>

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#00A7D0]/80">
          <FaSpinner className="text-6xl animate-spin mb-4 text-[#EAFFFE]" />
          <p className="text-xl font-semibold text-[#EAFFFE]">Generando PDF...</p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        {pdfUrl && (
          <div
            className="mt-10 w-full max-w-4xl bg-[#EAFFFE]/90 backdrop-blur-sm p-6 rounded-3xl border border-[#9BFFFF] shadow-2xl animate-fadeIn"
          >
            <h2 className="text-center text-3xl font-bold text-[#00576A] mb-4 uppercase">
              Vista Previa del PDF
            </h2>
            <div
              className="border border-[#5BFCFF] rounded-xl overflow-hidden shadow-lg"
              style={{ boxShadow: "0px 4px 10px rgba(0, 150, 255, 0.3)" }}
            >
              <iframe
                src={pdfUrl}
                className="w-full h-[90vh] rounded-lg border-none"
                style={{
                  overflow: "auto",
                  backgroundColor: "transparent",
                }}
                scrolling="auto"
              />
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() =>
                  pdfUrl && saveAs(pdfUrl, "OrdenLaboratorios.pdf")
                }
                className="px-6 py-3 bg-[#00CEFF] hover:bg-[#0093D0] text-[#00384B] font-bold rounded-xl shadow-lg transition transform hover:scale-105"
              >
                ⬇️ Descargar PDF
              </button>
            </div>
          </div>
        )}
        {errorMessage && (
          <p className="mt-4 text-red-500 font-bold">{errorMessage}</p>
        )}
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 1.2s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .bg-turquoise-animated {
          background: linear-gradient(
            135deg,
            #eafffe,
            #cbfffe,
            #9bffff,
            #5bfcff,
            #00e6ff
          );
          background-size: 800% 800%;
          animation: swirlGradient 14s ease-in-out infinite;
        }
        @keyframes swirlGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
