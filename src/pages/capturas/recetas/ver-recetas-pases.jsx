import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function VerRecetas() {
  const router = useRouter();
  const { claveconsulta } = router.query;
  const [encryptedClave, setEncryptedClave] = useState("");

  const handleRegresar = () => {
    router.push("/capturas/pases-a-especialidades"); //* Navegar a la pantalla anterior
  };

  useEffect(() => {
    if (claveconsulta) {
      setEncryptedClave(claveconsulta);
    }
  }, [claveconsulta]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-10">
      {/* Encabezado con animación y mejor diseño */}

      <button
        onClick={handleRegresar}
        className="px-6 py-3 text-lg font-semibold rounded-full bg-gradient-to-r from-red-600 via-pink-600 to-purple-700 shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)] hover:shadow-[0px_0px_30px_10px_rgba(255,0,0,0.7)] text-white hover:brightness-125 transition-all duration-300"
      >
        ← Regresar
      </button>

      <h1 className="text-4xl font-extrabold text-cyan-400 text-center mb-10 flex items-center justify-center gap-3">
        <span className="bg-cyan-600 p-3 rounded-full text-black">📕</span> Ver Pases en PDF
      </h1>

      {/* Contenedor con ajuste de espacio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Contenedor de Receta Farmacia */}
        <div className="bg-gray-900 p-6 rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 relative">
          <h2 className="text-2xl font-semibold text-cyan-300 text-center mb-4 flex items-center gap-2">
          🩺 Receta de Doctor
          </h2>

          {encryptedClave ? (
            <iframe
              src={`/capturas/recetas/generar-receta-farmacia-pase?claveconsulta=${encryptedClave}`}
              className="w-full h-[85vh] rounded-lg border-none shadow-lg shadow-cyan-500/30"
              style={{ overflow: "hidden", backgroundColor: "transparent" }}
              scrolling="no"
            />
          ) : (
            <p className="text-center text-gray-400">Cargando...</p>
          )}
        </div>

        {/* Contenedor de Receta Paciente */}
        <div className="bg-gray-900 p-6 rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 relative">
          <h2 className="text-2xl font-semibold text-cyan-300 text-center mb-4 flex items-center gap-2">
            🏥 Receta de Paciente
          </h2>

          {encryptedClave ? (
            <iframe
              src={`/capturas/recetas/generar-receta-paciente-pase?claveconsulta=${encryptedClave}`}
              className="w-full h-[85vh] rounded-lg border-none shadow-lg shadow-cyan-500/30"
              style={{ overflow: "hidden", backgroundColor: "transparent" }}
              scrolling="no"
            />
          ) : (
            <p className="text-center text-gray-400">Cargando...</p>
          )}
        </div>
      </div>
    </div>
  );
}
