import React from "react";
import styles from "../../css/SURTIMIENTOS_ESTILOS/informacionSindicato.module.css";

const InformacionSindicato = ({ sindicato }) => {
  if (!sindicato) return null;

  const estadoSindicato = sindicato.cuotaSindical === "S" ? "Sindicalizado" : "No sindicalizado";

  // Obtener el tipo de sindicato basado en el grupoNomina y cuotaSindical
  const tipoSindicato =
    sindicato.cuotaSindical === "S"
      ? sindicato.grupoNomina === "NS"
        ? "SUTSMSJR"
        : "SITAM"
      : "No aplica";

  // Determinar estilos dinámicos
  const cardClassName =
    estadoSindicato === "Sindicalizado"
      ? styles.sindicatoCardSindicalizado
      : styles.sindicatoCardNoSindicalizado;

  return (
    <div className={`${styles.sindicatoCard} ${cardClassName}`}>
      <h2 className={styles.sindicatoTitle}>Sindicato</h2>
      <p>
        <strong>Estado:</strong> {estadoSindicato}
      </p>
      <p>
        <strong>Tipo:</strong> {tipoSindicato}
      </p>
    </div>
  );
};

export default InformacionSindicato;
