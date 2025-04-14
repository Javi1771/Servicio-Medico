import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/*
 ? Paleta de colores (Turquoise Blue):
 ? 50:  #EAFFFE
 ? 100:  #CBFFFE
 ? 200:  #9BFFFF
 ? 300:  #5BFCFF
 ? 400:  #00E6FF
 ? 500:  #00D6F5
 ? 600:  #00A7D0
 ? 700:  #0084A9
 ? 800:  #00576A
 ? 900:  #00384B
 */

export default function VerOrdenes() {
  const router = useRouter();
  const { claveconsulta } = router.query;
  const [encryptedClave, setEncryptedClave] = useState("");

  const handleRegresar = () => {
    router.push("/capturas/orden-de-estudio-de-laboratorio");
  };

  useEffect(() => {
    if (claveconsulta) {
      //* Se asume que la clave ya viene encriptada desde la pantalla anterior
      setEncryptedClave(claveconsulta);
    }
  }, [claveconsulta]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EAFFFE] to-[#CBFFFE] text-[#00384B] p-10">
      {/* Botón de Regresar */}
      <button
        onClick={handleRegresar}
        className="mb-6 self-start flex items-center gap-2 px-4 py-2 
                   bg-[#00A7D0] text-[#EAFFFE] font-bold rounded-md 
                   border border-transparent shadow-lg hover:bg-[#0084A9] 
                   transition-all duration-300"
      >
        ← Regresar
      </button>

      <h1 className="text-4xl font-extrabold text-[#00576A] text-center mb-10 flex items-center justify-center gap-3 drop-shadow-md">
        <span className="bg-[#00E6FF] p-3 rounded-full text-[#00384B]">📝</span>
        Ordenes de Estudio de Laboratorio
      </h1>

      {/* Contenedor para visualizar el PDF */}
      <div className="bg-[#9BFFFF]/10 p-6 rounded-2xl border-2 border-[#9BFFFF] shadow-xl shadow-[#9BFFFF]/50 relative overflow-hidden mx-auto w-full max-w-6xl">
        <h2 className="text-2xl font-semibold text-[#0084A9] text-center mb-4 flex items-center gap-2 drop-shadow-sm">
          📜 Orden de Estudio
        </h2>

        {encryptedClave ? (
          <iframe
            src={`/capturas/laboratorio/generar-ordenes?claveconsulta=${encryptedClave}`}
            className="w-full h-[90vh] rounded-lg border-none shadow-lg shadow-[#00E6FF]/30"
            style={{ backgroundColor: "transparent" }}
            scrolling="auto"
          />
        ) : (
          <p className="text-center text-[#00576A] opacity-70">Cargando...</p>
        )}
      </div>
    </div>
  );
}
