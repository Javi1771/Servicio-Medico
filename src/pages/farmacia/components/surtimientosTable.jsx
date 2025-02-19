import React from 'react';
import Head from 'next/head'; // Inyección del link de FontAwesome
import styles from '../../css/EstilosFarmacia/SurtimientosTable.module.css';

const iconMap = {
  FOLIO_SURTIMIENTO: 'fa-file-invoice',
  FOLIO_PASE: 'fa-file-medical',
  FECHA_EMISION: 'fa-calendar-day',
  NOMINA: 'fa-id-card',
  CLAVE_PACIENTE: 'fa-user',
  NOMBRE_PACIENTE: 'fa-user-check',
  EDAD: 'fa-user-clock',
  ESEMPLEADO: 'fa-user-tie',
  CLAVEMEDICO: 'fa-user-md',
  DIAGNOSTICO: 'fa-stethoscope',
  DEPARTAMENTO: 'fa-building',
  ESTATUS: 'fa-info-circle',
  COSTO: 'fa-money-bill-wave',
  FECHA_DESPACHO: 'fa-calendar-check',
  SINDICATO: 'fa-users',
  claveusuario: 'fa-user-shield'
};

const SurtimientosTable = ({ data }) => {
  const { surtimiento, detalleSurtimientos } = data;

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
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.FOLIO_SURTIMIENTO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Folio Surtimiento:</strong> {surtimiento.FOLIO_SURTIMIENTO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.FOLIO_PASE}`}></i>
                  <p className={styles.infoText}>
                    <strong>Folio Pase:</strong> {surtimiento.FOLIO_PASE}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.FECHA_EMISION}`}></i>
                  <p className={styles.infoText}>
                    <strong>Fecha Emisión:</strong> {surtimiento.FECHA_EMISION}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.NOMINA}`}></i>
                  <p className={styles.infoText}>
                    <strong>Nómina:</strong> {surtimiento.NOMINA}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.CLAVE_PACIENTE}`}></i>
                  <p className={styles.infoText}>
                    <strong>Clave Paciente:</strong> {surtimiento.CLAVE_PACIENTE}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.NOMBRE_PACIENTE}`}></i>
                  <p className={styles.infoText}>
                    <strong>Nombre Paciente:</strong> {surtimiento.NOMBRE_PACIENTE}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.EDAD}`}></i>
                  <p className={styles.infoText}>
                    <strong>Edad:</strong> {surtimiento.EDAD}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.ESEMPLEADO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Empleado:</strong> {surtimiento.ESEMPLEADO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.CLAVEMEDICO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Clave Médico:</strong> {surtimiento.CLAVEMEDICO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.DIAGNOSTICO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Diagnóstico:</strong> {surtimiento.DIAGNOSTICO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.DEPARTAMENTO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Departamento:</strong> {surtimiento.DEPARTAMENTO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.ESTATUS}`}></i>
                  <p className={styles.infoText}>
                    <strong>Estatus:</strong> {surtimiento.ESTATUS}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.COSTO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Costo:</strong> {surtimiento.COSTO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.FECHA_DESPACHO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Fecha Despacho:</strong> {surtimiento.FECHA_DESPACHO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.SINDICATO}`}></i>
                  <p className={styles.infoText}>
                    <strong>Sindicato:</strong> {surtimiento.SINDICATO}
                  </p>
                </div>
                <div className={styles.infoItem}>
                  <i className={`fa-solid ${styles.infoIcon} ${iconMap.claveusuario}`}></i>
                  <p className={styles.infoText}>
                    <strong>Clave Usuario:</strong> {surtimiento.claveusuario}
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
            {detalleSurtimientos && detalleSurtimientos.length > 0 ? (
              <div className={styles.medicamentosContainer}>
                {detalleSurtimientos.map((item) => (
                  <div className={styles.medicamentoCard} key={item.idSurtimiento}>
                    <div className={styles.medicamentoRow}>
                      <i className={`fa-solid fa-pills ${styles.medicamentoIcon}`}></i>
                      <span className={styles.medicamentoLabel}>Clave Medicamento:</span>
                      <span className={styles.medicamentoValue}>{item.claveMedicamento}</span>
                    </div>
                    <div className={styles.medicamentoRow}>
                      <i className={`fa-solid fa-prescription ${styles.medicamentoIcon}`}></i>
                      <span className={styles.medicamentoLabel}>Indicaciones:</span>
                      <span className={styles.medicamentoValue}>{item.indicaciones}</span>
                    </div>
                    <div className={styles.medicamentoRow}>
                      <i className={`fa-solid fa-boxes-stacked ${styles.medicamentoIcon}`}></i>
                      <span className={styles.medicamentoLabel}>Cantidad:</span>
                      <span className={styles.medicamentoValue}>{item.cantidad}</span>
                    </div>
                    <div className={styles.medicamentoRow}>
                      <i className={`fa-solid fa-cubes ${styles.medicamentoIcon}`}></i>
                      <span className={styles.medicamentoLabel}>Piezas:</span>
                      <span className={styles.medicamentoValue}>{item.piezas}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No se encontró detalle de medicamentos.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SurtimientosTable;
