import { useRef } from "react";
import { FaUser, FaBirthdayCake, FaCalendarAlt } from "react-icons/fa";
import { MdMedicalInformation } from "react-icons/md";
import { BiBuildings } from "react-icons/bi";
import { CiMedicalCross } from "react-icons/ci";

export default function PaseEspecialidad({ datos }) {
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
      {renderDato(<FaUser />, "Nombre del Paciente", datos.nombrepaciente)}
      {renderDato(<FaBirthdayCake />, "Edad", datos.edad)}
      {renderDato(<BiBuildings />, "Departamento", datos.departamento)}
      {renderDato(<CiMedicalCross />, "Doctor", datos.nombreproveedor)}
      {renderDato(<MdMedicalInformation />, "Especialidad", datos.especialidad)}
      {renderDato(<FaCalendarAlt />, "Fecha de la Cita", datos.fechacita)}
    </div>
  );
}
