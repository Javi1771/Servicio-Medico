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
  const [pdfUrl, setPdfUrl] = useState(null); 
  const [, setCodigoBarras] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (router.query.claveconsulta) {
      //* Descifrar la claveconsulta (se espera que venga en base64)
      const decodedClave = atob(router.query.claveconsulta);
      setClaveConsulta(decodedClave);
    }
  }, [router.query.claveconsulta]);

  //? ----------------- Funciones Auxiliares -----------------

  const fetchNombreEmpleado = async (clavenomina) => {
    try {
      // console.log(
      //   `📡 Consultando nombre del empleado con clavenomina: ${clavenomina}`
      // );
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: clavenomina }),
      });
      const data = await response.json();
      //console.log("👤 Datos del empleado recibidos:", data);
      if (!data || Object.keys(data).length === 0 || !data.nombre) {
        return "No encontrado";
      }
      const nombreCompleto = `${data.nombre ?? ""} ${data.a_paterno ?? ""} ${
        data.a_materno ?? ""
      }`.trim();
      //console.log("✅ Nombre completo obtenido:", nombreCompleto);
      return nombreCompleto;
    } catch (error) {
      console.error("❌ Error al obtener el nombre del empleado:", error);
      return "Error al cargar";
    }
  };

  const generarCodigoBarras = (
    clavenomina,
    claveproveedor,
    claveconsulta,
    folioSurtimiento
  ) => {
    if (
      !clavenomina ||
      !claveproveedor ||
      !claveconsulta ||
      !folioSurtimiento
    ) {
      console.error("❌ Datos insuficientes para generar código de barras");
      return;
    }
    const codigo = `${clavenomina} ${claveproveedor} ${claveconsulta} ${folioSurtimiento}`;
    //console.log("El código generado es:", codigo);
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
  //* Ahora acepta un objeto `options` con `font` y `color`.
  const drawMultilineText = (page, text, x, y, maxWidth, fontSize, options = {} ) => {
    const { font, color } = options;
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
          page.drawText(line, { x, y: currentY, size: fontSize, ...(font && { font }), ...(color && { color })});
          currentY -= lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      });

      page.drawText(line, { x, y: currentY, size: fontSize, ...(font && { font }), ...(color && { color }) });
      currentY -= lineHeight;
    });

    return currentY;
  };

  const getCookie = (name) => {
    const cookies = document.cookie.split("; ");
    const cookie = cookies.find((row) => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
  };

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
    //console.log("✅ Datos de la receta recibidos:", data);
    const medicamentoInvalido = data.receta?.some(
      (item) => item.idMedicamento === "0"
    );
    if (medicamentoInvalido) {
      console.warn(
        "⚠️ Medicamento inválido detectado (idMedicamento = 0). Cancelando generación."
      );
      setPdfUrl(null);
      setLoading(false);
      setErrorMessage(
        "⚠️ No se puede generar la receta porque no hay medicamentos asignados."
      );
      return null;
    }
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
    return {
      ...data,
      nombreEmpleado: nombreCompleto,
      folioSurtimiento,
      codigoBarrasBase64,
    };
  };

  //? ----------------- Funciones de Dibujo en el PDF -----------------

  //* Dibuja toda la información base (para la primera hoja)
  const drawBaseData = async (
    page,
    data,
    nombreEmpleado,
    nombreUsuario,
    pdfDoc,
    codigoBarrasBase64
  ) => {
    page.drawText(String(data.consulta?.fechaconsulta ?? "N/A"), {x: 104, y: 662, size: 10});
    page.drawText(String(data.consulta?.clavenomina ?? "N/A"), {x: 112, y: 643, size: 10});
    drawMultilineText(page, String(data.consulta?.departamento?.trim() ?? "N/A"), 413, 663, 170, 10);
    page.drawText(String(data.consulta?.sindicato ?? ""), {x: 408, y: 625, size: 10});
    page.drawText(`${nombreEmpleado}`, { x: 123, y: 624, size: 10 });
    page.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), {x: 118, y: 571, size: 10});
    page.drawText(String(data.consulta?.edad ?? "N/A"), {x: 435, y: 571, size: 10});

    //* Embebe las fuentes una sola vez antes de dibujar
    const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    //* Define etiqueta y valor
    const label = "Alergias: ";
    const value = data.consulta?.alergias || "Sin Alergias Registradas";

    //* Dibuja la etiqueta en negrita
    page.drawText(label, {x: 145, y: 555, size: 7, font: boldFont});

    //* Calcula el ancho de la etiqueta para desplazar el valor
    const labelWidth = boldFont.widthOfTextAtSize(label, 7);

    //* Dibuja el valor en fuente normal justo después de la etiqueta
    page.drawText(value, {x: 145 + labelWidth, y: 555, size: 7, font: regularFont});

    if (data.consulta?.elpacienteesempleado === "N") {
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const parentescoTexto = `- ${data.consulta?.parentescoNombre ?? "N/A"}`;
      page.drawText(parentescoTexto, { x: 162, y: 601, size: 13, font: boldFont, });
    }
    if (codigoBarrasBase64) {
      const barcodeImage = await pdfDoc.embedPng(codigoBarrasBase64);
      page.drawImage(barcodeImage, { x: 275, y: 727, width: 220, height: 30 });
      const infoCodigoBarras = [
        data.consulta?.clavenomina ?? "N/A",
        data.consulta?.claveproveedor ?? "N/A",
        data.consulta?.claveconsulta ?? "N/A",
        data.folioSurtimiento ?? "N/A",
      ]
        .filter((v) => v !== "N/A")
        .join(" ");
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`*${infoCodigoBarras}*`, {x: 330, y: 720, size: 8, font: helveticaBold});
    }
    drawMultilineText(page, String(data.consulta?.diagnostico ?? "N/A"), 50, 525, 560, 7);
    page.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), {x: 108, y: 96, size: 10});
    page.drawText(String(data.consulta?.cedulaproveedor ?? "N/A"), {x: 50, y: 78, size: 10});
    page.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), {x: 370, y: 78, size: 10});
    page.drawText(`${nombreUsuario}`, { x: 396, y: 22, size: 8 });
  };

  //? Dibuja solo la lista de medicamentos, recibiendo boldFont desde afuera
  const drawOnlyMedications = async (page, medsArray, startY, extraSpacing, fontSize, boldFont) => {
    let currentY = startY;
  
    for (const med of medsArray) {
      const y1 = drawMultilineText(page, String(med.nombreMedicamento ?? "No Asignado"), 40, currentY, 130, fontSize);
  
      let yResurtimiento = y1;
      if (med.seAsignoResurtimiento === 1) {
        const mensaje = `Se tiene que resurtir por ${med.cantidadMeses} mes${med.cantidadMeses > 1 ? "es" : ""}`;
        yResurtimiento = drawMultilineText(page, mensaje, 40, y1, 400, fontSize, { font: boldFont });
      }
  
      const y2 = drawMultilineText(page, String(med.indicaciones ?? "No Asignado"), 180, currentY, 200, fontSize);
      const y3 = drawMultilineText(page, String(med.cantidad ?? "No Asignado"), 422, currentY, 161, fontSize);
      const y4 = drawMultilineText(page, String(med.piezas ?? "No Asignados"), 553, currentY, 100, fontSize);
  
      const nextY = Math.min(yResurtimiento, y2, y3, y4);
      currentY = nextY - extraSpacing;
    }
  };  

  //? Dibuja el pie de página mínimo (código de barras y firmas)
  const drawMinimalFooter = async (page, data, pdfDoc) => {
    if (data.codigoBarrasBase64) {
      const barcodeImage = await pdfDoc.embedPng(data.codigoBarrasBase64);
      page.drawImage(barcodeImage, { x: 275, y: 727, width: 220, height: 30 });
      const infoCodigoBarras = [
        data.consulta?.clavenomina ?? "N/A",
        data.consulta?.claveproveedor ?? "N/A",
        data.consulta?.claveconsulta ?? "N/A",
        data.folioSurtimiento ?? "N/A",
      ]
        .filter((v) => v !== "N/A")
        .join(" ");
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`*${infoCodigoBarras}*`, {x: 330, y: 720, size: 8, font: helveticaBold});
    }
    page.drawText(String(data.consulta?.nombreproveedor ?? "N/A"), {x: 108, y: 96, size: 10});
    page.drawText(String(data.consulta?.cedulaproveedor ?? "N/A"), {x: 50, y: 78, size: 10});
    page.drawText(String(data.consulta?.nombrepaciente ?? "N/A"), {x: 370, y: 78, size: 10});
    const nombreUsuario = getCookie("nombreusuario") || "N/A";
    page.drawText(`${nombreUsuario}`, { x: 396, y: 22, size: 8 });
  };

  //? Primera hoja: solo la lista de medicamentos + footer (para otros meds)
  const addNonCMedPageFirst = async (finalDoc, baseUrl, medsArray, data, nombreEmpleado, nombreUsuario, codigoBarrasBase64) => {
    const baseBytes = await fetch(baseUrl).then((res) => {
      if (!res.ok) throw new Error(`Error al cargar PDF base ${baseUrl}`);
      return res.arrayBuffer();
    });
    const baseDoc = await PDFDocument.load(baseBytes);
    const [copiedPage] = await finalDoc.copyPages(baseDoc, [0]);

    //* Dibuja todos los datos base (paciente, diagnóstico, etc.)
    await drawBaseData(copiedPage, data, nombreEmpleado, nombreUsuario, finalDoc, codigoBarrasBase64);

    const startY = 400;
    const extraSpacing = 10;
    const fontSize = 8;
    let currentMedicationY = startY;

    //* embebemos la fuente bold una sola vez
    const helveticaBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);

    for (const med of medsArray) {
      const y1 = drawMultilineText(copiedPage, String(med.nombreMedicamento ?? "No Asignado"), 40, currentMedicationY, 130, fontSize);

      //* si seAsignoResurtimiento === 1, dibujamos mensaje en negrita justo debajo del nombre
      let yResurtimiento = y1;
      if (med.seAsignoResurtimiento === 1) {
        const mensaje = `Se tiene que resurtir por ${med.cantidadMeses} mes${med.cantidadMeses > 1 ? "es" : ""}`;
        yResurtimiento = drawMultilineText(copiedPage, mensaje, 40, y1, 400, fontSize, { font: helveticaBold });
      }

      const y2 = drawMultilineText(copiedPage, String(med.indicaciones ?? "No Asignado"), 180, currentMedicationY, 200, fontSize);
      const y3 = drawMultilineText(copiedPage, String(med.cantidad ?? "No Asignado"), 422, currentMedicationY, 161, fontSize);
      const y4 = drawMultilineText(copiedPage, String(med.piezas ?? "No Asignados"), 553, currentMedicationY, 100, fontSize);

      //* determinamos la Y mínima de los bloques y del mensaje
      let nextY = Math.min(yResurtimiento, y2, y3, y4);

      currentMedicationY = nextY - extraSpacing;
    }

    finalDoc.addPage(copiedPage);
  };

  //? Segunda hoja: solo la lista de medicamentos + footer (para otros meds)
  const addNonCMedPageSecond = async (finalDoc, baseUrl, medsArray, options
  ) => {
    const baseBytes = await fetch(baseUrl).then((res) => {
      if (!res.ok) throw new Error(`Error al cargar PDF base ${baseUrl}`);
      return res.arrayBuffer();
    });
    const baseDoc = await PDFDocument.load(baseBytes);
    const [copiedPage] = await finalDoc.copyPages(baseDoc, [0]);

    //* La posición de inicio se configura en options.startY
    const startY = options?.startY ?? 400;
    const extraSpacing = options?.extraSpacing ?? 10;
    const fontSize = options?.fontSize ?? 8;
    const boldFont = options?.boldFont; 

    //* Dibujar lista de medicamentos con resurtimiento en negrita si aplica
    await drawOnlyMedications(copiedPage, medsArray, startY, extraSpacing, fontSize, boldFont);

    //* Pie de página mínimo (código de barras y firmas)
    await drawMinimalFooter(copiedPage, await fetchRecetaData(), finalDoc);

    finalDoc.addPage(copiedPage);
  };

  //? Página individual para cada medicamento con clasificación "C"
  const addCMedPage = async (finalDoc, baseUrl, med, data, nombreEmpleado, nombreUsuario, codigoBarrasBase64) => {
    const baseBytes = await fetch(baseUrl).then((res) => {
      if (!res.ok) throw new Error(`Error al cargar PDF base ${baseUrl}`);
      return res.arrayBuffer();
    });
    const baseDoc = await PDFDocument.load(baseBytes);
    const [copiedPage] = await finalDoc.copyPages(baseDoc, [0]);

    //* Dibuja el header con datos del paciente, diagnóstico, etc.
    await drawBaseData(copiedPage, data, nombreEmpleado, nombreUsuario, finalDoc, codigoBarrasBase64);

    const startY = 400;
    const fontSize = 8;

    //* Embebemos bold para el mensaje si corresponde
    const helveticaBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);

    //* Campos del medicamento
    const y1 = drawMultilineText(copiedPage, String(med.nombreMedicamento), 40,  startY, 130, fontSize);
    const y2 = drawMultilineText(copiedPage, String(med.indicaciones),       180, startY, 200, fontSize);
    const y3 = drawMultilineText(copiedPage, String(med.cantidad),          422, startY, 161, fontSize);
    const y4 = drawMultilineText(copiedPage, String(med.piezas),            553, startY, 100, fontSize);

    //* Si debe resurtirse, dibujar mensaje justo debajo
    if (med.seAsignoResurtimiento === 1) {
      const nextY = Math.min(y1, y2, y3, y4) - 4; 
      const mensaje = `Se tiene que resurtir por ${med.cantidadMeses} mes${med.cantidadMeses > 1 ? "es" : ""}`;
      drawMultilineText(copiedPage, mensaje, 40, nextY, 400, fontSize, { font: helveticaBold } );
    }

    finalDoc.addPage(copiedPage);
  };

  //? ------------------ Lógica Principal ------------------

  const generatePdf = async () => {
    try {
      //console.log("🖨️ Iniciando la generación del PDF...");
      setLoading(true);
      const data = await fetchRecetaData();
      if (!data) {
        console.error("❌ Error: No se recibieron datos de la API.");
        return;
      }
      const medsC = data.receta.filter(
        (med) => med.clasificacion && med.clasificacion.toUpperCase() === "C"
      );
      const otherMeds = data.receta.filter(
        (med) => !med.clasificacion || med.clasificacion.toUpperCase() !== "C"
      );

      const nombreUsuario = getCookie("nombreusuario") || "N/A";
      const finalDoc = await PDFDocument.create();

      //? Para medicamentos sin clasificación "C"
      if (otherMeds.length > 0) {
        if (otherMeds.length <= 6) {
          await addNonCMedPageFirst(
            finalDoc,
            "/Receta-Farmacia.pdf",
            otherMeds,
            data,
            data.nombreEmpleado,
            nombreUsuario,
            data.codigoBarrasBase64
          );
        } else {
          const firstThree = otherMeds.slice(0, 4);
          const remaining = otherMeds.slice(4);
          await addNonCMedPageFirst(
            finalDoc,
            "/Receta-Farmacia.pdf",
            firstThree,
            data,
            data.nombreEmpleado,
            nombreUsuario,
            data.codigoBarrasBase64
          );
          //? Embebemos una sola vez la fuente bold
          const helveticaBold = await finalDoc.embedFont(StandardFonts.HelveticaBold);

          const customOptionsSecondPage = {
            startY:      640,
            extraSpacing:10,
            fontSize:    8,
            boldFont:    helveticaBold    
          };
          await addNonCMedPageSecond(
            finalDoc,
            "/Receta-Farmacia-Medicamentos.pdf",
            remaining,
            customOptionsSecondPage
          );
        }
      }

      //? Para cada medicamento con clasificación "C", página individual
      for (const med of medsC) {
        await addCMedPage(
          finalDoc,
          "/Receta-Farmacia.pdf",
          med,
          data,
          data.nombreEmpleado,
          nombreUsuario,
          data.codigoBarrasBase64
        );
      }

      const pdfBytes = await finalDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const finalUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(finalUrl);
      //console.log("✅ Final PDF generado correctamente.");
    } catch (error) {
      console.error("❌ Error al generar PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claveconsulta) {
      fetchRecetaData().then((data) => {
        if (data) {
          generatePdf();
        } else {
          console.warn("⛔ PDF no generado debido a medicamentos inválidos.");
        }
      });
    }
  }, [claveconsulta]);

  useEffect(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-center">
        <div className="bg-orange-700 text-white p-10 rounded-lg shadow-lg border border-red-600">
          <h1 className="text-3xl font-bold mb-4">
            🚨 Alerta: No se Generó la Receta 🚨
          </h1>
          <p className="text-lg">{errorMessage}</p>
        </div>
      </div>
    );
  }

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
