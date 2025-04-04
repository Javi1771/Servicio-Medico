import { FaClipboardList, FaUser, FaBirthdayCake, FaFlask, FaPills } from "react-icons/fa";
import { BiBuildings, BiBarcode } from "react-icons/bi";
import { CiMedicalCross } from "react-icons/ci";

//! Paleta de rojos
const red800 = "#B10033";

export default function Surtimiento({ datos }) {
  return (
    <div className="space-y-3 text-xl" style={{ color: red800 }}>
      <p>
        <span className="font-bold">
          <FaClipboardList className="inline-block mr-2" /> Nómina:
        </span>{" "}
        {datos.nomina}
      </p>
      <p>
        <span className="font-bold">
          <FaUser className="inline-block mr-2" /> Nombre del Paciente:
        </span>{" "}
        {datos.nombrePaciente}
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
          <FaFlask className="inline-block mr-2" /> Diagnóstico:
        </span>{" "}
        {datos.diagnostico}
      </p>
      <p>
        <span className="font-bold">
          <CiMedicalCross className="inline-block mr-2" /> Clave Médico:
        </span>{" "}
        {datos.clavemedico}
      </p>
      <p>
        <span className="font-bold">
          <BiBarcode className="inline-block mr-2" /> Folio de Surtimiento:
        </span>{" "}
        {datos.folio_surtimiento}
      </p>

      <div className="mt-6">
        <span className="font-bold text-2xl">
          <FaPills className="inline-block mr-2" /> Medicamentos:
        </span>
        {datos.medicamentos && datos.medicamentos.length > 0 ? (
          <ul className="list-disc ml-8 mt-2">
            {datos.medicamentos.map((med, index) => (
              <li key={index}>
                <span className="font-semibold">{med.medicamento}</span> (Clave: {med.claveMedicamento})
              </li>
            ))}
          </ul>
        ) : (
          <p className="ml-8">No hay medicamentos registrados para este surtimiento.</p>
        )}
      </div>
    </div>
  );
}