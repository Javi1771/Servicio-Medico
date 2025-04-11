import { useRef } from "react";
import {
  FaClipboardList,
  FaUser,
  FaBirthdayCake,
  FaFlask,
  FaPills,
} from "react-icons/fa";
import { BiBuildings } from "react-icons/bi";
import { CiMedicalCross } from "react-icons/ci";

export default function Surtimiento({ datos }) {
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

  const renderMedicamentos = () => (
    <div
      onMouseEnter={handleHover}
      className="col-span-full flex items-start gap-4 p-4 rounded-2xl border shadow-lg bg-white/20 backdrop-blur-md hover:scale-[1.015] transition-all duration-300 cursor-pointer"
    >
      <div className="text-3xl text-white bg-red-800 p-3 rounded-full shadow-md">
        <FaPills />
      </div>
      <div className="text-left w-full">
        <p className="text-lg font-bold text-red-900 mb-2">Medicamentos:</p>
        {datos.medicamentos && datos.medicamentos.length > 0 ? (
          <ul className="list-disc pl-5 text-red-950">
            {datos.medicamentos.map((med, index) => (
              <li key={index} className="text-base">
                <span className="font-semibold">{med.medicamento}</span> (Clave: {med.claveMedicamento})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base text-red-950">
            No hay medicamentos registrados para este surtimiento.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 text-red-950">
      {renderDato(<FaClipboardList />, "Nómina", datos.nomina)}
      {renderDato(<FaUser />, "Nombre del Paciente", datos.nombrePaciente)}
      {renderDato(<FaBirthdayCake />, "Edad", datos.edad)}
      {renderDato(<BiBuildings />, "Departamento", datos.departamento)}
      {renderDato(<CiMedicalCross />, "Médico", datos.nombreproveedor)}
      {renderDato(<FaFlask />, "Diagnóstico", datos.diagnostico)}
      {renderMedicamentos()}
    </div>
  );
}
