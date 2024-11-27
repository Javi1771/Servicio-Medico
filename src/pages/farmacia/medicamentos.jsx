import React, { useState } from "react";
import { useMedicamentos } from "../../hooks/useMedicamentos";
import { useMovimientos } from "../../hooks/useMovimientos"; // Hook para obtener movimientos
import FormMedicamento from "./components/formMedicamento";
import MedicamentosTable from "./components/MedicamentosTable";
import MedicamentosChart from "./components/MedicamentosChart";
import MovimientosTable from "./components/MovimientosTable"; // Importa la nueva tabla
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
  const [selectedMedicamento, setSelectedMedicamento] = useState(null); // Estado para el medicamento seleccionado

  const handleEdit = (medicamento) => {
    setSelectedMedicamento(medicamento || {}); // Establece el medicamento seleccionado
    setActiveView("editar"); // Cambia a la vista de edición
  };

  const handleBack = () => {
    setSelectedMedicamento(null); // Limpia el medicamento seleccionado
    setActiveView("registrar"); // Vuelve a la vista de registro
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
            <AnimatePresence mode="wait">
              {/* Vista de Registro */}
              {activeView === "registrar" && (
                <motion.div
                  key="registrar"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                >
                  <FormMedicamento
                    onAddMedicamento={addMedicamento}
                    message={message}
                  />
                  <MedicamentosTable
                    medicamentos={medicamentos || []} // Pasa un array vacío si es undefined
                    onDelete={deleteMedicamento}
                    onEdit={handleEdit} // Llama a handleEdit al hacer clic en "Editar"
                  />
                </motion.div>
              )}

              {/* Vista de Edición */}
              {activeView === "editar" && selectedMedicamento && (
                <motion.div
                  key="editar"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                >
                  <EditMedicamentoForm
                    medicamento={selectedMedicamento}
                    onEdit={(updatedMedicamento) => {
                      editMedicamento(updatedMedicamento); // Llama a la función para editar
                      handleBack(); // Vuelve a la vista de registro
                    }}
                  />
                  <button className={styles.backButton} onClick={handleBack}>
                    Regresar
                  </button>
                </motion.div>
              )}

              {/* Vista de Gráficos */}
              {activeView === "graficos" && (
                <motion.div
                  key="graficos"
                  variants={fadeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.5 }}
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
                  transition={{ duration: 0.5 }}
                >
                  <MovimientosTable
                    movimientos={movimientos}
                    loading={loading}
                    error={error}
                  />
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
