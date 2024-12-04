import React, { useState } from "react";
import { motion } from "framer-motion";
import styles from "../../css/EstilosFarmacia/BeneficiarioModal.module.css";
import SurtirMedicamentoModal from "./registroMedicamentBenef"; // Importa el nuevo componente
import Image from 'next/image'


  
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

const BeneficiarioModal = ({ beneficiario, onClose, medicamentos }) => {
  const [isSurtirModalOpen, setIsSurtirModalOpen] = useState(false);

  if (!beneficiario) return null;

  const handleSurtirClick = () => {
    setIsSurtirModalOpen(true);
  };

  const closeSurtirModal = () => {
    setIsSurtirModalOpen(false);
  };

  // Variants para animaciones
  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <>
      {/* Modal principal */}
      <div className={styles.modalBackdrop}>
        <motion.div
          className={styles.modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeVariants}
          transition={{ duration: 0.3 }}
        >
          <button className={styles.modalCloseButton} onClick={onClose}>
            ✕
          </button>
          <h3 className={styles.modalTitle}>
            Beneficiario:{" "}
            {`${beneficiario.NOMBRE} ${beneficiario.A_PATERNO} ${beneficiario.A_MATERNO}`}
          </h3>

          <div className={styles.modalBody}>
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
                <p>
                  <strong>Estado:</strong>{" "}
                  <span
                    className={`${styles.statusBadge} ${
                      beneficiario.ACTIVO === "A"
                        ? styles.statusActive
                        : styles.statusInactive
                    }`}
                  >
                    {beneficiario.ACTIVO === "A" ? "Activo" : "Inactivo"}
                  </span>
                </p>
              </div>
            </div>
            <div className={styles.imageContainer}>
              <Image
                src={beneficiario.FOTO_URL}
                alt="Foto del Beneficiario"
                className={styles.beneficiarioPhoto}
                width={200}
                height={200}
              />
              <div className={styles.buttonContainer}>
                <button
                  className={styles.surtirButton}
                  onClick={handleSurtirClick}
                >
                  Surtir Medicamento
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de surtir medicamento */}
      <SurtirMedicamentoModal
        isOpen={isSurtirModalOpen}
        onClose={closeSurtirModal}
        medicamentos={medicamentos} // Pasar medicamentos como prop
        beneficiario={beneficiario} // Pasa el beneficiario seleccionado

      />
    </>
  );
};

export default BeneficiarioModal;
