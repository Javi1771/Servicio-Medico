import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PresidenteLayout from "../components/PresidenteLayout";

const AuthGuard = ({ children, user: initialUser = null }) => {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    // Solo hacemos refresh si no tenemos un usuario ya definido
    if (!user) {
      setIsLoading(true);
      fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) return res.json(); 
          throw new Error("No se pudo refrescar token");
        })
        .then((data) => {
          // Actualizamos el estado con el rol recibido
          setUser({ role: String(data.rol) });
        })
        .catch((err) => {
          console.warn("Token inválido o expirado:", err.message);
          // Si no se pudo refrescar, redirigimos a /login
          router.push("/login");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, router]);

  // Mientras validamos/intentamos refresh, mostramos un loading
  if (isLoading) {
    return <div>Cargando sesión...</div>;
  }

  // Si el usuario existe y tiene rol 7, usa el layout de presidente
  if (user?.role === "7") {
    return <PresidenteLayout>{children}</PresidenteLayout>;
  }

  // Si no es rol 7, muestra directamente los children sin layout
  return <>{children}</>;
};

export default AuthGuard;
