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

const MySwal = withReactContent(Swal);
const successSound = "/assets/applepay.mp3";
const errorSound   = "/assets/error.mp3";

const playSound = (isSuccess) => {
  const audio = new Audio(isSuccess ? successSound : errorSound);
  audio.play();
};

const showSuccessAlert = (title, message) => {
  playSound(true);
  return MySwal.fire({
    icon: "success",
    title: (
      <span style={{ color: "#00e676", fontWeight: "bold", fontSize: "1.5em" }}>
        {title}
      </span>
    ),
    html: (
      <p style={{ color: "#fff", fontSize: "1.1em" }}>
        {message}
      </p>
    ),
    background: "linear-gradient(145deg, #004d40, #00251a)",
    confirmButtonColor: "#00e676",
    confirmButtonText: "<b>Aceptar</b>",
    customClass: {
      popup:
        "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
    },
  });
};

const showErrorAlert = (title, message) => {
  playSound(false);
  return MySwal.fire({
    icon: "error",
    title: (
      <span style={{ color: "#ff1744", fontWeight: "bold", fontSize: "1.5em" }}>
        {title}
      </span>
    ),
    html: (
      <p style={{ color: "#fff", fontSize: "1.1em" }}>
        {message}
      </p>
    ),
    background: "linear-gradient(145deg, #4a0000, #220000)",
    confirmButtonColor: "#ff1744",
    confirmButtonText: "<b>Aceptar</b>",
    customClass: {
      popup:
        "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
    },
  });
};

export default function Login() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const userTrim = usuario.trim();
    if (!userTrim || !password) {
      return showErrorAlert("Campos incompletos", "Por favor completa todos los campos.");
    }
    if (userTrim.length < 3) {
      return showErrorAlert("Usuario muy corto", "Debe tener al menos 3 caracteres.");
    }
    if (password.length < 3) {
      return showErrorAlert("Contraseña muy corta", "Debe tener al menos 3 caracteres.");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/loginApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario: userTrim, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return showErrorAlert("Error", data.message || "Algo salió mal");
      }
      if (data.success) {
        await showSuccessAlert("¡Bienvenido!", "Redirigiendo...");
        router.replace("/inicio-servicio-medico");
      } else if (data.message.toLowerCase().includes("usuario")) {
        showErrorAlert("Usuario no encontrado", "Verifica tus datos.");
      } else if (data.message.toLowerCase().includes("contraseña")) {
        showErrorAlert("Contraseña incorrecta", "Vuelve a intentarlo.");
      } else {
        showErrorAlert("Error desconocido", "Intenta nuevamente más tarde.");
      }
    } catch (err) {
      console.error(err);
      showErrorAlert("Conexión fallida", "No se pudo conectar al servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    maxWidth: "400px",
    height: "48px",
    border: "1px solid rgb(255, 255, 255)",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.2)",
  };

  const inputStyle = {
    flex: 1,
    height: "100%",
    border: "none",
    background: "transparent",
    color: "#fff",
    paddingLeft: "10px",
    outline: "none",
  };

  const eyeButtonStyle = {
    marginRight: "10px",
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontSize: "1.2em",
  };

  return (
    <div className={styles.body}>
      <div className={styles.formContainer}>
        <div className={styles.imageContainer}>
          <Image
            src="/login_servicio_medico.png"
            alt="Imagen de login"
            width={550}
            height={520}
            className={styles.image}
          />
        </div>

        <div className={styles.formSection}>
          <h1 className={styles.formTitle}>Bienvenido, Inicia Sesión</h1>

          {/* <-- Añadimos method="POST" para evitar GET en la URL -->
           */}
          <form
            onSubmit={handleLogin}
            method="POST"
            className={styles.form}
          >
            <label className="block mb-2 text-lg font-semibold text-white">
              Usuario
            </label>
            <div className={styles.inputContainer} style={containerStyle}>
              <FaUser style={{ marginLeft: "10px" }} />
              <input
                name="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                className={styles.input}
                style={inputStyle}
              />
            </div>

            <label className="block mt-6 mb-2 text-lg font-semibold text-white">
              Contraseña
            </label>
            <div className={styles.inputContainer} style={containerStyle}>
              <FaLock style={{ marginLeft: "10px" }} />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className={styles.input}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Mostrar / ocultar contraseña"
                style={eyeButtonStyle}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.button} ${isSubmitting ? styles.buttonDisabled : ""}`}
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
}
