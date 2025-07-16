/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/capturas/surtimientos3.jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useGetInfoConsulta } from "../../hooks/Surtimientos3/useGetInfoConsulta";
import ResurtimientoTable from "./components3/ResurtimientoTable";
import { ModalEspecialidad } from "./components3/ModalEspecialidad";
import { ModalFormulario } from "./components3/ModalFormulario";
import styles from "../css/surtimientos3/Surtimiento3Module.module.css";
import Image from "next/image";

export default function Surtimientos3() {
  const router = useRouter();
  const [folio, setFolio] = useState("");
  const [fechaActual, setFechaActual] = useState("");
  const {
    data: consulta,
    error,
    loading,
    getInfoConsulta,
  } = useGetInfoConsulta();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [shouldCheckModal, setShouldCheckModal] = useState(false);

  /* 🔸 nuevo estado para detectar ausencia de medicamentos */
  const [noMeds, setNoMeds] = useState(false);

  // Fecha actual
  useEffect(() => {
    const ahora = new Date();
    setFechaActual(
      `${ahora.getDate()}/${ahora.getMonth() + 1}/${ahora.getFullYear()}`
    );
  }, []);

  // Acción Buscar
  const handleBuscar = async () => {
    setShowConfirm(false);
    setShowForm(false);
    setShouldCheckModal(true);
    await getInfoConsulta(folio);
  };

  const handleBack = () => {
    setFolio("");
    getInfoConsulta("");
    router.push("/inicio-servicio-medico");
  };

  /* 🔸 Al llegar la consulta, revisa si hay medicamentos registrados      */
  useEffect(() => {
    if (!consulta || !folio) {
      setNoMeds(false);
      return;
    }
    (async () => {
      try {
        const { items } = await fetch(
          `/api/Surtimientos3/getMedicamentosResurtir?folioReceta=${encodeURIComponent(
            folio
          )}`
        ).then((r) => r.ok ? r.json() : { items: [] });
        setNoMeds(!items || items.length === 0);
      } catch {
        setNoMeds(false); // en caso de error, no bloquea la tabla
      }
    })();
  }, [consulta, folio]);

  // Detectar interconsulta sin diagnóstico ni meds → modal especialidad
  useEffect(() => {
    if (!shouldCheckModal || !consulta) return;
    (async () => {
      const res = await fetch(
        `/api/Surtimientos3/Valida-Caso2?folioReceta=${encodeURIComponent(
          folio
        )}`
      );
      const meds = await res.json();
      const isInter = Boolean(consulta.especialidadinterconsulta);
      const noDiag = !consulta.diagnostico;
      const noMedsCase2 = Array.isArray(meds) && meds.length === 0;
      if (isInter && noDiag && noMedsCase2) {
        setShowConfirm(true);
      }
      setShouldCheckModal(false);
    })();
  }, [consulta, shouldCheckModal, folio]);

  // Guardar diagnóstico + recetas
  const handleSave = async ({ diagnostico, medicamentos }) => {
    const resp = await fetch("/api/Surtimientos3/guardarReceta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folioReceta: folio, diagnostico, medicamentos }),
    });
    if (resp.ok) {
      setShowForm(false);
      await getInfoConsulta(folio);
    }
  };

  const handleGenerate = async () => {
    if (!consulta) return;

    try {
      // 1) Traer la información completa incluyendo el escenario
      const { items, isInterconsulta, esPrimerSurtimiento, tipoEscenario } = await fetch(
        `/api/Surtimientos3/getMedicamentosResurtir?folioReceta=${encodeURIComponent(
          folio
        )}`
      ).then((r) => {
        if (!r.ok) throw new Error(`getMedicamentosResurtir: ${r.status}`);
        return r.json();
      });

      console.log("🔍 Items recibidos de getMedicamentosResurtir:", items);
      console.log("🎯 Escenario detectado para PDF:", tipoEscenario);

      // 2) Mapear al formato que espera tu API
      const medsParaDetalle = items.map((m) => ({
        descMedicamento: m.clavemedicamento,
        indicaciones: m.indicaciones,
        cantidad: m.cantidad === "0" || !m.cantidad 
          ? `DURANTE ${m.cantidadMeses * 30} DÍAS` // ✅ SOLUCIÓN TEMPORAL: generar texto si cantidad es "0"
          : m.cantidad,
        piezas: String(m.piezas),
      }));

      console.log("🔍 Medicamentos mapeados para detalle:", medsParaDetalle);

      // 3) Obtener un claveUsuario válido (number)
      const userId = parseInt(consulta.claveusuario, 10) || 1;

      // 4) Normalizar el objeto consulta con keys en minúsculas
      const consultaPayload = {
        clavenomina: (consulta.clavenomina || "").trim(),
        clavepaciente:
          consulta.clavepaciente === null ||
          typeof consulta.clavepaciente === "undefined"
            ? null
            : String(consulta.clavepaciente).trim(),
        nombrepaciente: (consulta.nombrepaciente || "").trim(),
        edad: (consulta.edad || "").trim(),
        epacienteEsEmpleado:
          consulta.elpacienteesempleado === null ||
          typeof consulta.elpacienteesempleado === "undefined"
            ? null
            : String(consulta.elpacienteesempleado).trim(),
        claveproveedor:
          consulta.claveproveedor === null ||
          typeof consulta.claveproveedor === "undefined"
            ? null
            : String(consulta.claveproveedor),
        diagnostico: (consulta.diagnostico || "").trim(),
        departamento: (consulta.departamento || "").trim(),
        sindicato: (consulta.sindicato || "").trim(),
      };

      const payload = {
        folioReceta: folio,
        consulta: consultaPayload,
        medicamentos: medsParaDetalle,
        claveUsuario: userId,
      };
      console.log("🔜 Payload generarSurtimiento:", payload);

      // 5) Llamar a tu API de generarSurtimiento
      const resp = await fetch("/api/Surtimientos3/generarSurtimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("🔙 Status generarSurtimiento:", resp.status);
      const data = await resp.json();
      console.log("🔙 Response generarSurtimiento:", data);

      if (!resp.ok) {
        throw new Error(data.error || "Error al generar surtimiento");
      }

      // 6) Redirigir al PDF con el nuevo folio Y la información del escenario
      const { folioSurtimiento } = data;
      const claveConsulta64 = btoa(String(consulta.claveconsulta));
      
      // ✅ PASAR EL ESCENARIO AL PDF VÍA URL
      const urlParams = new URLSearchParams({
        claveconsulta: claveConsulta64,
        escenario: tipoEscenario,
        esPrimerSurtimiento: esPrimerSurtimiento.toString(),
        isInterconsulta: isInterconsulta.toString()
      });
      
      router.push(`/capturas/components3/GenerarRecetaFarmacia?${urlParams.toString()}`);
    } catch (error) {
      console.error("❌ Error en handleGenerate:", error);
      alert(`Error al generar surtimiento: ${error.message}`);
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
              <button className={styles.btnBack} onClick={handleBack}>
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
                {loading ? "Cargando..." : "Buscar"}
              </button>
            </div>
            <div className={styles.rightControls}>
              <div className={styles.dateCard}>Fecha Actual: {fechaActual}</div>
            </div>
          </div>
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        {/* INFO CARDS */}
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
                  <strong>Edad:</strong> {consulta.edad}
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
                  <strong>Status:</strong>{" "}
                  {consulta.elpacienteesempleado ? "EMPLEADO" : "EXTERNO"}
                </p>
                <p>
                  <strong>Sindicato:</strong> {consulta.sindicato || "N/A"}
                </p>
              </div>
            </div>

            {/* ESPECIALISTA + DIAGNÓSTICO */}
            <div className={styles.specialistContainer}>
              <h3>Información del Especialista</h3>
              <p>
                <span className={styles.iconUser} />{" "}
                <strong>Nombre del Médico:</strong> {consulta.nombreproveedor}
              </p>
              <p>
                <span className={styles.iconStethoscope} />{" "}
                <strong>Especialidad:</strong> {consulta.especialidad}
              </p>
              <div className={styles.diagnosisBox}>{consulta.diagnostico}</div>
            </div>

            {/* TABLA DE RESURTIMIENTOS O ALERTA */}
            {noMeds ? (
              <div className={styles.alertNoMeds}>
                <p>
                  <strong>⚠️ Sin medicamentos registrados.</strong> Verifique si
                  el paciente ya acudió a farmacia por el primer surtimiento.
                </p>
              </div>
            ) : (
              <ResurtimientoTable folioReceta={folio} />
            )}

            {/* BOTÓN GENERAR SURTIMIENTO */}
            <div className="text-center mt-6">
              <button className={styles.generateBtn} onClick={handleGenerate}>
                Generar Resurtimiento
              </button>
            </div>
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

// Evita getStaticPaths errors
export async function getServerSideProps() {
  return { props: {} };
}