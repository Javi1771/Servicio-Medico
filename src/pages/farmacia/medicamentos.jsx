import React, { useState } from "react";
import { useMedicamentos } from "../../hooks/useMedicamentos";
import { useMovimientos } from "../../hooks/useMovimientos"; // Hook para obtener movimientos
import FormMedicamento from "./components/formMedicamento";
import MedicamentosTable from "./components/medicamentosTable";
import MedicamentosChart from "./components/medicamentosChart";
import MovimientosTable from "./components/movimientosTable"; // Importa la nueva tabla
import SideMenu from "./components/sideMenu";
import Banner from "./components/banner";
import styles from "../css/EstilosFarmacia/RegisterMedicamento.module.css";
import EditMedicamentoForm from "./components/editMedicamentoForm"; // Importa el formulario de edición
import { motion, AnimatePresence } from "framer-motion"; // Importa framer-motion

const Medicamentos = () => {
  const {
    medicamentos,
    addMedicamento,
    deleteMedicamento,
    editMedicamento,
    message,
  } = useMedicamentos(); // Incluye editMedicamento

  const { movimientos, loading, error } = useMovimientos(); // Obtén datos de movimientos
  const [activeView, setActiveView] = useState("registrar");
  const [selectedMedicamento, setSelectedMedicamento] = useState(null); // Medicamento seleccionado
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla si el modal está abierto
  const [closingModal, setClosingModal] = useState(false); // Nuevo estado para controlar el cierre


  const handleEdit = (medicamento) => {
    setSelectedMedicamento(medicamento || {}); // Establece el medicamento seleccionado
    setIsModalOpen(true); // Abre el modal
  };

  // Cierra el modal y limpia el estado
  const handleModalClose = () => {
    setSelectedMedicamento(null); // Limpia el medicamento seleccionado
    setIsModalOpen(false); // Cierra el modal
  };
  
  

  // Variants para animaciones
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
                    onEdit={handleEdit} // Abre el modal al editar
                  />
                </motion.div>
              )}

              {/* Modal para editar */}
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
                      setIsModalOpen(false); // Cierra el modal completamente
                      setClosingModal(false); // Resetea el estado de cierre
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
                      onCancel={handleModalClose} // Cierra el modal al cancelar
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Medicamentos;
