import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../../css/EstilosFarmacia/slideMenu.module.css";
import Image from "next/image";

const SideMenu = ({ onMenuClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter(); // Hook para manejar la redirección

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

  const handleSalir = () => {
    router.replace("/inicio-servicio-medico"); // Redirige al usuario
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
        {/* Logo en la parte superior */}
        <div className={styles.logoContainer}>
          <Image
            src="/Logo_inventarioFarmacia.png" // Ruta al logo
            alt="Logo"
            width={200}
            height={200}
            className={styles.logo}
          />
        </div>

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

        {/* Botón de Salir */}
        <button className={styles.salirbutton} onClick={handleSalir}>
          Salir
        </button>
      </div>
    </>
  );
};

export default SideMenu;
