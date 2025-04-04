import { FaUser, FaBirthdayCake, FaFlask } from "react-icons/fa";
import { BiBuildings } from "react-icons/bi";

//! Paleta de rojos
const red800 = "#B10033";

export default function Laboratorio({ datos }) {
  return (
    <div style={{ color: red800 }} className="space-y-3 text-xl">
      <p>
        <span className="font-bold">
          <FaUser className="inline-block mr-2" /> Nombre del Paciente:
        </span>{" "}
        {datos.NOMBRE_PACIENTE}
      </p>
      <p>
        <span className="font-bold">
          <FaBirthdayCake className="inline-block mr-2" /> Edad:
        </span>{" "}
        {datos.EDAD}
      </p>
      <p>
        <span className="font-bold">
          <BiBuildings className="inline-block mr-2" /> Departamento:
        </span>{" "}
        {datos.DEPARTAMENTO}
      </p>

      <div>
        <span className="font-bold inline-block mr-2">
          <FaFlask className="inline-block mr-2" /> Estudios:
        </span>
        {datos.estudios && datos.estudios.length > 0 ? (
          <ul className="list-disc ml-8 mt-2">
            {datos.estudios.map((estudio, index) => (
              <li key={index} className="text-base">{estudio.trim()}</li>
            ))}
          </ul>
        ) : (
          <span>No se encontraron estudios</span>
        )}
      </div>
    </div>
  );
}
