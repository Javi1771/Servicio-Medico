import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import PresidenteLayout from "../components/PresidenteLayout";

//* Configuración de permisos por rol
const rolePermissions = {
  "7": ["/inicio-presidente", "/consultas", "/especialista", "/catalogos", "/estadisticas", "/capturas", "/cancelaciones", "/reportes"], //* Permisos para presidente
  "6": ["/inicio-servicio-medico", "/consultas", "/catalogos", "/capturas", "/cancelaciones", "/reportes", "/especialista"], //* Permisos para administrador
  "1": ["/inicio-servicio-medico", "/consultas", "/especialista"], //* Permisos para médico
  "2": ["/inicio-servicio-medico", "/consultas/signos-vitales"], //* Permisos para enfermera
  "3": ["/inicio-servicio-medico", "/capturas"], //* Permisos para capturista
};

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const rol = Cookies.get("rol");

    if (!token || !rol) {
      //! Si no hay token o rol, redirigir al login
      router.replace("/");
      return;
    }

    setRole(rol);

    const currentPath = router.pathname;

    //* Validar si la ruta actual es permitida para el rol
    const allowedRoutes = rolePermissions[rol] || [];
    if (!allowedRoutes.some((route) => currentPath.startsWith(route))) {
      //* Redirigir a la ruta principal del rol si no tiene acceso
      const defaultRoute = rol === "7" ? "/inicio-presidente" : "/inicio-servicio-medico";
      router.replace(defaultRoute);
      return;
    }

    setIsVerified(true); //* Usuario verificado y en ruta permitida
  }, [router]);

  if (!isVerified) {
    return null;
  }

  //* Si el rol es 7, usar el layout del presidente
  if (role === "7") {
    return <PresidenteLayout>{children}</PresidenteLayout>;
  }

  //* Renderizar el contenido sin barra lateral para otros roles
  return <>{children}</>;
};

export default AuthGuard;
