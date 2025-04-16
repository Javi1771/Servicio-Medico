/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BiArrowBack,
  BiBarcodeReader,
  BiBox,
  BiPackage,
  BiArrowFromBottom,
  BiArrowToTop,
  BiErrorCircle,
  BiCheckCircle,
  BiDownload,
} from "react-icons/bi";
import { GiMedicines } from "react-icons/gi";
import { FaRegStopCircle } from "react-icons/fa";
import { useRef } from "react";

//? ====== IMPORTAMOS PDF-LIB ======
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
//* Para descargar el archivo resultante
import { saveAs } from "file-saver";

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [fechaActualFormateada, setfechaActualFormateada] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tapAudioRef = useRef(null);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const response = await fetch("/api/farmacia/notificaciones");
        if (!response.ok) {
          throw new Error("Error al obtener notificaciones de stock.");
        }
        const data = await response.json();
        //console.log("Datos recibidos:", data);
        //* Suponemos que la respuesta contiene { medicamentos: [...], usuario: "..." }
        setNotificaciones(
          Array.isArray(data.medicamentos) ? data.medicamentos : []
        );
        setNombreUsuario(data.usuario || "Usuario no definido");
        setfechaActualFormateada(data.fecha || "Usuario no definido");
        //console.log("Usuario recibido:", data.usuario);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotificaciones();
  }, []);

  useEffect(() => {
    tapAudioRef.current = new Audio("/assets/tap.mp3");
  }, []);

  //* Funciones para filtrar por tipo de stock
  const stockMedio = useMemo(
    () =>
      Array.isArray(notificaciones)
        ? notificaciones.filter(
            (item) => item.stockStatus.toLowerCase() === "stock medio"
          )
        : [],
    [notificaciones]
  );

  const stockBajo = useMemo(
    () =>
      Array.isArray(notificaciones)
        ? notificaciones.filter(
            (item) => item.stockStatus.toLowerCase() === "stock bajo"
          )
        : [],
    [notificaciones]
  );

  const playTapSound = () => {
    if (tapAudioRef.current) {
      tapAudioRef.current.currentTime = 0;
      tapAudioRef.current
        .play()
        .catch((error) => console.warn("Audio playback error:", error));
    }
  };  

  //* Función para dibujar texto en múltiples líneas, respetando un ancho máximo.
  const drawMultilineText = (
    page,
    text,
    x,
    y,
    maxWidth,
    fontSize,
    font,
    color
  ) => {
    const lines = text.split("\n");
    let currentY = y;
    const lineHeight = fontSize + 2; //* Ajuste de separación
    //* Se estima la cantidad máxima de caracteres por línea
    const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
    lines.forEach((lineText) => {
      const words = lineText.split(" ");
      let line = "";
      words.forEach((word) => {
        const testLine = line ? line + " " + word : word;
        if (testLine.length > maxCharsPerLine) {
          page.drawText(line, { x, y: currentY, size: fontSize, font, color });
          currentY -= lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      });
      page.drawText(line, { x, y: currentY, size: fontSize, font, color });
      currentY -= lineHeight;
    });
    return currentY;
  };

  //* Función auxiliar para imprimir un ítem usando texto multilinea
  const printItem = (page, x, y, item, maxWidth) => {
    //? Bloque 1: Medicamento y EAN
    const medicamentoText = `${item.medicamento} (EAN: ${item.ean})`;
    y = drawMultilineText(
      page,
      medicamentoText,
      x,
      y,
      maxWidth,
      fontSize,
      font,
      color
    );
    y -= 1; //* Margen adicional

    //? Bloque 2: Presentación y piezas
    const presentacionText = `Presentación: ${item.presentacion} ${
      item.medida || ""
    } | Piezas: ${item.piezas}`;
    y = drawMultilineText(
      page,
      presentacionText,
      x,
      y,
      maxWidth,
      fontSize,
      font,
      color
    );
    y -= 1; //* Margen adicional

    //? Bloque 3: Mínimo y Máximo
    const minMaxText = `Mín: ${item.minimo} / Máx: ${item.maximo}`;
    y = drawMultilineText(
      page,
      minMaxText,
      x,
      y,
      maxWidth,
      fontSize,
      font,
      color
    );
    return y;
  };

  //* Función para generar el PDF con paginación (8 registros por columna)
  const handleGeneratePDF = async () => {
    try {
      //? a) Cargar la plantilla PDF base
      const templateBytes = await fetch("/Reporte-Medicamentos.pdf").then((res) => {
        if (!res.ok)
          throw new Error("No se pudo cargar Reporte-Medicamentos.pdf");
        return res.arrayBuffer();
      });
      const templateDoc = await PDFDocument.load(templateBytes);
      const [templatePage] = templateDoc.getPages();
      const { width, height } = templatePage.getSize();
  
      //? b) Crear un nuevo documento PDF final
      const pdfDoc = await PDFDocument.create();
  
      //? c) Incrustar la fuente en el nuevo documento
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 10;
      const color = rgb(0, 0, 0);
  
      //? d) Definir funciones internas que usen fontSize, font y color
      const drawMultilineText = (page, text, x, y, maxWidth) => {
        const lines = text.split("\n");
        let currentY = y;
        const lineHeight = fontSize + 2; //* Espacio entre líneas
        //* Estimación del número máximo de caracteres por línea
        const maxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
        lines.forEach((lineText) => {
          const words = lineText.split(" ");
          let line = "";
          words.forEach((word) => {
            const testLine = line ? line + " " + word : word;
            if (testLine.length > maxCharsPerLine) {
              page.drawText(line, { x, y: currentY, size: fontSize, font, color });
              currentY -= lineHeight;
              line = word;
            } else {
              line = testLine;
            }
          });
          page.drawText(line, { x, y: currentY, size: fontSize, font, color });
          currentY -= lineHeight;
        });
        return currentY;
      };
  
      const printItem = (page, x, y, item, maxWidth) => {
        let newY = y;
        //* Bloque 1: Medicamento y EAN
        const medicamentoText = `${item.medicamento} (EAN: ${item.ean})`;
        newY = drawMultilineText(page, medicamentoText, x, newY, maxWidth);
        newY -= 1; 
  
        //* Bloque 2: Presentación y piezas
        const presentacionText = `Presentación: ${item.presentacion} ${item.medida || ""} | Piezas: ${item.piezas}`;
        newY = drawMultilineText(page, presentacionText, x, newY, maxWidth);
        newY -= 1; 
  
        //* Bloque 3: Mínimo y Máximo
        const minMaxText = `Mín: ${item.minimo} / Máx: ${item.maximo}`;
        newY = drawMultilineText(page, minMaxText, x, newY, maxWidth);
        return newY;
      };
  
      //? e) Coordenadas para columnas
      const leftColumnX = 15; 
      const rightColumnX = 320; 
      const maxWidth = 280; 
  
      //? f) Calcular la cantidad de páginas necesarias (8 registros por columna)
      const pagesCount = Math.max(
        Math.ceil(stockMedio.length / 8),
        Math.ceil(stockBajo.length / 8)
      );
  
      //? g) Generar cada página copiando la plantilla y listando 8 registros por columna
      for (let p = 0; p < pagesCount; p++) {
        //* Extraer los ítems para la página actual (8 registros por columna)
        const medioItems = stockMedio.slice(p * 8, p * 8 + 8);
        const bajoItems = stockBajo.slice(p * 8, p * 8 + 8);
  
        //* Si en esta iteración no hay elementos en ninguna columna, omitir la página
        if (medioItems.length === 0 && bajoItems.length === 0) {
          continue;
        }
  
        const [copiedPage] = await pdfDoc.copyPages(templateDoc, [0]);
        const currentPage = copiedPage;
        pdfDoc.addPage(currentPage);
  
        //* Cabecera: Nombre de usuario y fecha
        currentPage.drawText(`${nombreUsuario}`, {
          x: 463,
          y: height - 758,
          size: 8,
          font,
          color,
        });
        currentPage.drawText(`${fechaActualFormateada}`, {
          x: 460,
          y: height - 767.2,
          size: 8,
          font,
          color,
        });
  
        const yStart = height - 175;
  
        //! Columna Stock Medio
        let yLeft = yStart;
        medioItems.forEach((item) => {
          yLeft = printItem(currentPage, leftColumnX, yLeft, item, maxWidth);
          yLeft -= 20; //* Espacio extra entre medicamentos
        });
  
        //! Columna Stock Bajo
        let yRight = yStart;
        bajoItems.forEach((item) => {
          yRight = printItem(currentPage, rightColumnX, yRight, item, maxWidth);
          yRight -= 20; //* Espacio extra entre medicamentos
        });
      }
  
      //? h) Guardar y descargar el PDF generado
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, "ReporteMedicamentos.pdf");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Ocurrió un error al generar el PDF.");
    }
  };    

  //* Funciones para los estilos de las tarjetas (sin cambios)
  const getStatusIcon = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo")
      return (
        <BiErrorCircle
          className="text-3xl text-red-500"
          aria-label="Stock bajo"
        />
      );
    if (lowerStatus === "stock medio")
      return (
        <FaRegStopCircle
          className="text-3xl text-orange-500"
          aria-label="Stock medio"
        />
      );
    return (
      <BiCheckCircle
        className="text-3xl text-cyan-500"
        aria-label="Stock alto"
      />
    );
  };

  const getCardStyle = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo") {
      return "bg-gradient-to-br from-black to-red-900 border-red-500 bg-opacity-50 hover:shadow-[0_0_40px_15px_rgba(255,0,0,1)]";
    } else if (lowerStatus === "stock medio") {
      return "bg-gradient-to-br from-black to-orange-900 border-orange-500 bg-opacity-50 hover:shadow-[0_0_40px_15px_rgba(255,140,0,1)]";
    }
    return "bg-gradient-to-br from-black to-cyan-900 border-cyan-500 bg-opacity-50 hover:shadow-[0_0_40px_15px_rgba(0,255,255,1)]";
  };

  const getColorByStatus = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo") return "text-red-500";
    if (lowerStatus === "stock medio") return "text-orange-500";
    return "text-white";
  };

  const getIlluminationShadow = (status) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "stock bajo")
      return "drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]";
    if (lowerStatus === "stock medio")
      return "drop-shadow-[0_0_25px_rgba(255,140,0,0.8)]";
    return "drop-shadow-[0_0_25px_rgba(0,255,255,0.8)]";
  };

  return (
    <div className="relative min-h-screen bg-black text-white p-10 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-black opacity-90"></div>
      <div className="absolute inset-0 bg-grid opacity-10 animate-grid-move"></div>

      <div className="relative z-10 mb-8">
        <Link href="/inicio-servicio-medico">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white font-bold rounded-xl shadow-[0_0_20px_#0ff] hover:bg-teal-500 transition-transform hover:scale-105"
            aria-label="Regresar"
          >
            <BiArrowBack className="text-xl" />
            Regresar
          </button>
        </Link>
      </div>

      <motion.h1
        className="relative z-10 text-6xl font-extrabold text-center mb-10 uppercase tracking-widest"
        style={{ textShadow: "0 0 20px #0ff" }}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        📦 Alertas de Stock 📦
      </motion.h1>

      {/* Botón de descarga del PDF con diseño mejorado */}
      <div className="relative z-10 flex justify-center mb-12">
        <button
          onClick={handleGeneratePDF}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-2xl transition-transform transform hover:scale-110"
        >
          <BiDownload className="text-3xl" />
          <span className="text-xl font-extrabold">Descargar PDF</span>
        </button>
      </div>

      {loading && (
        <p className="relative z-10 text-center text-2xl animate-pulse text-cyan-400">
          Cargando notificaciones...
        </p>
      )}
      {error && (
        <p className="relative z-10 text-center text-red-500 text-xl">
          {error}
        </p>
      )}

      {/* Render normal de tarjetas */}
      {!loading && !error && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-6">
          {notificaciones.length === 0 ? (
            <p className="text-center text-gray-400 col-span-full">
              No hay notificaciones.
            </p>
          ) : (
            notificaciones.map((item, index) => {
              const cardStyle = getCardStyle(item.stockStatus);
              const statusIcon = getStatusIcon(item.stockStatus);
              const dynamicColor = getColorByStatus(item.stockStatus);
              const illuminationShadow = getIlluminationShadow(
                item.stockStatus
              );

              return (
                <motion.div
                  key={item.id}
                  onMouseEnter={playTapSound}
                  className={`relative rounded-3xl p-4 border-4 ${cardStyle} transition-all duration-500 overflow-hidden backdrop-blur-md`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.06 }}
                >
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-center gap-3 mb-4">
                    <GiMedicines
                      className={`text-3xl ${dynamicColor}`}
                      aria-hidden="true"
                    />
                    <h2
                      className={`text-3xl font-extrabold tracking-wide ${dynamicColor}`}
                      style={{ textShadow: "0 0 15px currentColor" }}
                    >
                      {item.medicamento}
                    </h2>
                  </div>

                  {/* Ícono de estado + Texto */}
                  <div className="flex items-center gap-2 text-xl text-gray-300 mb-3">
                    {statusIcon}
                    <span className="uppercase font-bold">
                      {item.stockStatus}
                    </span>
                  </div>

                  {/* EAN */}
                  <div className="flex items-center gap-2 text-lg text-gray-300 mb-2">
                    <BiBarcodeReader
                      className={`text-2xl ${dynamicColor}`}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">EAN:</span>
                    <span>{item.ean}</span>
                  </div>

                  {/* Presentación */}
                  <div className="flex items-center gap-2 text-lg text-gray-300 mb-4">
                    <BiPackage
                      className={`text-2xl ${dynamicColor}`}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">Presentación:</span>
                    <span>
                      {item.presentacion}
                      {item.medida ? ` ${item.medida}` : ""}
                    </span>
                  </div>

                  {/* Sección central: Piezas y rango */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-4">
                      <BiBox
                        className={`text-7xl ${dynamicColor} ${illuminationShadow}`}
                        aria-hidden="true"
                      />
                      <motion.span
                        className={`text-6xl font-extrabold ${dynamicColor} ${illuminationShadow}`}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {item.piezas}
                      </motion.span>
                    </div>
                    <div className="flex gap-6 text-lg text-gray-200 mt-5">
                      <div className="flex items-center gap-2">
                        <BiArrowFromBottom
                          className={`text-2xl ${dynamicColor}`}
                          aria-hidden="true"
                        />
                        <span className="font-semibold">
                          Mín: {item.minimo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BiArrowToTop
                          className={`text-2xl ${dynamicColor}`}
                          aria-hidden="true"
                        />
                        <span className="font-semibold">
                          Máx: {item.maximo}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
