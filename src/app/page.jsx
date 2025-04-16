"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import styles from "../pages/css/login.module.css";
import "../styles/globals.css";

//* Define las rutas de los sonidos de éxito y error
const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

//! Reproduce un sonido de éxito/error
const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

//* Manejo de SweetAlert2
const MySwal = withReactContent(Swal);

//* Alertas de éxito con estilo personalizado
const showSuccessAlert = (title, message) => {
  playSound(true);
  MySwal.fire({
    icon: "success",
    title: `<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>${title}</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
    background: "linear-gradient(145deg, #004d40, #00251a)",
    confirmButtonColor: "#00e676",
    confirmButtonText: "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup: "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
    },
  });
};

//! Alertas de error con estilo personalizado
const showErrorAlert = (title, message) => {
  playSound(false);
  MySwal.fire({
    icon: "error",
    title: `<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>${title}</span>`,
    html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
    background: "linear-gradient(145deg, #4a0000, #220000)",
    confirmButtonColor: "#ff1744",
    confirmButtonText: "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
    customClass: {
      popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
    },
  });
};

const Login = () => {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //* Maneja la lógica de envío de formulario
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    //* Por si deseas estandarizar el usuario en minúsculas para hacer una comparación
    //* const normalizedUser = usuario.trim().toLowerCase();

    //* Validaciones básicas
    if (!usuario || !password) {
      showErrorAlert(
        "Campos incompletos",
        "Por favor, completa todos los campos."
      );
      return;
    }

    //* Ejemplo: validación de longitud mínima
    if (usuario.length < 3) {
      showErrorAlert(
        "Usuario demasiado corto",
        "El usuario debe tener al menos 3 caracteres."
      );
      return;
    }

    if (password.length < 8) {
      showErrorAlert(
        "Contraseña demasiado corta",
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    //* Aquí podrías hacer más validaciones, por ejemplo:
    //* - Verificar si usuario usa mayúsculas donde no corresponde
    //* - Chequear un formato de correo, etc.

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/loginApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccessAlert(
          "¡Bienvenido!",
          "Inicio de sesión exitoso. Redirigiendo..."
        );
        //* Guarda la cookie de autenticación, según tu lógica
        document.cookie = `auth=true; path=/;`;
        router.replace("/inicio-servicio-medico");
      } else if (data.message === "Usuario no encontrado") {
        showErrorAlert(
          "Usuario no encontrado",
          "El usuario ingresado no existe. Verifica tus datos."
        );
      } else if (data.message === "Contraseña incorrecta") {
        showErrorAlert(
          "Contraseña incorrecta",
          "La contraseña ingresada no es válida."
        );
      } else {
        showErrorAlert(
          "Error desconocido",
          "Ocurrió un problema inesperado, por favor intenta más tarde.<br/><br/>Revisa tu usuario y contraseña y verifica que sean correctos."
        );        
      }
    } catch (error) {
      console.error(error);
      showErrorAlert(
        "Problema de conexión",
        "No se pudo conectar al servidor. Intente nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.body}>
      <div className={styles.formContainer}>
        {/* Imagen lateral / Logo */}
        <div className={styles.imageContainer}>
          <Image
            src="/login_servicio_medico.png"
            alt="Imagen de login"
            width={550}
            height={520}
            className={styles.image}
          />
        </div>

        {/* Sección de formulario */}
        <div className={styles.formSection}>
          <h1 className={styles.formTitle}>Bienvenido, Inicia Sesión</h1>
          <form onSubmit={handleLogin} className={styles.form}>
            <label className="block mb-2 text-lg font-semibold text-white">
              Usuario
            </label>
            <div
              className={styles.inputContainer}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                maxWidth: "400px",
                height: "48px",
                border: "1px solid rgb(255, 255, 255)",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <FaUser style={{ marginLeft: "10px" }} />
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className={styles.input}
                placeholder="Ingresa tu usuario"
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  color: "#fff",
                  paddingLeft: "10px",
                  outline: "none",
                }}
              />
            </div>

            <label className="block mt-6 mb-2 text-lg font-semibold text-white">
              Contraseña
            </label>
            <div
              className={styles.inputContainer}
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                maxWidth: "400px",
                height: "48px",
                border: "1px solid rgb(255, 255, 255)",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <FaLock style={{ marginLeft: "10px" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="Ingresa tu contraseña"
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  background: "transparent",
                  color: "#fff",
                  paddingLeft: "10px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar / ocultar contraseña"
                style={{
                  marginRight: "10px",
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "1.2em",
                }}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${
                isSubmitting ? styles.buttonDisabled : ""
              }`}
              style={{
                marginTop: "2rem",
                padding: "12px 24px",
                borderRadius: "8px",
                border: "none",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Procesando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
