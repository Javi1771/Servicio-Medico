import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PresidenteLayout from "../components/PresidenteLayout";

const AuthGuard = ({ children, user: initialUser = null }) => {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    //* Solo hacemos refresh si no tenemos un usuario ya definido
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
          //* Actualizamos el estado con el rol recibido
          setUser({ role: String(data.rol) });
        })
        .catch((err) => {
          console.warn("Token inválido o expirado:", err.message);
          //* Si no se pudo refrescar, redirigimos a /login
          router.push("/login");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/90 to-blue-800/90 flex flex-col items-center justify-center">
        {/* Spinner minimalista: tres círculos que giran en bucle */}
        <div className="flex space-x-4 mb-6">
          <div className="w-4 h-4 bg-[#BAE1FD] rounded-full animate-pulse-slow"></div>
          <div className="w-4 h-4 bg-[#7ECBFB] rounded-full animate-pulse-slow delay-200"></div>
          <div className="w-4 h-4 bg-[#3000A0] rounded-full animate-pulse-slow delay-400"></div>
        </div>

        {/* Texto sencillo */}
        <span className="text-lg text-gray-200">Cargando sesión...</span>

        {/* Estilos definidos internamente para la animación de pulso lento */}
        <style jsx>{`
          @keyframes pulseSlow {
            0% {
              opacity: 0.3;
              transform: scale(0.9);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              opacity: 0.3;
              transform: scale(0.9);
            }
          }
          .animate-pulse-slow {
            animation: pulseSlow 1.5s ease-in-out infinite;
          }
          .delay-200 {
            animation-delay: 0.2s;
          }
          .delay-400 {
            animation-delay: 0.4s;
          }
        `}</style>
      </div>
    );
  }

  if (user?.role === "7") {
    return <PresidenteLayout>{children}</PresidenteLayout>;
  }

  return <>{children}</>;
};

export default AuthGuard;
