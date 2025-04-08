import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import PresidenteLayout from "../components/PresidenteLayout";

const AuthGuard = ({ children }) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const rolCookie = Cookies.get("rol");
    // Actualiza el estado solo si se encontró un valor (puedes definir una lógica
    // adicional para detectar que ya pasó cierto tiempo sin encontrar la cookie)
    if (rolCookie) {
      setRole(rolCookie);
    } else {
      // Se podría agregar un fallback o incluso redirigir a login
      console.warn("La cookie 'rol' no se encontró");
    }
  }, []);

  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
        Verificando acceso...
      </div>
    );
  }

  return role === "7" ? (
    <PresidenteLayout>{children}</PresidenteLayout>
  ) : (
    <>{children}</>
  );
};

export default AuthGuard;
