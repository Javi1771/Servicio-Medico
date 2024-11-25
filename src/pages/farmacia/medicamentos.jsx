import React, { useState } from "react";
import { useMedicamentos } from "./hooks/useMedicamentos";
import { useMovimientos } from "./hooks/useMovimientos"; // Hook para obtener movimientos
import FormMedicamento from "./components/FormMedicamento";
import MedicamentosTable from "./components/MedicamentosTable";
import MedicamentosChart from "./components/MedicamentosChart";
import MovimientosTable from "./components/MovimientosTable"; // Importa la nueva tabla
import SideMenu from "./components/SideMenu";
import Banner from "./components/banner";
import styles from "../css/EstilosFarmacia/RegisterMedicamento.module.css";

const Medicamentos = () => {
  const { medicamentos, addMedicamento, message } = useMedicamentos();
  const { movimientos, loading, error } = useMovimientos(); // Obtén datos de movimientos
  const [activeView, setActiveView] = useState("registrar");

  return (
    <div className={styles.body}>
      <div className={styles.mainContainer}>
        {/* Menú lateral */}
        <SideMenu onMenuClick={setActiveView} />

        {/* Contenido principal */}
        <div className={styles.content}>
          {/* Banner */}
          <Banner imageSrc="/baner_sjr.png" altText="Banner de Medicamentos" />

          {/* Vistas dinámicas */}
          {activeView === "registrar" && (
            <>
              <FormMedicamento
                onAddMedicamento={addMedicamento}
                message={message}
              />
              <MedicamentosTable medicamentos={medicamentos} />
            </>
          )}

          {activeView === "graficos" && <MedicamentosChart />}

          {activeView === "movimientos" && (
            <MovimientosTable
              movimientos={movimientos}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Medicamentos;
