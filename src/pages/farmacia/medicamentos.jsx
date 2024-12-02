import React, { useState, useEffect } from "react";
import { useMedicamentos } from "../../hooks/useMedicamentos";
import { useMovimientos } from "../../hooks/useMovimientos";
import FormMedicamento from "./components/formMedicamento";
import MedicamentosTable from "./components/medicamentosTable";
import MedicamentosChart from "./components/medicamentosChart";
import MovimientosTable from "./components/movimientosTable";
import SideMenu from "./components/sideMenu";
import Banner from "./components/banner";
import styles from "../css/EstilosFarmacia/RegisterMedicamento.module.css";
import EditMedicamentoForm from "./components/editMedicamentoForm";
import { motion, AnimatePresence } from "framer-motion";
import SurtirBeneficiario from "./components/surtirBeneficiario";
import BeneficiarioModal from "./components/beneficiarioModal";

const Medicamentos = () => {
  const {
    medicamentos,
    addMedicamento,
    deleteMedicamento,
    editMedicamento,
    message,
  } = useMedicamentos();

  const { movimientos, loading, error } = useMovimientos();
  const [activeView, setActiveView] = useState("registrar");
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closingModal, setClosingModal] = useState(false);

  // Estado para beneficiarios y modales relacionados
  const [setBeneficiarios] = useState([]);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState(null);

  useEffect(() => {
    if (activeView === "surtirBeneficiario") {
      fetch("/api/farmacia/getBeneficiario_farmacia")
        .then((response) => response.json())
        .then((data) => setBeneficiarios(data))
        .catch((error) =>
          console.error("Error al cargar beneficiarios:", error)
        );
    }
  }, [activeView, setBeneficiarios]);

  const handleRowClick = (beneficiario) => {
    setSelectedBeneficiario(beneficiario);
  };

  const handleEdit = (medicamento) => {
    setSelectedMedicamento(medicamento || {});
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedMedicamento(null);
    setIsModalOpen(false);
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className={styles.body}>
      <div className={styles.mainContainer}>
        {/* Menú lateral */}
        <SideMenu onMenuClick={setActiveView} />

        {/* Contenido principal */}
        <div className={styles.content}>
          {/* Banner */}
          <Banner imageSrc="/baner_sjr.png" altText="Banner de Medicamentos" />

          <div className={styles.container}>
            {/* Vista de Registro */}
            {activeView === "registrar" && (
              <motion.div
                key="registrar"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <FormMedicamento
                  onAddMedicamento={addMedicamento}
                  message={message}
                />
                <MedicamentosTable
                  medicamentos={medicamentos || []}
                  onDelete={deleteMedicamento}
                  onEdit={handleEdit}
                />
              </motion.div>
            )}

            {/* Modal para editar medicamento */}
            <AnimatePresence mode="wait">
              {isModalOpen && (
                <motion.div
                  className={styles.modalBackdrop}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onAnimationComplete={() => {
                    if (closingModal) {
                      setIsModalOpen(false);
                      setClosingModal(false);
                    }
                  }}
                >
                  <motion.div
                    className={styles.modalContent}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EditMedicamentoForm
                      medicamento={selectedMedicamento}
                      onEdit={(updatedMedicamento) => {
                        editMedicamento(updatedMedicamento);
                        handleModalClose();
                      }}
                      onCancel={handleModalClose}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vista de Gráficos */}
            {activeView === "graficos" && (
              <motion.div
                key="graficos"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <MedicamentosChart />
              </motion.div>
            )}

            {/* Vista de Movimientos */}
            {activeView === "movimientos" && (
              <motion.div
                key="movimientos"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <MovimientosTable
                  movimientos={movimientos}
                  loading={loading}
                  error={error}
                />
              </motion.div>
            )}

            {/* Vista de Surtir a Beneficiario */}
            {activeView === "surtirBeneficiario" && (
              <motion.div
                key="surtirBeneficiario"
                variants={fadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <SurtirBeneficiario onRowClick={handleRowClick} />
              </motion.div>
            )}
          </div>

          {/* Modal para el beneficiario seleccionado */}
          {selectedBeneficiario && (
            <BeneficiarioModal
              beneficiario={selectedBeneficiario}
              onClose={() => setSelectedBeneficiario(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Medicamentos;
