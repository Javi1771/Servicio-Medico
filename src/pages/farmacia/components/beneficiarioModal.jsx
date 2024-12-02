import React from "react";
import { motion, AnimatePresence } from "framer-motion"; // Asegúrate de importar framer-motion
import styles from "../../css/EstilosFarmacia/BeneficiarioModal.module.css";
import Image from "next/image";

// Función para formatear la fecha al formato "día/mes/año"
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Mapeo de valores para interpretar el parentesco
const parentescoMap = {
  1: "Esposo(a)",
  2: "Hijo(a)",
  3: "Concubino(a)",
  4: "Padre",
  5: "Madre",
};

// Función para obtener el color y texto del estatus
const getStatus = (status) => {
  if (status === "I") {
    return { label: "Inactivo", color: "red" };
  } else if (status === "A") {
    return { label: "Activo", color: "green" };
  }
  return { label: "No especificado", color: "gray" };
};

const BeneficiarioModal = ({ beneficiario, onClose }) => {
  if (!beneficiario) return null;

  const { label: statusLabel, color: statusColor } = getStatus(
    beneficiario.ACTIVO
  );

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <button className={styles.modalCloseButton} onClick={onClose}>
            ✕
          </button>

          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>
              Beneficiario:{" "}
              {`${beneficiario.NOMBRE} ${beneficiario.A_PATERNO} ${beneficiario.A_MATERNO}`}
            </h3>
          </div>

          <div className={styles.modalBody}>
            {/* Información del beneficiario */}
            <div className={styles.infoContainer}>
              <div className={styles.infoRow}>
                <p>
                  <strong>Número de Nómina:</strong> {beneficiario.NO_NOMINA}
                </p>
                <p>
                  <strong>Parentesco:</strong>{" "}
                  {parentescoMap[beneficiario.PARENTESCO] || "No especificado"}
                </p>
              </div>
              <div className={styles.infoRow}>
                <p>
                  <strong>Sexo:</strong>{" "}
                  {beneficiario.SEXO === "1" ? "Masculino" : "Femenino"}
                </p>
                <p>
                  <strong>Edad:</strong> {beneficiario.EDAD || "N/A"}
                </p>
              </div>
              <div className={styles.infoRow}>
                <p>
                  <strong>Alergias:</strong>{" "}
                  {beneficiario.ALERGIAS || "Ninguna"}
                </p>
                <p>
                  <strong>Tipo de Sangre:</strong>{" "}
                  {beneficiario.SANGRE || "N/A"}
                </p>
              </div>
              <div className={styles.infoRow}>
                <p>
                  <strong>Discapacitado:</strong>{" "}
                  {beneficiario.ESDISCAPACITADO || "No"}
                </p>
                <p>
                  <strong>Estudiante:</strong>{" "}
                  {beneficiario.ESESTUDIANTE || "No"}
                </p>
              </div>
              <div className={styles.infoRow}>
                <p>
                  <strong>Inicio de Vigencia:</strong>{" "}
                  {formatDate(beneficiario.VIGENCIA_ESTUDIOS_INICIO)}
                </p>
                <p>
                  <strong>Fin de Vigencia:</strong>{" "}
                  {formatDate(beneficiario.VIGENCIA_ESTUDIOS_FIN)}
                </p>
              </div>
              <div className={styles.infoRow}>
                <p>
                  <strong>Enfermedades Crónicas:</strong>{" "}
                  {beneficiario.enfermedades_cronicas || "Ninguna"}
                </p>
                <p>
                  <strong>Tratamientos:</strong>{" "}
                  {beneficiario.tratamientos || "Ninguno"}
                </p>
              </div>
              <div className={styles.infoRow}>
                <p>
                  <strong>Observaciones:</strong>{" "}
                  {beneficiario.observaciones || "N/A"}
                </p>
                <div
                  className={styles.statusBadge}
                  style={{ backgroundColor: statusColor }}
                >
                  {statusLabel}
                </div>
              </div>
            </div>

            {/* Foto del beneficiario alineada a la derecha */}
            {beneficiario.FOTO_URL && (
              <div className={styles.imageContainer}>
                <Image
                  src={beneficiario.FOTO_URL}
                  alt="Foto del Beneficiario"
                  className={styles.beneficiarioPhoto}
                  width={200} // Ajusta el ancho según sea necesario
                  height={200} // Ajusta la altura según sea necesario
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BeneficiarioModal;
