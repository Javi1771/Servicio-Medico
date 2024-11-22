import React, { useState } from "react";
import { useMedicamentos } from "./hooks/useMedicamentos";
import FormMedicamento from "./components/FormMedicamento";
import MedicamentosTable from "./components/MedicamentosTable";
import SideMenu from "./components/SideMenu";
import Banner from "./components/banner";
import styles from "../css/EstilosFarmacia/RegisterMedicamento.module.css";

const Medicamentos = () => {
  const { medicamentos, addMedicamento, message } = useMedicamentos();
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

          {/* Vista seleccionada */}
          {activeView === "registrar" && (
            <>
              <FormMedicamento
                onAddMedicamento={addMedicamento}
                message={message}
              />
              <MedicamentosTable medicamentos={medicamentos} />
            </>
          )}
          {activeView === "graficos" && <div>Gráficos próximamente...</div>}
        </div>
      </div>
    </div>
  );
};

export default Medicamentos;
