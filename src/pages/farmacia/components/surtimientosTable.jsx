import React, { useState } from "react";
import Head from "next/head"; // Para inyectar el link de FontAwesome
import styles from "../../css/EstilosFarmacia/SurtimientosTable.module.css";

// Función para validar el EAN a través del endpoint /api/farmacia/validarEAN
async function validarEAN(ean, claveMedicamento) {
  try {
    const resp = await fetch("/api/farmacia/validarEAN", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, claveMedicamento }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message || "Error validando EAN");
    return data; // { valido: true/false }
  } catch (err) {
    console.error(err);
    return { valido: false };
  }
}

const iconMap = {
  FOLIO_SURTIMIENTO: "fa-file-invoice",
  FOLIO_PASE: "fa-file-medical",
  FECHA_EMISION: "fa-calendar-day",
  NOMINA: "fa-id-card",
  CLAVE_PACIENTE: "fa-user",
  NOMBRE_PACIENTE: "fa-user-check",
  EDAD: "fa-user-clock",
  ESEMPLEADO: "fa-user-tie",
  CLAVEMEDICO: "fa-user-md",
  DIAGNOSTICO: "fa-stethoscope",
  DEPARTAMENTO: "fa-building",
  ESTATUS: "fa-info-circle",
  COSTO: "fa-money-bill-wave",
  FECHA_DESPACHO: "fa-calendar-check",
  SINDICATO: "fa-users",
  claveusuario: "fa-user-shield",
};

