import { useRef } from "react";
import {
  FaUser,
  FaBirthdayCake,
  FaFlask,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { BiBuildings, BiXCircle } from "react-icons/bi";
import showCustomAlert from "../../utils/alertas";

const red800 = "#B10033";

export default function Laboratorio({ datos, onCancelSuccess }) {
  const audioRef = useRef(null);

  if (!audioRef.current) {
    audioRef.current = new Audio("/assets/tap.mp3");
  }

  const handleHover = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const showConfirmCancel = async (folioOrden) => {
    const result = await showCustomAlert(
      "warning",
      "Confirmar Cancelación",
      "¿Deseas cancelar esta orden de laboratorio?",
      "Sí, cancelar"
    );

    if (result.isConfirmed) {
      cancelarOrdenLaboratorio(folioOrden);
    }

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
        return await showCustomAlert(
          "error",
          "Error",
          result.message,
          "Aceptar"
        );
      }

      await showCustomAlert(
        "success",
        "Cancelado",
        "La orden fue cancelada correctamente.",
        "Aceptar"
      );

      if (onCancelSuccess) onCancelSuccess(); //* Limpia el formulario si se proporciona esta función
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
        <p className="text-xl font-medium text-red-950 tracking-wide">
          {value}
        </p>
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
