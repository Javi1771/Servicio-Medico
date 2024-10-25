import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineUserAdd, AiOutlineReload } from "react-icons/ai";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

//* Inicializa SweetAlert2 con React
const MySwal = withReactContent(Swal);

//* Función para calcular la edad en años, meses y días
const calcularEdad = (fechaNacimiento) => {
  const [dia, mes, año] = fechaNacimiento.split(" ")[0].split("/"); 
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
    const mesAnterior = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      0
    ).getDate();
    dias += mesAnterior;
  }

  return { años, meses, dias };
};

const SignosVitales = () => {
  const [patientData, setPatientData] = useState({
    photo: "/user_icon_.png",
    name: "",
    age: "",
    department: "",
    workstation: "",
  });
  const [nomina, setNomina] = useState("");
  const [showConsulta, setShowConsulta] = useState(false);
  const [signosVitales, setSignosVitales] = useState({
    ta: "",
    temperatura: "",
    fc: "",
    oxigenacion: "",
    altura: "",
    peso: "",
    glucosa: "",
  });

  const [pacientes, setPacientes] = useState([]); //* Estado para almacenar pacientes

  const handleAdd = () => {
    setShowConsulta(true);
    setPatientData({
      photo: "/user_icon_.png",
      name: "",
      age: "",
      department: "",
      workstation: "",
    });
    setSignosVitales({
      ta: "",
      temperatura: "",
      fc: "",
      oxigenacion: "",
      altura: "",
      peso: "",
      glucosa: "",
    });
    setNomina("");
  };

  const handleCloseModal = () => {
    setShowConsulta(false);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: nomina }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener datos del empleado.");
      }

      const data = await response.json();

      if (!data || Object.keys(data).length === 0) {
        //! Mostrar alerta si no se encuentra el empleado
        MySwal.fire({
          icon: "error",
          title: "<strong style='color: red;'>Nómina no encontrada</strong>",
          html: "<p style='color: white;'>El número de nómina ingresado no existe o no se encuentra.</p>",
          background: "#111827",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#FF6347",
          customClass: {
            popup: "animated bounceIn", 
          },
          timer: 5000, 
        });
        return;
      }

      const edad = data.fecha_nacimiento
        ? calcularEdad(data.fecha_nacimiento)
        : "";
      const edadString = edad
        ? `${edad.años} años, ${edad.meses} meses y ${edad.dias} días`
        : "";

      setPatientData({
        photo: "/user_icon_.png",
        name: `${data.nombre} ${data.a_paterno} ${data.a_materno}` || "",
        age: edadString || "",
        department: data.departamento || "",
        workstation: data.puesto || "",
      });
    } catch (error) {
      console.error("Error al obtener datos del empleado:", error);
      MySwal.fire({
        icon: "error",
        title: "<span style='color: white;'>Error</span>", 
        html: "<span style='color: white;'>Hubo un problema al buscar la nómina. Intenta nuevamente.</span>", 
        background: "#1F2937", 
        confirmButtonColor: "#FF6347", 
        cancelButtonColor: "#f44336", 
        confirmButtonText: "<span style='color: white;'>OK</span>", 
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp", 
        },
        customClass: {
          popup: "border border-gray-500 shadow-lg rounded-lg",
        },
        backdrop: `
          rgba(0,0,0,0.8)
          url("/images/nyan-cat.gif")
          left top
          no-repeat
        `, 
      });
    }
  };

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setSignosVitales((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSave = () => {
    const nuevoPaciente = {
      nomina,
      name: patientData.name,
      age: patientData.age,
      department: patientData.department,
      ...signosVitales,
    };

     //* Añadir nuevo paciente
    setPacientes((prevState) => [...prevState, nuevoPaciente]);
    handleCloseModal();
  };

  const handleReload = () => {
    setPacientes([...pacientes]); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col items-center p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/estetoscopio.png"
            alt="Estetoscopio"
            width={160}
            height={160}
            className="h-24 w-24 md:h-40 md:w-40 object-cover rounded-full bg-gray-600"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold">
            Registro de Pacientes
          </h1>
        </div>

        <div className="flex space-x-4 md:space-x-6 mt-4 md:mt-0">
          <button
            onClick={handleAdd}
            className="flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 px-6 py-3 md:px-10 md:py-4 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <AiOutlineUserAdd className="mr-2 md:mr-3 text-xl md:text-2xl" />
            <span className="text-lg md:text-xl font-bold text-white">
              Agregar
            </span>
          </button>
          <button
            onClick={handleReload}
            className="flex items-center bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-400 hover:to-teal-500 px-6 py-3 md:px-10 md:py-4 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <AiOutlineReload className="mr-2 md:mr-3 text-xl md:text-2xl" />
            <span className="text-lg md:text-xl font-bold text-white">
              Actualizar
            </span>
          </button>
        </div>
      </div>

      {/* Tabla de registro */}
      <table className="min-w-full bg-gray-800 rounded-lg shadow-lg mb-8">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
              Número de Nómina
            </th>
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
              Paciente
            </th>
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
              Edad
            </th>
            <th className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
              Secretaría
            </th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((paciente, index) => (
            <tr
              key={index}
              className="hover:bg-gray-600 transition-colors duration-300 cursor-pointer"
            >
              <td className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
                {paciente.nomina}
              </td>
              <td className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
                {paciente.name}
              </td>
              <td className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
                {paciente.age}
              </td>
              <td className="py-2 md:py-3 px-2 md:px-4 text-left text-sm md:text-base">
                {paciente.department}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para agregar signos vitales */}
      {showConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg w-full max-w-[90vw] md:max-w-[70vw] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              X
            </button>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Consulta General
            </h2>
            <p className="text-xs md:text-sm mb-2">
              Fecha: {new Date().toLocaleDateString()}
            </p>
            <input
              type="text"
              value={nomina}
              onChange={(e) => setNomina(e.target.value)}
              placeholder="Número de Nómina"
              className="mt-2 mb-4 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-yellow-400 transition duration-200 w-full"
            />
            <button
              onClick={handleSearch}
              className="bg-yellow-600 px-4 md:px-5 py-2 rounded-lg hover:bg-yellow-500 transition duration-200 font-semibold w-full"
            >
              Buscar
            </button>

            {/* Datos del paciente */}
            <div className="flex flex-row mt-6 items-center bg-gray-900 p-4 rounded-lg shadow-md space-x-4">
              <Image
                src={patientData.photo}
                alt="Foto del Paciente"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg"
              />
              <div className="flex-1">
                <p className="text-lg md:text-xl font-semibold">
                  Paciente: {patientData.name || ""}
                </p>
                <p className="text-sm md:text-md">
                  Edad: {patientData.age || ""}
                </p>
                <p className="text-sm md:text-md">
                  Departamento: {patientData.department || ""}
                </p>
                <p className="text-sm md:text-md">
                  Puesto: {patientData.workstation || ""}
                </p>
              </div>
            </div>

            {/* Formulario de Signos Vitales */}
            <div className="mt-6">
              <h3 className="text-xl md:text-2xl font-bold mb-4">
                Signos Vitales
              </h3>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label>
                  T/A:
                  <input
                    type="text"
                    name="ta"
                    value={signosVitales.ta}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
                <label>
                  Temperatura ( °C ):
                  <input
                    type="number"
                    name="temperatura"
                    value={signosVitales.temperatura}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
                <label>
                  FC ( por minuto ):
                  <input
                    type="number"
                    name="fc"
                    value={signosVitales.fc}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
                <label>
                  Oxigenación ( % ):
                  <input
                    type="number"
                    name="oxigenacion"
                    value={signosVitales.oxigenacion}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
                <label>
                  Altura ( cm ):
                  <input
                    type="number"
                    name="altura"
                    value={signosVitales.altura}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
                <label>
                  Peso ( kg ):
                  <input
                    type="number"
                    name="peso"
                    value={signosVitales.peso}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
                <label>
                  Glucosa ( mg / dL ):
                  <input
                    type="number"
                    name="glucosa"
                    value={signosVitales.glucosa}
                    onChange={handleVitalChange}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  />
                </label>
              </form>
              <div className="mt-6">
                <button
                  onClick={handleSave}
                  className="bg-yellow-600 px-4 md:px-5 py-2 rounded-lg hover:bg-yellow-500 transition duration-200 font-semibold w-full"
                >
                  Guardar Signos Vitales
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignosVitales;
