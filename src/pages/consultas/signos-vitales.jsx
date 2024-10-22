import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineUserAdd, AiOutlineReload } from "react-icons/ai";

const SignosVitales = () => {
  const [patientData, setPatientData] = useState({
    photo: "/user_icon_.png",
    name: "",
    age: "",
    department: "",
    relationship: "",
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

  const handleAdd = () => {
    setShowConsulta(true);
  };

  const handleCloseModal = () => {
    setShowConsulta(false);
  };

  const handleSearch = async () => {
    const response = await fetch(
      `http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?id=${nomina}`
    );
    const data = await response.json();

    setPatientData({
      photo: data.photo || "/user_icon_.png",
      name: data.name || "",
      age: data.age || "",
      department: data.department || "",
      relationship: data.relationship || "",
    });
  };

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setSignosVitales((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Lógica para guardar los signos vitales
    console.log("Signos vitales guardados:", signosVitales);
    handleCloseModal(); // Cerrar la ventana emergente después de guardar
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col items-center p-8">
      <div className="flex items-center justify-between w-full mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/estetoscopio.png"
            alt="Estetoscopio"
            width={160}
            height={160}
            className="h-40 w-40 object-cover rounded-full bg-gray-600"
          />
          <h1 className="text-5xl font-extrabold">Registro de Pacientes</h1>
        </div>

        <div className="flex space-x-6 mb-6">
          <button
            onClick={handleAdd}
            className="flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 px-10 py-4 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <AiOutlineUserAdd className="mr-3 text-2xl" />
            <span className="text-xl font-bold text-white">Agregar</span>
          </button>
          <button
            className="flex items-center bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-400 hover:to-teal-500 px-10 py-4 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <AiOutlineReload className="mr-3 text-2xl" />
            <span className="text-xl font-bold text-white">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Tabla de registro */}
      <table className="min-w-full bg-gray-800 rounded-lg shadow-lg mb-8">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="py-3 px-4 text-left">Número de Nómina</th>
            <th className="py-3 px-4 text-left">Paciente</th>
            <th className="py-3 px-4 text-left">Edad</th>
            <th className="py-3 px-4 text-left">Secretaria</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-600 transition-colors duration-300 cursor-pointer">
            <td className="py-3 px-4 text-left">002</td>
            <td className="py-3 px-4 text-left">Pancho Juarez</td>
            <td className="py-3 px-4 text-left">41</td>
            <td className="py-3 px-4 text-left">Salud</td>
          </tr>
        </tbody>
      </table>

      {/* Modal para agregar signos vitales */}
      {showConsulta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-[70vw] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              X
            </button>
            <h2 className="text-3xl font-semibold mb-4">Consulta General</h2>
            <p className="text-sm mb-2">
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
              className="bg-yellow-600 px-5 py-2 rounded-lg hover:bg-yellow-500 transition duration-200 font-semibold w-full"
            >
              Buscar
            </button>

            <div className="flex mt-6 items-center bg-gray-900 p-4 rounded-lg shadow-md">
              <Image
                src={patientData.photo}
                alt="Foto del Paciente"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg"
              />
              <div className="ml-6">
                <p className="text-xl font-semibold">
                  Paciente: {patientData.name || ""}
                </p>
                <p className="text-md">Edad: {patientData.age || ""}</p>
                <p className="text-md">
                  Departamento: {patientData.department || ""}
                </p>
                <p className="text-md">
                  Parentesco: {patientData.relationship || ""}
                </p>
              </div>
            </div>

            {/* Formulario de Signos Vitales */}
            <div className="mt-6">
              <h3 className="text-2xl font-bold mb-4">Signos Vitales</h3>
              <form className="grid grid-cols-2 gap-4">
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
                  className="bg-yellow-600 px-5 py-2 rounded-lg hover:bg-yellow-500 transition duration-200 font-semibold w-full"
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