const SurtimientosTable = ({ data }) => {
  const { surtimiento, detalleSurtimientos } = data;

  // Si en la DB ESTATUS es int: 1 = pendiente, 2 = surtida
  const estatusTexto =
    surtimiento?.ESTATUS === 1 ? "Receta Pendiente" : "Receta Surtida";

  // Estado local: extendemos cada detalle con propiedades para el manejo del escaneo
  const [detalle, setDetalle] = useState(
    detalleSurtimientos.map((item) => ({
      ...item,
      piezasPendientes: item.piezas, // Inicialmente, las piezas pendientes son las que se requieren
      showInput: false, // Control para mostrar el input de EAN
      eanValue: "",
      estatusLocal: 1, // 1 = pendiente, 2 = surtido (cuando piezasPendientes llegue a 0)
    }))
  );

  // Alterna la visibilidad del input mediante botón (sin depender del clic de la card)
  const toggleInput = (idSurt) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt
          ? { ...it, showInput: !it.showInput }
          : it
      )
    );
  };

  // Actualiza el valor del input EAN
  const handleEANChange = (idSurt, value) => {
    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt ? { ...it, eanValue: value } : it
      )
    );
  };

  // Valida el EAN y descuenta 1 pieza si es correcto
  const handleAceptarEAN = async (idSurt) => {
    const item = detalle.find((it) => it.idSurtimiento === idSurt);
    if (!item) return;

    // Impide escanear si ya se han entregado todas las piezas requeridas
    if (item.piezasPendientes <= 0) {
      alert("Ya se han escaneado todas las piezas requeridas para este medicamento.");
      return;
    }

    // Calcula cuántas piezas ya se han entregado
    const piezasEscaneadas = item.piezas - item.piezasPendientes;
    // Valida que al escanear una pieza más, no se supere el stock disponible
    if (piezasEscaneadas + 1 > item.stock) {
      alert("Stock insuficiente para este medicamento.");
      return;
    }

    // Llama a la API para validar el EAN
    const { valido } = await validarEAN(item.eanValue, item.claveMedicamento);
    if (!valido) {
      alert("EAN no válido o no coincide con el medicamento.");
      return;
    }

    // Descuenta 1 pieza
    const nuevasPiezasPendientes = item.piezasPendientes - 1;
    const nuevoEstatusLocal = nuevasPiezasPendientes <= 0 ? 2 : 1;

    setDetalle((prev) =>
      prev.map((it) =>
        it.idSurtimiento === idSurt
          ? {
              ...it,
              piezasPendientes: nuevasPiezasPendientes,
              eanValue: "",
              estatusLocal: nuevoEstatusLocal,
              showInput: false, // Oculta el input tras aceptar
            }
          : it
      )
    );
  };

  // Al dar clic en "Guardar", se envía la información a la DB
  const handleGuardar = async () => {
    try {
      const todosSurtidos = detalle.every((it) => it.estatusLocal === 2);
      // Para cada detalle, calculamos las piezas entregadas: (cantidad - piezasPendientes)
      const detallesParaGuardar = detalle.map((it) => ({
        idSurtimiento: it.idSurtimiento,
        // delivered: piezas entregadas
        delivered: it.piezas - it.piezasPendientes,
        claveMedicamento: it.claveMedicamento,
        estatus: it.estatusLocal,
      }));

      const resp = await fetch("/api/farmacia/surtirMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folioSurtimiento: surtimiento.FOLIO_SURTIMIENTO,
          detalle: detallesParaGuardar,
          recetaCompletada: todosSurtidos,
        }),
      });
      const dataResp = await resp.json();
      if (!resp.ok) throw new Error(dataResp.message || "Error al guardar");
      alert("Cambios guardados correctamente.");
    } catch (err) {
      alert("Error guardando cambios: " + err.message);
    }
  };

  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          integrity="sha384-..."
          crossOrigin="anonymous"
        />
      </Head>
      <div className={styles.card}>
        <div className={styles.dualContainer}>
          {/* Sección Información del Surtimiento */}
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Información del Surtimiento</h2>
            {surtimiento ? (
              <div className={styles.info}>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-file-invoice ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Folio Surtimiento:</strong> {surtimiento.FOLIO_SURTIMIENTO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-file-medical ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Folio Pase:</strong> {surtimiento.FOLIO_PASE}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-calendar-day ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Fecha Emisión:</strong> {surtimiento.FECHA_EMISION}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-id-card ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Nómina:</strong> {surtimiento.NOMINA}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-user-check ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Nombre Paciente:</strong> {surtimiento.NOMBRE_PACIENTE}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-user-clock ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Edad:</strong> {surtimiento.EDAD}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-user-tie ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Empleado:</strong> {surtimiento.ESEMPLEADO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-user-md ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Médico:</strong> {surtimiento.doctorName || "(Sin datos)"}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-stethoscope ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Diagnóstico:</strong> {surtimiento.DIAGNOSTICO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-building ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Departamento:</strong> {surtimiento.DEPARTAMENTO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-info-circle ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Estatus:</strong> {estatusTexto}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-money-bill-wave ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Costo:</strong> {surtimiento.COSTO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-calendar-check ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Fecha Despacho:</strong> {surtimiento.FECHA_DESPACHO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-users ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Sindicato:</strong> {surtimiento.SINDICATO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid fa-user-shield ${styles.infoIcon}`}></i>
                  <p className={styles.infoText}>
                    <strong>Elaboró:</strong> {surtimiento.userName || "(Sin datos)"}
                  </p>
                </div>
              </div>
            ) : (
              <p>No se encontró información del surtimiento.</p>
            )}
          </div>

          {/* Sección Detalle de Medicamentos */}
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Detalle de Medicamentos</h2>
            {detalle && detalle.length > 0 ? (
              <div className={styles.medicamentosContainer}>
                {detalle.map((item) => (
                  <div
                    className={styles.medicamentoCard}
                    key={item.idSurtimiento}
                  >
                    {/* Muestra el nombre del medicamento si está disponible */}
                    <div className={styles.medicamentoRow}>
                      <i
                        className={`fa-solid fa-pills ${styles.medicamentoIcon}`}
                      ></i>
                      <span className={styles.medicamentoLabel}>
                        Medicamento:
                      </span>
                      <span className={styles.medicamentoValue}>
                        {item.nombreMedicamento || item.claveMedicamento}
                      </span>
                    </div>
                    <div className={styles.medicamentoRow}>
                      <i
                        className={`fa-solid fa-prescription ${styles.medicamentoIcon}`}
                      ></i>
                      <span className={styles.medicamentoLabel}>
                        Indicaciones:
                      </span>
                      <span className={styles.medicamentoValue}>
                        {item.indicaciones}
                      </span>
                    </div>
                    <div className={styles.medicamentoRow}>
                      <i
                        className={`fa-solid fa-boxes-stacked ${styles.medicamentoIcon}`}
                      ></i>
                      <span className={styles.medicamentoLabel}>
                        Cantidad:
                      </span>
                      <span className={styles.medicamentoValue}>
                        {item.cantidad}
                      </span>
                    </div>
                    <div className={styles.medicamentoRow}>
                      <i
                        className={`fa-solid fa-cubes ${styles.medicamentoIcon}`}
                      ></i>
                      <span className={styles.medicamentoLabel}>
                        Piezas:
                      </span>
                      <span className={styles.medicamentoValue}>
                        {item.piezasPendientes} / {item.piezas}
                      </span>
                    </div>
                    {/* Botón para activar el input EAN */}
                    <div className={styles.medicamentoRow}>
                      <button
                        onClick={() => toggleInput(item.idSurtimiento)}
                        className={styles.toggleInputButton}
                      >
                        {item.showInput ? "Ocultar" : "Escanear EAN"}
                      </button>
                    </div>
                    {/* Input EAN, visible si showInput es true */}
                    {item.showInput && (
                      <div className={styles.medicamentoRow}>
                        <input
                          type="text"
                          placeholder="Escanea el EAN"
                          value={item.eanValue}
                          onChange={(e) =>
                            handleEANChange(item.idSurtimiento, e.target.value)
                          }
                          className={styles.eanInput}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAceptarEAN(item.idSurtimiento);
                          }}
                          className={styles.eanButton}
                        >
                          Aceptar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No se encontró detalle de medicamentos.</p>
            )}
            {/* Botón Guardar */}
            <button onClick={handleGuardar} className={styles.saveButton}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SurtimientosTable;
