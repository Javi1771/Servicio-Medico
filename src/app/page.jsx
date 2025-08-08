"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Image from "next/image";

import styles from "../pages/css/login.module.css";
import "../styles/globals.css";
import { showCustomAlert } from "../utils/alertas";

export default function Login() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const usuarioRef = useRef(null);
  const passwordRef = useRef(null);

  //* Sincronizar con autocompletado del navegador
  useEffect(() => {
    const timer = setTimeout(() => {
      if (usuarioRef.current?.value && passwordRef.current?.value) {
        setUsuario(usuarioRef.current.value);
        setPassword(passwordRef.current.value);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Iniciando proceso de login");

    if (isSubmitting) {
      console.log("Login ya en proceso, ignorando clic");
      return;
    }

    //! Bloquear después de 5 intentos fallidos
    if (attempts >= 5) {
      await showCustomAlert(
        "Demasiados intentos",
        "Por favor espera 1 minuto antes de volver a intentar."
      );
      return;
    }

    const userTrim = usuario.trim();
    const passTrim = password.trim();

    if (!userTrim || !passTrim) {
      await showCustomAlert(
        "error",
        "Campos incompletos",
        "Por favor completa todos los campos.",
        "Aceptar"
      );
      return;
    }

    if (userTrim.length < 3 || userTrim.length > 20) {
      await showCustomAlert(
        "error",
        "Usuario inválido",
        "Debe tener entre 3 y 20 caracteres.",
        "Aceptar"
      );
      return;
    }

    setIsSubmitting(true);
    console.log("Enviando solicitud de login...");

    try {
      const res = await fetch("/api/loginApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usuario: userTrim, password: passTrim }),
      });

      console.log("Respuesta recibida:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `Error en la solicitud: ${res.status}`
        );
      }

      const data = await res.json();
      console.log("Datos de respuesta:", data);

      if (data.success) {
        console.log("Login exitoso, mostrando alerta...");
        //* Mostrar alerta pero no esperar a que se cierre
        await showCustomAlert(
          "success",
          "¡Bienvenido!",
          "Redirigiendo...",
          "Aceptar"
        )
          .then(() => {
            console.log("Alerta cerrada, redirigiendo...");
            router.replace("/inicio-servicio-medico").catch((err) => {
              console.error("Error en router.replace:", err);
              window.location.href = "/inicio-servicio-medico";
            });
          })
          .catch((alertErr) => {
            console.error("Error mostrando alerta:", alertErr);
            router.replace("/inicio-servicio-medico");
          });
      } else {
        console.log("Login fallido, aumentando intentos...");
        setAttempts((prev) => prev + 1);
        if (data.message.toLowerCase().includes("usuario")) {
          await showCustomAlert(
            "error",
            "Usuario no encontrado",
            "Verifica tus datos.",
            "Aceptar"
          );
        } else if (
          data.message.toLowerCase().includes("contraseña") ||
          data.message.toLowerCase().includes("credenciales")
        ) {
          await showCustomAlert(
            "error",
            "Contraseña incorrecta",
            "Vuelve a intentarlo.",
            "Aceptar"
          );
        } else {
          await showCustomAlert(
            "error",
            "Error desconocido",
            "Intenta nuevamente más tarde.",
            "Aceptar"
          );
        }
      }
    } catch (err) {
      console.error("Error en el login:", err);
      setAttempts((prev) => prev + 1);

      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        await showCustomAlert(
          "error",
          "Error de conexión",
          "No se pudo conectar al servidor. Intenta de nuevo.",
          "Aceptar"
        );
      } else {
        await showCustomAlert(
          "error",
          "Error",
          err.message || "Ocurrió un error inesperado",
          "Aceptar"
        );
      }
    } finally {
      console.log("Finalizando proceso de login");
      setIsSubmitting(false);
    }
  };

  //* Prevenir recarga al presionar Enter en campos vacíos
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (!usuario.trim() || !password.trim())) {
      e.preventDefault();
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
            priority
          />
        </div>

        <div className={styles.formSection}>
          <h1 className={styles.formTitle}>Bienvenido, Inicia Sesión</h1>

          <form onSubmit={handleLogin} method="POST" className={styles.form}>
            <label
              htmlFor="usuario-input"
              className="block mb-2 text-lg font-semibold text-white"
            >
              Usuario
            </label>
            <div className={styles.inputContainer} style={containerStyle}>
              <FaUser style={{ marginLeft: "10px" }} />
              <input
                id="usuario-input"
                ref={usuarioRef}
                name="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ingresa tu usuario"
                className={styles.input}
                style={inputStyle}
                aria-label="Ingresa tu usuario"
              />
            </div>

            <label
              htmlFor="password-input"
              className="block mt-6 mb-2 text-lg font-semibold text-white"
            >
              Contraseña
            </label>
            <div className={styles.inputContainer} style={containerStyle}>
              <FaLock style={{ marginLeft: "10px" }} />
              <input
                id="password-input"
                ref={passwordRef}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ingresa tu contraseña"
                className={styles.input}
                style={inputStyle}
                aria-label="Ingresa tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                style={eyeButtonStyle}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || attempts >= 3}
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
                cursor:
                  isSubmitting || attempts >= 3 ? "not-allowed" : "pointer",
              }}
              aria-label="Iniciar sesión"
            >
              {attempts >= 3
                ? "Demasiados intentos"
                : isSubmitting
                ? "Procesando..."
                : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
