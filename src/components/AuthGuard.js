import { useState, useEffect } from "react";
import PresidenteLayout from "../components/PresidenteLayout";

const AuthGuard = ({ children, user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [attemptedRefresh, setAttemptedRefresh] = useState(false);

  useEffect(() => {
    // Si no hay usuario y aún no se intentó refrescar, se hace una única llamada.
    if (!user && !attemptedRefresh) {
      setAttemptedRefresh(true);
      fetch("/api/refresh", { method: "POST", credentials: "include" })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("No se pudo refrescar token");
        })
        .then((data) => {
          // Forzamos que el rol se guarde como cadena para la comparación
          setUser({ role: String(data.rol) });
        })
        .catch((err) => {
          console.error("Error al refrescar token en cliente:", err);
          // En este caso, dejamos renderizar los children sin bloqueo.
        });
    }
  }, [user, attemptedRefresh]);

  // En lugar de bloquear el render con un spinner, permitimos la navegación normal si no hay usuario.
  if (!user) {
    return <>{children}</>;
  }

  // Si hay usuario, aplicamos el layout especial para el rol "7" (presidente).
  return user.role === "7" ? (
    <PresidenteLayout>{children}</PresidenteLayout>
  ) : (
    <>{children}</>
  );
};

export default AuthGuard;
