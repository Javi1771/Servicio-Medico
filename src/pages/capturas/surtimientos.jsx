// src/pages/capturas/surtimientos3.jsx
import { useState, useEffect } from 'react';
import { useGetInfoConsulta } from '../../hooks/Surtimientos3/useGetInfoConsulta';
import ResurtimientoTable from './components3/ResurtimientoTable';
import { ModalEspecialidad } from './components3/ModalEspecialidad';
import { ModalFormulario } from './components3/ModalFormulario';
import styles from '../css/surtimientos3/Surtimiento3Module.module.css';
import Image from 'next/image';

export default function Surtimientos3() {
  const [folio, setFolio] = useState('');
  const [fechaActual, setFechaActual] = useState('');
  const { data: consulta, error, loading, getInfoConsulta } = useGetInfoConsulta();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [shouldCheckModal, setShouldCheckModal] = useState(false);

  // Inicializa la fecha actual
  useEffect(() => {
    const ahora = new Date();
    setFechaActual(
      `${ahora.getDate()}/${ahora.getMonth() + 1}/${ahora.getFullYear()}`
    );
  }, []);

  // Cuando pulsa Buscar
  const handleBuscar = async () => {
    // reset
    setShowConfirm(false);
    setShowForm(false);
    setShouldCheckModal(true);

    await getInfoConsulta(folio);
  };

  // Efecto que mira la consulta y comprueba interconsulta/diagnóstico/meds
  useEffect(() => {
    if (!shouldCheckModal || !consulta) return;

    (async () => {
      // 1) Comprueba si hay resurtimientos pendientes
      const res = await fetch(`/api/Surtimientos3/Valida-Caso2?folioReceta=${folio}`);
      const meds = await res.json();

      const isInter = Boolean(consulta.especialidadinterconsulta);
      const noDiag = !consulta.diagnostico;
      const noMeds = Array.isArray(meds) && meds.length === 0;

      if (isInter && noDiag && noMeds) {
        setShowConfirm(true);
      }
      setShouldCheckModal(false);
    })();
  }, [consulta, shouldCheckModal, folio]);

  // Guardar diagnóstico y receta
  const handleSave = async ({ diagnostico, medicamentos }) => {
    const resp = await fetch('/api/Surtimientos3/guardarReceta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folioReceta: folio, diagnostico, medicamentos }),
    });
    if (resp.ok) {
      setShowForm(false);
      await getInfoConsulta(folio);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerImage}>
            <Image
              src="/medicamento-banner.png"
              alt="Resurtimiento"
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className={styles.headerOverlay} />
          <div className={styles.headerText}>
            <span className={styles.subtitle}>módulo</span>
            <h2 className={styles.title}>Resurtimiento</h2>
          </div>
        </div>

        {/* TÍTULO */}
        <h1 className={styles.sectionTitle}>Resurtir Medicamento</h1>

        {/* WIDGETS GLASS */}
        <div className={styles.widgetContainer}>
          <div className={styles.controls}>
            <div className={styles.leftControls}>
              <button
                className={styles.btnBack}
                onClick={() => {
                  setFolio('');
                  getInfoConsulta('');
                }}
              >
                Regresar
              </button>
              <input
                type="text"
                className={styles.inputFolio}
                placeholder="Folio de consulta"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
              />
              <button
                className={styles.btnSearch}
                onClick={handleBuscar}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Buscar'}
              </button>
            </div>
            <div className={styles.rightControls}>
              <div className={styles.dateCard}>
                Fecha Actual: {fechaActual}
              </div>
            </div>
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        {/* CARDS DE INFO */}
        {consulta && (
          <>
            <div className={styles.infoCards}>
              <div className={`${styles.infoCard} ${styles.infoCard1}`}>
                <h3>Datos del Empleado</h3>
                <p>
                  <strong>Nombre Completo:</strong> {consulta.nombrepaciente}
                </p>
                <p>
                  <strong>Nómina:</strong> {consulta.clavenomina}
                </p>
              </div>
              <div className={`${styles.infoCard} ${styles.infoCard2}`}>
                <h3>Información del Paciente</h3>
                <p>
                  <strong>Edad:</strong> {consulta.edad} años
                </p>
                <p>
                  <strong>Departamento:</strong> {consulta.departamento}
                </p>
                <p>
                  <strong>Parentesco:</strong> {consulta.parentesco}
                </p>
              </div>
              <div className={`${styles.infoCard} ${styles.infoCard3}`}>
                <h3>Sindicalizado</h3>
                <p>
                  <strong>Status:</strong>{' '}
                  {consulta.elpacienteesempleado ? 'EMPLEADO' : 'EXTERNO'}
                </p>
                <p>
                  <strong>Sindicato:</strong> {consulta.sindicato || 'N/A'}
                </p>
              </div>
            </div>

            {/* ESPECIALISTA + DIAGNÓSTICO */}
            <div className={styles.specialistContainer}>
              <h3>Información del Especialista</h3>
              <p>
                <span className={styles.iconUser} />{' '}
                <strong>Nombre del Médico:</strong> {consulta.nombreproveedor}
              </p>
              <p>
                <span className={styles.iconStethoscope} />{' '}
                <strong>Especialidad:</strong> {consulta.especialidad}
              </p>
              <div className={styles.diagnosisBox}>
                {consulta.diagnostico}
              </div>
            </div>

            {/* TABLA DE RESURTIMIENTOS */}
            <ResurtimientoTable folioReceta={folio} />
          </>
        )}
      </div>

      {/* MODALES */}
      <ModalEspecialidad
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          setShowForm(true);
        }}
      />

      <ModalFormulario
        open={showForm}
        onClose={() => setShowForm(false)}
        folio={folio}
        consulta={consulta}
        onSave={handleSave}
      />
    </div>
  );
}

// Forzar render en server, evita getStaticPaths errors
export async function getServerSideProps() {
  return { props: {} };
}
