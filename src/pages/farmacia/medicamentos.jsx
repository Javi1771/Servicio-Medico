import React, { useState } from "react";
import { useMedicamentos } from "../../hooks/farmaciaHook/useMedicamentos";
import FormMedicamento from "./components/formMedicamento";
import MedicamentosTable from "./components/medicamentosTable";
import SideMenu from "./components/sideMenu";
import Banner from "./components/banner";
import styles from "../css/EstilosFarmacia/RegisterMedicamento.module.css";
import EditMedicamentoForm from "./components/editMedicamentoForm";
import { motion, AnimatePresence } from "framer-motion";

const Medicamentos = () => {
  const {
    medicamentos,
    addMedicamento,
    deleteMedicamento,
    editMedicamento,
    message,
  } = useMedicamentos();

  const [activeView, setActiveView] = useState("registrar");
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closingModal, setClosingModal] = useState(false);

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
          <Banner imageSrc="/baner_sjr.png" altText="Banner de Medicamentos" />

          <div className={styles.container}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Medicamentos;
