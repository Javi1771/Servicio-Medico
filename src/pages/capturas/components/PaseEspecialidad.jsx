import { FaUser, FaBirthdayCake, FaStar } from "react-icons/fa";
import { BiBuildings } from "react-icons/bi";
import { CiMedicalCross } from "react-icons/ci";

//* Paleta de rojos 
const red800 = "#B10033";

export default function PaseEspecialidad({ datos }) {
  return (
    <div style={{ color: red800 }} className="space-y-3 text-xl">
      <p>
        <span className="font-bold">
          <FaUser className="inline-block mr-2" /> Nombre del Paciente:
        </span>{" "}
        {datos.nombrepaciente}
      </p>
      <p>
        <span className="font-bold">
          <FaBirthdayCake className="inline-block mr-2" /> Edad:
        </span>{" "}
        {datos.edad}
      </p>
      <p>
        <span className="font-bold">
          <BiBuildings className="inline-block mr-2" /> Departamento:
        </span>{" "}
        {datos.departamento}
      </p>
      <p>
        <span className="font-bold">
          <CiMedicalCross className="inline-block mr-2" /> Doctor:
        </span>{" "}
        {datos.nombreproveedor}
      </p>
      <p>
        <span className="font-bold">
          <FaStar className="inline-block mr-2" /> Especialidad:
        </span>{" "}
        {datos.especialidad}
      </p>
    </div>
  );
}
