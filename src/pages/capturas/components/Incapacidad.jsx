import { useRef } from "react";
import { FaCalendarAlt, FaUser, FaBirthdayCake } from "react-icons/fa";
import { BiBuildings, BiTime } from "react-icons/bi";
import { CiMedicalCross } from "react-icons/ci";
import { FaEye } from "react-icons/fa6";

export default function Incapacidad({ datos }) {
  const audioRef = useRef(null);

  //* Cargar el sonido solo una vez
  if (!audioRef.current) {
    audioRef.current = new Audio("/assets/tap.mp3");
  }

  const handleHover = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 text-red-950">
      {renderDato(<FaCalendarAlt />, "Fecha de Asignación", datos.fecha)}
      {renderDato(<BiTime />, "Inicio", datos.fechainicio)}
      {renderDato(<BiTime />, "Final", datos.fechafinal)}
      {renderDato(<FaUser />, "Nombre del Paciente", datos.nombrepaciente)}
      {renderDato(<BiBuildings />, "Departamento", datos.departamento)}
      {renderDato(<FaBirthdayCake />, "Edad", datos.edad)}
      {renderDato(<CiMedicalCross />, "Doctor", datos.nombreproveedor)}
      {renderDato(<FaEye />, "Observaciones", datos.observaciones)}
    </div>
  );
}
