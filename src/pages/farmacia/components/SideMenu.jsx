import React, { useState, useEffect } from "react";
import styles from "../../css/EstilosFarmacia/slideMenu.module.css";

const SideMenu = ({ onMenuClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Detecta si la ventana es lo suficientemente grande para ser "desktop"
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Ejecuta al cargar y cuando la ventana cambia de tamaño
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // Limpia el listener cuando el componente se desmonta
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      {/* Botón de hamburguesa para pantallas pequeñas */}
      {!isDesktop && (
        <button
          className={`${styles.hamburgerButton} ${menuOpen ? styles.open : ""}`}
          onClick={toggleMenu}
        >
          <span className={styles.line}></span>
          <span className={styles.line}></span>
          <span className={styles.line}></span>
        </button>
      )}

      {/* Menú lateral */}
      <div
        className={`${styles.sideMenu} ${
          menuOpen || isDesktop ? "" : styles.hidden
        }`}
      >
        <button
          className={styles.menuButton}
          onClick={() => {
            onMenuClick("registrar");
            setMenuOpen(false); // Cierra el menú al seleccionar una opción
          }}
        >
          Registrar Medicamento
        </button>
        <button
          className={styles.menuButton}
          onClick={() => {
            onMenuClick("graficos");
            setMenuOpen(false); // Cierra el menú al seleccionar una opción
          }}
        >
          Gráficos
        </button>
      </div>
    </>
  );
};

export default SideMenu;
