"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import styles from "../pages/css/login.module.css";
import Image from "next/image";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../styles/globals.css";
import io from "socket.io-client";

const MySwal = withReactContent(Swal);

const Login = () => {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!usuario || !password) {
      showAlert(
        "error",
        "⚠️ Campos incompletos",
        "Por favor, completa todos los campos.",
        "linear-gradient(145deg, #4a0000, #220000)",
        "#ff1744"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/loginApi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Emitir evento de actividad usando socket.io
        const socket = io(); // Se conecta al mismo origen
        socket.emit("user-activity", {
          userId: data.userId,          // Asegúrate de que 'data.userId' exista
          action: "Inició sesión",      
          ip: data.ip || "",            // Opcional: si tu backend lo proporciona
          userAgent: navigator.userAgent,
          time: new Date(),
        });

        showAlert(
          "success",
          "✅ Bienvenido",
          "Inicio de sesión exitoso.",
          "linear-gradient(145deg, #002400, #001200)",
          "#32cd32"
        );
        // Guarda la cookie de autenticación, según tu lógica
        document.cookie = `auth=true; path=/;`;
        router.replace("/inicio-servicio-medico");
      } else if (data.message === "Usuario no encontrado") {
        showAlert(
          "error",
          "❌ Usuario no encontrado",
          "El usuario ingresado no existe.",
          "linear-gradient(145deg, #4a0000, #220000)",
          "#ff4500"
        );
      } else if (data.message === "Contraseña incorrecta") {
        showAlert(
          "error",
          "🔒 Contraseña incorrecta",
          "La contraseña ingresada no es válida.",
          "linear-gradient(145deg, #4a0000, #220000)",
          "#ffa500"
        );
      } else {
        showAlert(
          "error",
          "⚠️ Error desconocido",
          "Ocurrió un problema inesperado.",
          "linear-gradient(145deg, #22004a, #110025)",
          "#9400d3"
        );
      }
    } catch {
      showAlert(
        "error",
        "🌐 Problema de conexión",
        "No se pudo conectar al servidor. Intente nuevamente.",
        "linear-gradient(145deg, #001f4a, #000d22)",
        "#1e90ff"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showAlert = (
    icon: "success" | "error",
    title: string,
    message: string,
    background: string,
    confirmButtonColor: string
  ): void => {
    MySwal.fire({
      icon: icon,
      title: `<span style='color: ${confirmButtonColor}; font-weight: bold; font-size: 1.5em;'>${title}</span>`,
      html: `<p style='color: #fff; font-size: 1.1em;'>${message}</p>`,
      background: background,
      confirmButtonColor: confirmButtonColor,
      confirmButtonText: `<span style='color: #fff; font-weight: bold;'>Aceptar</span>`,
    });
  };

  return (
    <div className={styles.body}>
      <div className={styles.formContainer}>
        <div className={styles.imageContainer}>
          <Image
            src="/login_servicio_medico.png"
            alt="Descripción de la imagen"
            width={500}
            height={520}
            className={styles.image}
          />
        </div>
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
              <FaUser
                className={styles.icon}
                style={{ marginLeft: "10px" }}
              />
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
              <FaLock
                className={styles.icon}
                style={{ marginLeft: "10px" }}
              />
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
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.visibilityToggle}
                aria-label="Toggle password visibility"
                style={{
                  marginRight: "10px",
                  background: "none",
                  border: "none",
                  color: "black",
                  cursor: "pointer",
                }}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            <button
              type="submit"
              className={`${styles.button} ${
                isSubmitting ? styles.buttonDisabled : ""
              }`}
              disabled={isSubmitting}
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
