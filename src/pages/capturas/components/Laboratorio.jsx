import { useRef } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaUser,
  FaBirthdayCake,
  FaFlask,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { BiBuildings, BiXCircle } from "react-icons/bi";

const MySwal = withReactContent(Swal);
const red800 = "#B10033";

const successSound = "/assets/applepay.mp3";
const errorSound = "/assets/error.mp3";

export default function Laboratorio({ datos, onCancelSuccess }) {
  const audioRef = useRef(null);
  const successAudio = useRef(new Audio(successSound));
  const errorAudio = useRef(new Audio(errorSound));

  if (!audioRef.current) {
    audioRef.current = new Audio("/assets/tap.mp3");
  }

  const handleHover = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const playSound = (isSuccess) => {
    const audio = isSuccess ? successAudio.current : errorAudio.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  };

  const showConfirmCancel = async (folioOrden) => {
    const result = await MySwal.fire({
      icon: "warning",
      title: `<span style='color: #ffc107; font-weight: bold; font-size: 1.5em;'>⚠️ Confirmar Cancelación</span>`,
      html: "<p style='color: #fff; font-size: 1.1em;'>¿Deseas cancelar esta orden de laboratorio?</p>",
      background: "linear-gradient(145deg, #7f6000, #332600)",
      confirmButtonColor: "#ffc107",
      cancelButtonColor: "#666",
      confirmButtonText: "<span style='color: #000; font-weight: bold;'>Sí, cancelar</span>",
      cancelButtonText: "<span style='color: #fff;'>No, mantener</span>",
      showCancelButton: true,
      customClass: {
        popup: "border border-yellow-600 shadow-[0px_0px_20px_5px_rgba(255,193,7,0.9)] rounded-lg",
      },
    });

    if (result.isConfirmed) {
      cancelarOrdenLaboratorio(folioOrden);
    }
  };

  const cancelarOrdenLaboratorio = async (folioOrden) => {
    try {
      const res = await fetch("/api/cancelaciones/cancelarLaboratorio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folioOrden }),
      });

      const result = await res.json();

      if (!res.ok) {
        playSound(false);
        return MySwal.fire({
          icon: "error",
          title: "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ Error</span>",
          html: `<p style='color: #fff; font-size: 1.1em;'>${result.message}</p>`,
          background: "linear-gradient(145deg, #4a0000, #220000)",
          confirmButtonColor: "#ff1744",
          confirmButtonText: "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup: "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
          },
        });
      }

      playSound(true);
      await MySwal.fire({
        icon: "success",
        title: "<span style='color: #00e676; font-weight: bold; font-size: 1.5em;'>✔️ Cancelado</span>",
        html: "<p style='color: #fff; font-size: 1.1em;'>La orden fue cancelada correctamente.</p>",
        background: "linear-gradient(145deg, #004d40, #00251a)",
        confirmButtonColor: "#00e676",
        confirmButtonText: "<span style='color: #000; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup: "border border-green-600 shadow-[0px_0px_20px_5px_rgba(0,230,118,0.9)] rounded-lg",
        },
      });

      if (onCancelSuccess) onCancelSuccess(); // Limpia el formulario si se proporciona esta función
    } catch (error) {
      playSound(false);
      console.error("Error al cancelar:", error);
    }
  };

  const renderDato = (icon, label, value) => (
    <div
      onMouseEnter={handleHover}
      className="flex items-start gap-4 p-4 rounded-2xl border shadow-lg bg-white/20 backdrop-blur-md hover:scale-[1.015] transition-all duration-300 cursor-pointer"
    >
      <div className="text-3xl text-white bg-red-800 p-3 rounded-full shadow-md">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-lg font-bold text-red-900">{label}</p>
        <p className="text-xl font-medium text-red-950 tracking-wide">{value}</p>
      </div>
    </div>
  );

  const renderLaboratoriosConEstudios = () => {
    if (!Array.isArray(datos.laboratorios) || datos.laboratorios.length === 0) {
      return (
        <div
          onMouseEnter={handleHover}
          className="col-span-full p-4 rounded-2xl border shadow-lg bg-white/20 backdrop-blur-md text-red-950"
        >
          <p className="text-lg font-bold text-red-900 mb-2">Laboratorios:</p>
          <p className="text-base">No se encontraron laboratorios.</p>
        </div>
      );
    }

    return datos.laboratorios.map((lab, index) => (
      <div
        key={index}
        onMouseEnter={handleHover}
        className="col-span-full flex flex-col gap-4 p-4 rounded-2xl border shadow-lg bg-white/20 backdrop-blur-md hover:scale-[1.015] transition-all duration-300"
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl text-white bg-red-800 p-3 rounded-full shadow-md">
            <FaFlask />
          </div>
          <div className="text-left w-full">
            <p className="text-lg font-bold text-red-900 mb-1">
              Laboratorio:{" "}
              <span className="font-semibold text-red-950">{lab.nombre}</span>
            </p>
            <p className="text-lg font-bold text-red-900 mb-1">Estudios:</p>
            {Array.isArray(lab.estudios) && lab.estudios.length > 0 ? (
              <ul className="list-disc pl-5 text-red-950">
                {lab.estudios.map((estudio, i) => (
                  <li key={i} className="text-base">
                    {estudio.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-red-950">Sin estudios asignados</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={() => {
              //console.log("Folio que se enviará al backend:", lab.folioOrden);
              showConfirmCancel(lab.folioOrden);
            }}
            className="px-6 py-2 text-white font-bold rounded-full shadow-lg"
            style={{ backgroundColor: red800 }}
          >
            <BiXCircle className="inline-block mr-1 mb-1" />
            Cancelar orden
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 text-red-950">
      {renderDato(<FaUser />, "Nombre del Paciente", datos.NOMBRE_PACIENTE)}
      {renderDato(<FaBirthdayCake />, "Edad", datos.EDAD)}
      {renderDato(<BiBuildings />, "Departamento", datos.DEPARTAMENTO)}
      {renderDato(<FaMoneyCheckAlt />, "Nómina", datos.NOMINA)}
      {renderLaboratoriosConEstudios()}
    </div>
  );
}
