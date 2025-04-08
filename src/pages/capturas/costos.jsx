/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
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
  FaCalendarPlus 
} from "react-icons/fa";

import { useRouter } from 'next/router';

const MySwal = withReactContent(Swal);

const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

//* Reproduce un sonido de éxito/error
const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

//* Helper para formatear números como moneda (pesos MXN)
function formatCurrency(value) {
  if (!value) return "";
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return value.toString();
  return numericValue.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

//* Función auxiliar para mostrar alertas con formato neon
const showAlert = (type, titleText, message) => {
  let icon = "info";
  let color = "#1976d2";
  let background = "linear-gradient(145deg, #1a237e, #0d47a1)";
  let confirmButtonColor = "#1976d2";
  let borderColor = "blue";
  let neonShadow = "rgba(25, 118, 210, 0.9)";

  if (type === "error") {
    icon = "error";
    color = "#ff1744";
    background = "linear-gradient(145deg, #4a0000, #220000)";
    confirmButtonColor = "#ff1744";
    borderColor = "red";
    neonShadow = "rgba(255,23,68,0.9)";
    playSound(false);
  } else if (type === "success") {
    icon = "success";
    color = "#00e676";
    background = "linear-gradient(145deg, #004d40, #00251a)";
    confirmButtonColor = "#00e676";
    borderColor = "green";
    neonShadow = "rgba(0,230,118,0.9)";
    playSound(true);
  } else if (type === "warning") {
    icon = "warning";
    color = "#ff9800";
    background = "linear-gradient(145deg, #4a2600, #220f00)";
    confirmButtonColor = "#ff9800";
    borderColor = "yellow";
    neonShadow = "rgba(255,152,0,0.9)";
    playSound(false);
  }

  MySwal.fire({
    icon: icon,
    title: `<span style='color: ${color}; font-weight: bold; font-size: 1.5em;'>${titleText}</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
    background: background,
    confirmButtonColor: confirmButtonColor,
    confirmButtonText:
      "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup: `border border-${borderColor}-600 shadow-[0px_0px_20px_5px_${neonShadow}] rounded-lg`,
    },
  });
};

export default function Costos() {
  const [claveconsulta, setClaveconsulta] = useState("");
  const [costosData, setCostosData] = useState([]);
  const [costo, setCosto] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [facturada, setFacturada] = useState(false);
  const router = useRouter(); 

  //* Búsqueda en el endpoint
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
        showAlert(
          "error",
          "❌ Error",
          "No se encontró registro para la claveconsulta proporcionada."
        );
        //* Limpia todos los estados, incluyendo "facturada"
        setCostosData([]);
        setClaveconsulta("");
        setCosto("");
        setNumeroFactura("");
        setFacturada(false);
        return;
      }

      //* Verifica si ya existe factura y costo
      if (data[0].factura !== "" && Number(data[0].costo) !== 0) {
        playSound(false);
        MySwal.fire({
          icon: "warning",
          title:
            "<span style='color: #ff9800; font-weight: bold; font-size: 1.5em;'>⚠️ Consulta facturada</span>",
          html: "<p style='color: #fff; font-size: 1.1em;'>Esta consulta ya fue facturada. ¿Quieres verla?</p>",
          background: "linear-gradient(145deg, #4a2600, #220f00)",
          confirmButtonColor: "#0c6b09",
          confirmButtonText:
            "<span style='color: #fff; font-weight: bold;'>Sí</span>",
          showCancelButton: true,
          cancelButtonColor: "#af0505",
          cancelButtonText:
            "<span style='color: #fff; font-weight: bold;'>No</span>",
          customClass: {
            popup:
              "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,152,0,0.9)] rounded-lg",
          },
        }).then((result) => {
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
        //! Si no está facturada, se muestran los datos para poder registrar
        setCostosData(data);
        setFacturada(false);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setCostosData([]);
      showAlert(
        "error",
        "❌ Error en la búsqueda",
        "Hubo un problema al buscar la información. Intenta nuevamente."
      );
    }
  };

  //* Guardar el costo (POST)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!costo || !numeroFactura) {
      showAlert(
        "error",
        "❌ Error",
        "Debes ingresar el costo y el número de factura"
      );
      return;
    }
    if (facturada) {
      showAlert(
        "warning",
        "⚠️ Atención",
        "Esta consulta ya fue facturada y no puede ser actualizada"
      );
      return;
    }
    try {
      const res = await fetch(
        `/api/costos/guardarCostos?claveconsulta=${encodeURIComponent(
          claveconsulta
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            costo,
            numeroFactura,
          }),
        }
      );
      if (!res.ok) {
        throw new Error("No se pudo guardar la información");
      }
      playSound(true);
      MySwal.fire({
        icon: "success",
        title:
          "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Consulta guardada correctamente</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La consulta ha sido registrada y atendida exitosamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText:
          "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });
      setCosto("");
      setNumeroFactura("");
      setFacturada(true);
      handleSearch();
    } catch (error) {
      console.error("Error al guardar el costo:", error);
      showAlert("error", "❌ Error", "Error al guardar el costo");
    }
  };

  // ==================================================
  //* Estilos y Paleta
  // ==================================================
  const colors = {
    primary: "#37B874",
    primaryDark: "#2B8F60",
    accent: "#A5FFD6",
    textDark: "#1E1E1E",
    textLight: "#FAFAFA",
  };

  //* Contenedor principal
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

  //* Botón de "Regresar" como flotante en esquina superior izquierda
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

  //* Título principal
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

  //* Tarjetas con efecto "glass"
  const glassCard = {
    backdropFilter: "blur(12px)",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.18)",
  };

  //* Card de búsqueda
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

  //* Sección interna de búsqueda (input + botón)
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

  //* Botón "Buscar"
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

  //* Contenedor de resultados
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

  //* Card individual de la consulta
  const cardStyle = {
    ...glassCard,
    padding: "2rem",
    position: "relative",
    transition: "transform 0.3s, boxShadow 0.3s",
  };

  //* Grid de 2 columnas para los campos
  const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  };

  //* Cada "campo" en la grid
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

  //* Formulario
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

  //* Efectos de focus/hover en inputs y tarjetas
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

      {/* Botón flotante para "Regresar" */}
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
        {/* Título principal */}
        <h1 style={headerStyle}>Consulta de Costos</h1>

        {/* Card de Búsqueda */}
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

        {/* Resultados */}
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
                  {/* Proveedor */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaHospital style={iconStyle} />
                      Proveedor / Médico
                    </div>
                    <div style={fieldValueStyle}>
                      {item.nombreproveedor ?? "N/A"}
                    </div>
                  </div>

                  {/* Fecha de la consulta */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaCalendarPlus style={iconStyle} />
                      Fecha de la Consulta con el Especialista
                    </div>
                    <div style={fieldValueStyle}>
                      {item.fechaconsulta ?? "N/A"}
                    </div>
                  </div>

                  {/* Nómina */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaUser style={iconStyle} />
                      Número de Nómina
                    </div>
                    <div style={fieldValueStyle}>
                      {item.clavenomina ?? "N/A"}
                    </div>
                  </div>

                  {/* Parentesco */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaQuestionCircle style={iconStyle} />
                      Parentesco
                    </div>
                    <div style={fieldValueStyle}>
                      {item.pacienteInfo ?? "N/A"}
                    </div>
                  </div>

                  {/* Departamento */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaBuilding style={iconStyle} />
                      Departamento
                    </div>
                    <div style={fieldValueStyle}>
                      {item.departamento?.trim() ?? "N/A"}
                    </div>
                  </div>

                  {/* Especialidad */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaStethoscope style={iconStyle} />
                      Especialidad que fue Asignada
                    </div>
                    <div style={fieldValueStyle}>
                      {item.especialidad ?? "N/A"}
                    </div>
                  </div>

                  {/* Paciente */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaUserAlt style={iconStyle} />
                      Paciente
                    </div>
                    <div style={fieldValueStyle}>
                      {item.nombrepaciente ?? "N/A"}
                    </div>
                  </div>

                  {/* Edad */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaBirthdayCake style={iconStyle} />
                      Edad
                    </div>
                    <div style={fieldValueStyle}>{item.edad ?? "N/A"}</div>
                  </div>

                  {/* Motivo de consulta */}
                  <div style={fieldBoxStyle}>
                    <div style={fieldLabelStyle}>
                      <FaNotesMedical style={iconStyle} />
                      Motivo de la Consulta
                    </div>
                    <div style={fieldValueStyle}>
                      {item.motivoconsulta ?? "N/A"}
                    </div>
                  </div>

                  {/* Diagnóstico */}
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
        {/* Mensaje si ya fue facturada */}
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
          <form style={formContainerStyle}>
            <div style={sectionTitleStyle}>
              <FaFileInvoiceDollar style={sectionIconStyle} />
              <span>Detalle de Facturación</span>
            </div>
            <div style={formFieldStyle}>
              <label style={labelStyle}>Costo</label>
              <input
                type="text"
                value={formatCurrency(costo)}
                disabled
                style={{
                  ...fancyInputStyle,
                  backgroundColor: "#e0e0e0",
                  cursor: "not-allowed",
                }}
              />
            </div>
            <div style={formFieldStyle}>
              <label style={labelStyle}>Número de Factura</label>
              <input
                type="text"
                value={numeroFactura}
                disabled
                style={{
                  ...fancyInputStyle,
                  backgroundColor: "#e0e0e0",
                  cursor: "not-allowed",
                }}
              />
            </div>
            <p
              style={{
                textAlign: "center",
                color: "#424242",
                fontSize: "1rem",
              }}
            >
              Consulta facturada. No se pueden actualizar los datos.
            </p>
          </form>
        )}
      </div>
    </>
  );
}
