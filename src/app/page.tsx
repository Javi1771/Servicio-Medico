"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../pages/css/login.module.css';
import Image from "next/image";

const Login = () => {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para controlar la visibilidad de la contraseña
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const response = await fetch('/api/loginApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Establece la cookie de autenticación
      document.cookie = 'auth=true; path=/;';
      router.push('/inicio-servicio-medico');
    } else {
      setError(data.message);
    }
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
          <h1 className={styles.formTitle}>Login</h1>
          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.label}>
              Usuario:
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Contraseña:
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.visibilityToggle}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>
            <button type="submit" className={styles.button}>
              Ingresar
            </button>
          </form>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
