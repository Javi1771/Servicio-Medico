import React, { useState, useEffect } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) {
    return { display: "0 años, 0 meses, 0 días" };
  }

  try {
    let dia, mes, año;
    if (fechaNacimiento.includes("/")) {
      [dia, mes, año] = fechaNacimiento.split(" ")[0].split("/");
    } else if (fechaNacimiento.includes("-")) {
      [año, mes, dia] = fechaNacimiento.split("T")[0].split("-");
    } else {
      throw new Error("Formato de fecha desconocido");
    }

    const fechaFormateada = `${año}-${mes}-${dia}`;
    const hoy = new Date();
    const nacimiento = new Date(fechaFormateada);

    let años = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (meses < 0 || (meses === 0 && dias < 0)) {
      años--;
      meses += 12;
    }
    if (dias < 0) {
      meses--;
      dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    }

    return { display: `${años} años, ${meses} meses, ${dias} días` };
  } catch (error) {
    console.error("Error al calcular la edad:", error);
    return { display: "0 años, 0 meses, 0 días" };
  }
};

const CrearPaseNuevo = () => {
  const [nomina, setNomina] = useState("");
  const [employeeData, setEmployeeData] = useState({
    photo: "/user_icon_.png",
    name: "",
    age: "",
    department: "",
    position: "",
    grupoNomina: "",
    cuotaSindical: "",
  });
  const [beneficiaryData, setBeneficiaryData] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [especialistas, setEspecialistas] = useState([]);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("");

  const handleSearch = async () => {
    if (!nomina.trim()) {
      MySwal.fire({
        icon: "error",
        title: "⚠️ Número de nómina requerido",
        text: "Por favor, ingresa un número de nómina antes de buscar.",
      });
      return;
    }

    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: nomina }),
      });
      const employee = await response.json();

      if (!employee || Object.keys(employee).length === 0) {
        MySwal.fire({
          icon: "error",
          title: "⚠️ Empleado no encontrado",
          text: "El número de nómina no corresponde a un empleado registrado.",
        });
        setEmployeeData({
          photo: "/user_icon_.png",
          name: "",
          age: "",
          department: "",
          position: "",
          grupoNomina: "",
          cuotaSindical: "",
        });
        setBeneficiaryData([]);
        setSelectedPersona(null);
        return;
      }

      const { display: employeeAge } = calcularEdad(employee.fecha_nacimiento);

      setEmployeeData({
        photo: "/user_icon_.png",
        name: `${employee.nombre} ${employee.a_paterno} ${employee.a_materno}`,
        age: employeeAge,
        department: employee.departamento,
        position: employee.puesto,
        grupoNomina: employee.grupoNomina || "",
        cuotaSindical: employee.cuotaSindical || "",
      });

      const beneficiariesResponse = await fetch("/api/beneficiarios/beneficiario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomina }),
      });
      const beneficiaries = await beneficiariesResponse.json();

      setBeneficiaryData(beneficiaries.beneficiarios || []);
      setSelectedPersona("empleado");
    } catch (error) {
      console.error("Error al buscar empleado o beneficiarios:", error);
      MySwal.fire({
        icon: "error",
        title: "❌ Error al realizar la búsqueda",
        text: "Ocurrió un problema al intentar buscar los datos. Por favor, inténtalo nuevamente.",
      });
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch("/api/especialidades/especialidades");
      const data = await response.json();
      setEspecialidades(data);
    } catch (error) {
      console.error("Error al cargar especialidades:", error);
    }
  };

  const handleEspecialidadChange = async (especialidadId) => {
    setSelectedEspecialidad(especialidadId);
    try {
      const response = await fetch(`/api/especialidades/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claveespecialidad: especialidadId }),
      });
      const data = await response.json();
      setEspecialistas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar especialistas:", error);
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-4xl mx-auto rounded-lg shadow-2xl backdrop-blur-md bg-opacity-80 bg-gradient-to-r from-gray-700 to-black">
        <h1 className="text-5xl font-bold text-center text-indigo-300 py-6">Crear Pase Nuevo</h1>
        <div className="flex items-center space-x-4 px-6 py-4">
          <input
            type="text"
            value={nomina}
            onChange={(e) => setNomina(e.target.value)}
            placeholder="Número de Nómina"
            className="w-full p-4 text-lg rounded-lg bg-gray-600 text-white border-2 border-indigo-400 focus:border-pink-500 outline-none transition-all"
          />
          <button
            onClick={handleSearch}
            className="flex items-center bg-gradient-to-r from-pink-500 to-purple-700 py-3 px-8 rounded-xl text-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 text-white"
          >
            <AiOutlineUserAdd className="mr-2 text-2xl" /> Buscar
          </button>
        </div>

        {employeeData.name && (
          <div className="p-6 bg-gradient-to-br from-gray-800 to-black rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-indigo-400 mb-4">Selecciona Persona</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                className={`w-full p-4 rounded-lg text-left text-lg ${
                  selectedPersona === "empleado" ? "bg-indigo-500" : "bg-gray-700"
                } text-white hover:bg-indigo-600 transition`}
                onClick={() => setSelectedPersona("empleado")}
              >
                Empleado: {employeeData.name}
              </button>
              {beneficiaryData.map((beneficiary) => (
                <button
                  key={beneficiary.id}
                  className={`w-full p-4 rounded-lg text-left text-lg ${
                    selectedPersona === beneficiary.id ? "bg-purple-500" : "bg-gray-700"
                  } text-white hover:bg-purple-600 transition`}
                  onClick={() => setSelectedPersona(beneficiary.id)}
                >
                  Beneficiario: {beneficiary.NOMBRE} {beneficiary.A_PATERNO} {beneficiary.A_MATERNO}
                </button>
              ))}
            </div>

            <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-indigo-400 mb-4">Diagnóstico y Observaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-2">Especialidades</label>
                  <select
                    className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    onChange={(e) => handleEspecialidadChange(e.target.value)}
                    value={selectedEspecialidad}
                  >
                    <option value="">Seleccione una especialidad</option>
                    {especialidades.map((especialidad) => (
                      <option key={especialidad.claveespecialidad} value={especialidad.claveespecialidad}>
                        {especialidad.especialidad}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-lg text-yellow-400 font-semibold mb-2">Especialistas</label>
                  <select
                    className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Seleccione un especialista</option>
                    {especialistas.map((especialista) => (
                      <option key={especialista.id} value={especialista.id}>
                        {especialista.nombreproveedor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrearPaseNuevo;
