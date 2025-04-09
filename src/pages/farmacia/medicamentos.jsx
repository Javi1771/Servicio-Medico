import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { useMedicamentos } from "../../hooks/farmaciaHook/useMedicamentos";
import FormMedicamento from "./components/formMedicamento";
import MedicamentosTable from "./components/medicamentosTable";
import SideMenu from "./components/SideMenu";
import EditMedicamentoForm from "./components/editMedicamentoForm";
import { motion, AnimatePresence } from "framer-motion";

// Función auxiliar para leer cookies en el cliente
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
};

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

  useEffect(() => {
    const rolCookie = getCookie("rol");
    setRole(rolCookie);
  }, []);

  // Cuando hacemos clic en "Editar" en la tabla, abrimos el modal
  const handleEdit = (medicamento) => {
    // medicamento ya incluye "precio", "medicamento", "piezas", etc.
    setSelectedMedicamento(medicamento || {});
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedMedicamento(null);
    setIsModalOpen(false);
  };

  const handleSalir = () => {
    router.replace("/inicio-servicio-medico");
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#040f0f] to-[#0c1e1e] text-teal-200">
      <div className="flex flex-col lg:flex-row">
        {/* Menú lateral (lo ocultamos si rol === "9") */}
        {role !== "9" && (
          <div className="lg:w-64 flex-none bg-[#0b2424] shadow-xl border border-teal-500">
            <SideMenu onMenuClick={setActiveView} />
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-grow relative">
          {/* Botón de salida */}
          <button
            onClick={handleSalir}
            className="absolute top-4 left-4 flex items-center gap-2 px-6 py-3 
                       bg-gradient-to-r from-teal-500 to-cyan-500 
                       hover:from-teal-600 hover:to-cyan-600 
                       text-white font-extrabold uppercase 
                       tracking-wide rounded-full shadow-2xl 
                       transition-transform duration-300 
                       transform hover:scale-105 
                       focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
            Salir
          </button>

          {/* Contenedor centrado con padding */}
          <div className="container mx-auto px-4 py-6">
            {/* Si rol !== "9", mostramos el formulario y la tabla */}
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
                  <div className="flex flex-col gap-8">
                    {/* Formulario para registrar medicamento */}
                    <div className="bg-[#0b2424] p-6 rounded-2xl shadow-[0_0_40px_rgba(0,255,255,0.2)] border border-teal-500">
                      <FormMedicamento
                        onAddMedicamento={addMedicamento}
                        message={message}
                      />
                    </div>

                    {/* Tabla de medicamentos */}
                    <div className="bg-[#0b2424] p-6 rounded-2xl shadow-[0_0_40px_rgba(0,255,255,0.2)] border border-teal-500">
                      <MedicamentosTable
                        medicamentos={medicamentos || []}
                        onDelete={deleteMedicamento}
                        onEdit={handleEdit}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            ) : (
              // Si rol === "9", solo la tabla
              <div className="bg-[#0b2424] p-6 rounded-2xl shadow-[0_0_40px_rgba(0,255,255,0.2)] border border-teal-500">
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
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50"
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
              className="bg-[#0b2424] text-teal-200 p-8 rounded-2xl shadow-2xl border border-teal-500"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {/* Dentro de EditMedicamentoForm ya gestionas 'precio' */}
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
