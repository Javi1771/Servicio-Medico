import React from "react";
import { FaRegHandshake, FaTimesCircle } from "react-icons/fa"; // Importamos los iconos
import styles from "../../css/SURTIMIENTOS_ESTILOS/informacionSindicato.module.css";

/**
 * Componente que muestra información del sindicato
 * asociado al empleado/paciente. Si no hay sindicato (null, vacío),
 * indica "No está sindicalizado".
 * @param {string|null} props.sindicato - Nombre o valor del sindicato.
 */
export default function InformacionSindicato({ sindicato }) {
  // Verificamos si está vacío o null/undefined
  const noSindicato =
    !sindicato || (typeof sindicato === "string" && sindicato.trim().length === 0);

  return (
    <div
      className={`${styles.cardSindicato} ${
        noSindicato ? styles.noSindicato : styles.siSindicato
      }`}
    >
      {/* Si NO hay sindicato */}
      {noSindicato ? (
        <>
          <h2 className={styles.titleNo}>
            <FaTimesCircle className={styles.iconNo} />
            Información del Sindicato
          </h2>
          <p className={styles.contentNo}>No está sindicalizado</p>
        </>
      ) : (
        /* Sí hay sindicato */
        <>
          <h2 className={styles.titleSi}>
            <FaRegHandshake className={styles.iconSi} />
            Sindicalizado
          </h2>
          <p className={styles.contentSi}>
            Sindicato: <strong>{sindicato}</strong>
          </p>
        </>
      )}
    </div>
  );
}
