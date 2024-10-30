import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './css/login.module.css'; 


const Login = () => {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const response = await fetch('/api/loginApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('auth', 'true'); // Guarda el estado de autenticación
      router.push('/inicio-servicio-medico'); // Redirige a la página protegida
    } else {
      setError(data.message);
    }
  };

  return (
      <div className={styles.body}>
        <div className={styles.formContainer}>
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
            </label>
            <button type="submit" className={styles.button}>
              Ingresar
            </button>
          </form>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      </div>
    );
};
export default Login;
