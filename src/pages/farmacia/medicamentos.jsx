/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCalendarAlt } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useRouter } from "next/router";

import { useMedicamentos } from "../../hooks/farmaciaHook/useMedicamentos";
import FormMedicamento from "./components/formMedicamento";
import MedicamentosTable from "./components/medicamentosTable";
import SideMenu from "./components/sideMenu";
import Banner from "./components/banner";
import EditMedicamentoForm from "./components/editMedicamentoForm";
import styles from "../css/EstilosFarmacia/RegisterMedicamento.module.css";
import { motion, AnimatePresence } from "framer-motion";

//* Función para obtener el valor de una cookie
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
};

const MySwal = withReactContent(Swal);

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
  const [role, setRole] = useState(null);
  const router = useRouter();

  //* Al montar el componente, obtenemos el rol desde la cookie "rol"
  useEffect(() => {
    const rolCookie = getCookie("rol");
    setRole(rolCookie);
  }, []);

  const handleEdit = (medicamento) => {
    setSelectedMedicamento(medicamento || {});
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedMedicamento(null);
    setIsModalOpen(false);
  };

  const handleRegresar = () => {
    router.back();
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className={styles.body}>
      <div className={styles.mainContainer}>
        {/* Mostrar el menú lateral solo si el rol NO es 9 */}
        {role !== "9" && <SideMenu onMenuClick={setActiveView} />}

        <div className={styles.content}>
          <Banner imageSrc="/baner_sjr.png" altText="Banner de Medicamentos" />

          <div className={styles.container}>
            {role !== "9" ? (
              activeView === "registrar" && (
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
              )
            ) : (
              <div className="flex justify-center items-center w-full">
                <MedicamentosTable
                  medicamentos={medicamentos || []}
                  onDelete={deleteMedicamento}
                  onEdit={handleEdit}
                />
              </div>
            )}
          </div>
        </div>
      </div>

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
  );
};

export default Medicamentos;
