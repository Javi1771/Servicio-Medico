/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import {
  FaHospital,
  FaUser,
  FaQuestionCircle,
  FaBuilding,
  FaStethoscope,
  FaUserAlt,
  FaBirthdayCake,
  FaSearch,
  FaFileInvoiceDollar,
  FaArrowLeft,
  FaFileMedical,
  FaNotesMedical,
  FaCalendarPlus,
  FaDownload,
  FaPrint,
} from "react-icons/fa";
import { useRouter } from "next/router";
import { showCustomAlert } from "../../utils/alertas";

function formatCurrency(value) {
  if (!value) return "";
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return value.toString();
  return numericValue.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function Costos() {
  const [claveconsulta, setClaveconsulta] = useState("");
  const [costosData, setCostosData] = useState([]);
  const [costo, setCosto] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [facturada, setFacturada] = useState(false);
  // Nuevo estado para almacenar el archivo PDF
  const [pdfFile, setPdfFile] = useState(null);
  const router = useRouter();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSearch = async () => {
    if (!claveconsulta) return;
    try {
      const res = await fetch(
        `/api/costos/obtenerCostos?claveconsulta=${claveconsulta}`
      );
      if (!res.ok) {
        throw new Error("No se pudo obtener la información");
      }
      const data = await res.json();
      if (data.length === 0) {
        await showCustomAlert(
          "info",
          "Sin resultados",
          "No se encontraron datos para la clave de consulta proporcionada.",
          "Aceptar"
        );
        setCostosData([]);
        setClaveconsulta("");
        setCosto("");
        setNumeroFactura("");
        setFacturada(false);
        return;
      }

      if (data[0].factura !== "" && Number(data[0].costo) !== 0) {
        await showCustomAlert(
          "warning",
          "Atención",
          "Esta consulta ya fue facturada y no puede ser actualizada.",
          "Aceptar"
        ).then((result) => {
          if (result.isConfirmed) {
            setCostosData(data);
            setFacturada(true);
            setCosto(data[0].costo);
            setNumeroFactura(data[0].factura);
          } else {
            setCostosData([]);
            setClaveconsulta("");
            setCosto("");
            setNumeroFactura("");
            setFacturada(false);
          }
        });
      } else {
        setCostosData(data);
        setFacturada(false);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setCostosData([]);
      await showCustomAlert(
        "error",
        "Error al obtener datos",
        "Hubo un problema al intentar obtener los datos de costos. Por favor, intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!costo || !numeroFactura) {
      await showCustomAlert(
        "error",
        "Error",
        "Debes ingresar el costo y el número de factura"
      );

      return;
    }
    if (facturada) {
      await showCustomAlert(
        "warning",
        "Atención",
        "Esta consulta ya fue facturada y no puede ser actualizada"
      );
      return;
    }
    try {
      // Se utiliza FormData para enviar el PDF junto a los demás campos
      const formData = new FormData();
      formData.append("costo", costo);
      formData.append("numeroFactura", numeroFactura);
      formData.append("pdfEvidence", pdfFile);

      const res = await fetch(
        `/api/costos/guardarCostos?claveconsulta=${encodeURIComponent(
          claveconsulta
        )}`,
        {
          method: "POST",
          // No se establece Content-Type porque al usar FormData se maneja automáticamente
          body: formData,
        }
      );
      if (!res.ok) {
        throw new Error("No se pudo guardar la información");
      }
      await showCustomAlert(
        "success",
        "Consulta guardada correctamente",
        "La consulta ha sido registrada y atendida exitosamente.",
        "Aceptar"
      );

      setCosto("");
      setNumeroFactura("");
      setFacturada(true);
      // Opcional: reiniciar el estado del PDF si se desea
      setPdfFile(null);
      handleSearch();
    } catch (error) {
      console.error("Error al guardar el costo:", error);
      await showCustomAlert(
        "error",
        "Error",
        "Hubo un problema al intentar guardar la información. Por favor, intenta nuevamente.",
        "Aceptar"
      );
    }
  };

  const colors = {
    primary: "#37B874",
    primaryDark: "#2B8F60",
    accent: "#A5FFD6",
    textDark: "#1E1E1E",
    textLight: "#FAFAFA",
  };

  const containerStyle = {
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "'Poppins', sans-serif",
    color: colors.textDark,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: `linear-gradient(135deg, #c8f7dc 0%, #f2ffe9 100%)`,
    overflowX: "hidden",
    position: "relative",
  };

  const floatingBackButtonStyle = {
    position: "fixed",
    top: "1.5rem",
    left: "1.5rem",
    zIndex: 999,
    padding: "0.6rem 1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: colors.primaryDark,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: `0 0 5px ${colors.primaryDark}`,
    transition: "transform 0.3s, box-shadow 0.3s",
  };

  const handleBackMouseEnter = (e) => {
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = `0 0 10px ${colors.primaryDark}`;
  };

  const handleBackMouseLeave = (e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = `0 0 5px ${colors.primaryDark}`;
  };

  const headerStyle = {
    fontSize: "3rem",
    color: colors.primaryDark,
    letterSpacing: "1px",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
    animation: "fadeInDown 0.7s ease forwards",
    transform: "translateY(-30px)",
    opacity: 0,
    marginBottom: "1.5rem",
  };

  const glassCard = {
    backdropFilter: "blur(12px)",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.18)",
  };

  const searchContainerStyle = {
    ...glassCard,
    width: "100%",
    maxWidth: "900px",
    padding: "1.5rem",
    marginBottom: "2rem",
    animation: "fadeInUp 0.7s ease forwards",
    transform: "translateY(20px)",
    opacity: 0,
  };

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    fontSize: "1.8rem",
    color: colors.primaryDark,
    marginBottom: "1rem",
    textShadow: `0 0 2px ${colors.primaryDark}`,
  };

  const sectionIconStyle = {
    marginRight: "0.5rem",
    color: colors.primary,
    fontSize: "1.8rem",
  };

  const searchSectionStyle = {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
  };

  const inputStyle = {
    flex: 1,
    padding: "0.8rem",
    fontSize: "1.1rem",
    border: `2px solid ${colors.primary}`,
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxShadow: `0 0 0px ${colors.primary}`,
  };

  const buttonStyle = {
    padding: "0.8rem 1.2rem",
    fontSize: "1.1rem",
    border: "none",
    borderRadius: "8px",
    backgroundColor: colors.primary,
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.3s, transform 0.3s, box-shadow 0.3s",
    boxShadow: `0 0 5px ${colors.primary}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    fontWeight: 600,
  };

  const resultsContainerStyle = {
    width: "100%",
    maxWidth: "900px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    animation: "fadeInUp 0.8s ease forwards",
    transform: "translateY(20px)",
    opacity: 0,
  };

  const cardStyle = {
    ...glassCard,
    padding: "2rem",
    position: "relative",
    transition: "transform 0.3s, boxShadow 0.3s",
  };

  const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  };

  const fieldBoxStyle = {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: "8px",
    padding: "1rem",
  };

  const fieldLabelStyle = {
    display: "flex",
    alignItems: "center",
    fontWeight: 600,
    fontSize: "1rem",
    color: colors.primaryDark,
    marginBottom: "0.3rem",
  };

  const fieldValueStyle = {
    fontSize: "1rem",
    color: "#424242",
  };

  const iconStyle = {
    marginRight: "0.3rem",
    fontSize: "1.2rem",
    color: colors.primaryDark,
  };

  const formContainerStyle = {
    ...glassCard,
    width: "100%",
    maxWidth: "900px",
    padding: "1.5rem",
    animation: "fadeInUp 0.9s ease forwards",
    transform: "translateY(20px)",
    opacity: 0,
    marginTop: "1rem",
  };

  const formFieldStyle = {
    display: "flex",
    flexDirection: "column",
    marginBottom: "1rem",
  };

  const labelStyle = {
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: colors.primaryDark,
  };

  const fancyInputStyle = {
    padding: "0.8rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: "8px",
    outline: "none",
    background: "linear-gradient(to right, #ffffff, #ecfdf4)",
    boxShadow: `inset 0 0 5px rgba(0,0,0,0.1)`,
    transition: "box-shadow 0.3s, background 0.3s",
  };

  const submitButtonStyle = {
    ...buttonStyle,
    width: "100%",
    marginTop: "1rem",
    justifyContent: "center",
  };

  const handleInputFocus = (e) => {
    e.target.style.boxShadow = "inset 0 0 8px rgba(0, 0, 0, 0.2)";
    e.target.style.background = "linear-gradient(to right, #f2fff9, #dfffef)";
  };

  const handleInputBlur = (e) => {
    e.target.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.1)";
    e.target.style.background = "linear-gradient(to right, #ffffff, #ecfdf4)";
  };

  const handleButtonMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = colors.primaryDark;
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow = `0 0 10px ${colors.primaryDark}`;
  };

  const handleButtonMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = colors.primary;
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = `0 0 5px ${colors.primary}`;
  };

  const handleCardMouseEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-5px)";
    e.currentTarget.style.boxShadow = `
      0 0 5px ${colors.accent},
      0 0 10px ${colors.accent},
      0 0 15px ${colors.accent}
    `;
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 8px 32px 0 rgba(31, 38, 135, 0.37)";
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeInDown {
            0% {
              opacity: 0;
              transform: translateY(-30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <button
        style={floatingBackButtonStyle}
        onMouseEnter={handleBackMouseEnter}
        onMouseLeave={handleBackMouseLeave}
        onClick={() => router.replace("/inicio-servicio-medico")}
      >
        <FaArrowLeft />
        Regresar
      </button>

      <div style={containerStyle}>
        <h1 style={headerStyle}>Consulta de Costos</h1>

        <div style={searchContainerStyle}>
          <div style={sectionTitleStyle}>
            <FaSearch style={sectionIconStyle} />
            <span>Búsqueda</span>
          </div>
          <div style={searchSectionStyle}>
            <input
              type="text"
              placeholder="Ingresa el folio de la consulta"
              value={claveconsulta}
              onChange={(e) => setClaveconsulta(e.target.value)}
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button
              style={buttonStyle}
              onClick={handleSearch}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
            >
              <FaSearch />
              Buscar
            </button>
          </div>
        </div>

        <div style={resultsContainerStyle}>
          {costosData.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                fontStyle: "italic",
                color: "#757575",
                fontSize: "1.2rem",
              }}
            >
              No hay datos para mostrar o no se ha realizado la búsqueda.
            </p>
          ) : (
            costosData.map((item, index) => (
              <div
                key={index}
                style={cardStyle}
                onMouseEnter={handleCardMouseEnter}
                onMouseLeave={handleCardMouseLeave}
              >
                <div style={twoColumnGrid}>
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaHospital style={iconStyle} />
                      Proveedor / Médico
                    </div>
                    <div style={fieldValueStyle}>
                      {item.nombreproveedor ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaCalendarPlus style={iconStyle} />
                      Fecha de la Consulta con el Especialista
                    </div>
                    <div style={fieldValueStyle}>
                      {item.fechaconsulta ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaUser style={iconStyle} />
                      Número de Nómina
                    </div>
                    <div style={fieldValueStyle}>
                      {item.clavenomina ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaQuestionCircle style={iconStyle} />
                      Parentesco
                    </div>
                    <div style={fieldValueStyle}>
                      {item.pacienteInfo ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaBuilding style={iconStyle} />
                      Departamento
                    </div>
                    <div style={fieldValueStyle}>
                      {item.departamento?.trim() ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaStethoscope style={iconStyle} />
                      Especialidad que fue Asignada
                    </div>
                    <div style={fieldValueStyle}>
                      {item.especialidad ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaUserAlt style={iconStyle} />
                      Paciente
                    </div>
                    <div style={fieldValueStyle}>
                      {item.nombrepaciente ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaBirthdayCake style={iconStyle} />
                      Edad
                    </div>
                    <div style={fieldValueStyle}>{item.edad ?? "N/A"}</div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaNotesMedical style={iconStyle} />
                      Motivo de la Consulta
                    </div>
                    <div style={fieldValueStyle}>
                      {item.motivoconsulta ?? "N/A"}
                    </div>
                  </div>

                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaFileMedical style={iconStyle} />
                      Diagnóstico
                    </div>
                    <div style={fieldValueStyle}>
                      {item.diagnostico ?? "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <br />
        {facturada && costosData.length > 0 && (
          <p style={{ color: "#2B8F60", fontSize: "1.2rem", fontWeight: 600 }}>
            Esta consulta ya fue facturada. No es posible actualizar los datos.
          </p>
        )}

        {/* Formulario para registrar (si hay datos y no está facturada) */}
        {costosData.length > 0 && !facturada && (
          <form style={formContainerStyle} onSubmit={handleSubmitForm}>
            <div style={sectionTitleStyle}>
              <FaFileInvoiceDollar style={sectionIconStyle} />
              <span>Registrar Costo</span>
            </div>
            <div style={formFieldStyle}>
              <label style={labelStyle}>Costo</label>
              <input
                type="number"
                step="0.01"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                style={fancyInputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Ingresa el costo"
              />
            </div>
            <div style={formFieldStyle}>
              <label style={labelStyle}>Número de Factura</label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                style={fancyInputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Ingresa el número de factura"
              />
            </div>
            {/* Nuevo campo para subir el PDF de evidencia con barra de carga */}
            <div style={formFieldStyle}>
              <label style={labelStyle}>Evidencia de la Factura (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPdfFile(e.target.files[0]);
                  }
                }}
                style={{
                  ...fancyInputStyle,
                  padding: "0.8rem",
                  border: "2px dashed #37B874",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "linear-gradient(to right, #ffffff, #ecfdf4)",
                }}
              />
              {uploadProgress > 0 && (
                <div style={{ marginTop: "10px", textAlign: "center" }}>
                  <label
                    style={{
                      color: "#2B8F60",
                      fontWeight: "bold",
                      marginBottom: "5px",
                      display: "block",
                    }}
                  >
                    Subiendo archivo: {uploadProgress}%
                  </label>
                  <progress
                    value={uploadProgress}
                    max="100"
                    style={{
                      width: "100%",
                      height: "20px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #37B874",
                    }}
                  ></progress>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={submitButtonStyle}
              onMouseEnter={handleButtonMouseEnter}
              onMouseLeave={handleButtonMouseLeave}
            >
              <FaFileInvoiceDollar />
              Guardar
            </button>
          </form>
        )}

        {/* Formulario en modo lectura (si está facturada) */}
        {facturada && costosData.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "2rem",
              justifyContent: "center",
              alignItems: "flex-start",
              marginTop: "2rem",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 3px 15px rgba(0, 0, 0, 0.07)",
              padding: "2rem",
              width: "100%",
              maxWidth: "900px",
              animation: "fadeInUp 0.9s ease forwards",
              transform: "translateY(20px)",
              opacity: 1,
            }}
          >
            {/* Columna Izquierda: Datos de Facturación */}
            <div
              style={{
                flex: "1 1 320px",
                minWidth: "280px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(145deg, #dfffe9, #f4fff9)",
                  borderRadius: "12px",
                  padding: "1rem 1.5rem",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.8rem",
                    color: "#2B8F60",
                    margin: 0,
                    textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                    borderBottom: "2px solid #c2ead4",
                    paddingBottom: "0.5rem",
                  }}
                >
                  Detalle de Facturación
                </h2>

                {/* Costo */}
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    background: "#f6f9f7",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  <strong style={{ color: "#2B8F60" }}>Costo</strong>
                  <span style={{ color: "#444", fontSize: "1.1rem" }}>
                    {formatCurrency(costo)}
                  </span>
                </div>

                {/* Número de Factura */}
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    background: "#f6f9f7",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  <strong style={{ color: "#2B8F60" }}>
                    Número de Factura
                  </strong>
                  <span style={{ color: "#444", fontSize: "1.1rem" }}>
                    {numeroFactura}
                  </span>
                </div>

                <p
                  style={{
                    textAlign: "center",
                    color: "#757575",
                    fontSize: "0.95rem",
                    marginTop: "1rem",
                  }}
                >
                  Consulta facturada. No se pueden actualizar los datos.
                </p>
              </div>
            </div>

            {/* Columna Derecha: Previsualización y botones */}
            {costosData[0].url_factura && (
              <div
                style={{
                  flex: "1 1 320px",
                  minWidth: "280px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(145deg, #dfffe9, #f4fff9)",
                    borderRadius: "12px",
                    padding: "1rem 1.5rem",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <h3
                    style={{
                      color: "#2B8F60",
                      margin: 0,
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                      borderBottom: "2px solid #c2ead4",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    Previsualización de la factura
                  </h3>

                  <div
                    style={{
                      width: "260px",
                      height: "380px",
                      background: "#f6f9f7",
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e0e0e0",
                      margin: "1rem auto 0",
                    }}
                  >
                    <iframe
                      id="invoiceIframe"
                      src={costosData[0].url_factura}
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      title="Previsualización de la factura"
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: "1.2rem",
                      justifyContent: "center",
                    }}
                  >
                    <a
                      href={costosData[0].url_factura}
                      download
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "linear-gradient(145deg, #37B874, #2B8F60)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.8rem 1.2rem",
                        fontSize: "0.9rem",
                        textDecoration: "none",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
                        cursor: "pointer",
                      }}
                    >
                      <FaDownload /> Descargar
                    </a>
                    <button
                      onClick={() => {
                        const iframe = document.getElementById("invoiceIframe");
                        if (iframe && iframe.contentWindow) {
                          iframe.contentWindow.print();
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "linear-gradient(145deg, #37B874, #2B8F60)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.8rem 1.2rem",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <FaPrint /> Imprimir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
