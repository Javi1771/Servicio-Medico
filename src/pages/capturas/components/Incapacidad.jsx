import { FaCalendarAlt, FaUser, FaBirthdayCake } from "react-icons/fa";
import { BiBuildings, BiTime } from "react-icons/bi";
import { CiMedicalCross } from "react-icons/ci";
import { FaEye } from "react-icons/fa6";

// Paleta de rojos
const red800 = "#B10033";

export default function Incapacidad({ datos }) {
  // Para verificar en consola el valor de observaciones
  console.log("Observaciones recibidas:", datos.observaciones);

  return (
    <div style={{ color: red800 }} className="space-y-3 text-xl">
      <p>
        <span className="font-bold">
          <FaCalendarAlt className="inline-block mr-2" /> Fecha de Asignación:
        </span>{" "}
        {datos.fecha}
      </p>
      <p>
        <span className="font-bold">
          <BiTime className="inline-block mr-2" /> Inicio:
        </span>{" "}
        {datos.fechainicio}
      </p>
      <p>
        <span className="font-bold">
          <BiTime className="inline-block mr-2" /> Final:
        </span>{" "}
        {datos.fechafinal}
      </p>
      <p>
        <span className="font-bold">
          <FaUser className="inline-block mr-2" /> Nombre del Paciente:
        </span>{" "}
        {datos.nombrepaciente}
      </p>
      <p>
        <span className="font-bold">
          <BiBuildings className="inline-block mr-2" /> Departamento:
        </span>{" "}
        {datos.departamento}
      </p>
      <p>
        <span className="font-bold">
          <FaBirthdayCake className="inline-block mr-2" /> Edad:
        </span>{" "}
        {datos.edad}
      </p>
      <p>
        <span className="font-bold">
          <CiMedicalCross className="inline-block mr-2" /> Doctor:
        </span>{" "}
        {datos.nombreproveedor}
      </p>
      <p>
        <span className="font-bold">
          <FaEye className="inline-block mr-2" /> Observaciones:
        </span>{" "}
        {datos.observaciones}
      </p>
    </div>
  );
}
