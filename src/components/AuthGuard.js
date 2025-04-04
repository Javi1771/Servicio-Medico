import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import PresidenteLayout from "../components/PresidenteLayout";

const AuthGuard = ({ children }) => {
  //* Solo para aplicar el layout correspondiente al rol.
  const [role, setRole] = useState(null);

  useEffect(() => {
    const rol = Cookies.get("rol");
    setRole(rol);
  }, []);

  //* Mientras no se obtenga el rol, puedes mostrar un loader o simplemente null.
  if (!role) {
    return <div>Verificando acceso...</div>;
  }

  return role === "7" ? (
    <PresidenteLayout>{children}</PresidenteLayout>
  ) : (
    <>{children}</>
  );
};

export default AuthGuard;
