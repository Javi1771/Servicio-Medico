import React, { useState } from "react";

const FormMedicamento = ({ onAddMedicamento, message }) => {
  const [formData, setFormData] = useState({
    medicamento: "",
    clasificacion: "",
    presentacion: "",
    ean: "",
    piezas: "",
    minimo: "",
    maximo: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onAddMedicamento({
      medicamento: formData.medicamento,
      clasificacion: formData.clasificacion,
      presentacion: parseInt(formData.presentacion, 10),
      ean: parseInt(formData.ean, 10),
      piezas: parseInt(formData.piezas, 10),
      minimo: parseInt(formData.minimo, 10),
      maximo: parseInt(formData.maximo, 10),
    });

    // Reset del formulario
    setFormData({
      medicamento: "",
      clasificacion: "",
      presentacion: "",
      ean: "",
      piezas: "",
      minimo: "",
      maximo: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gradient-to-br from-[#040f0f] to-[#0c1e1e] rounded-3xl border border-teal-500 border-opacity-40 shadow-[0_0_30px_#0ff]">
      <h2
        className="text-5xl font-extrabold text-teal-300 mb-8 text-center tracking-wider uppercase"
        style={{ textShadow: "0 0 15px #0ff" }}
      >
        💊 Registro de Medicamentos
      </h2>

      {/* Mensaje de retroalimentación, si existe */}
      {message && (
        <p className="bg-[#0c3e3e] text-white p-3 rounded mb-4 text-center font-medium">
          {message}
        </p>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Medicamento */}
        <div className="flex flex-col">
          <label
            htmlFor="medicamento"
            className="mb-1 font-semibold text-teal-300"
          >
            Medicamento:
          </label>
          <input
            type="text"
            id="medicamento"
            name="medicamento"
            value={formData.medicamento}
            onChange={handleChange}
            placeholder="Nombre + gramaje o ml"
            required
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          />
        </div>

        {/* Clasificación */}
        <div className="flex flex-col">
          <label
            htmlFor="clasificacion"
            className="mb-1 font-semibold text-teal-300"
          >
            Clasificación:
          </label>
          <select
            id="clasificacion"
            name="clasificacion"
            value={formData.clasificacion}
            onChange={handleChange}
            required
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          >
            <option value="">Seleccione una opción</option>
            <option value="p">PATENTE</option>
            <option value="g">GENÉRICO</option>
            <option value="c">CONTROLADO</option>
            <option value="e">ESPECIALIDAD</option>
          </select>
        </div>

        {/* Presentación */}
        <div className="flex flex-col">
          <label
            htmlFor="presentacion"
            className="mb-1 font-semibold text-teal-300"
          >
            Presentación:
          </label>
          <input
            type="text"
            id="presentacion"
            name="presentacion"
            value={formData.presentacion}
            onChange={(e) => {
              // Permitir sólo números
              const numericValue = e.target.value.replace(/\D/g, "");
              setFormData((prev) => ({
                ...prev,
                presentacion: numericValue,
              }));
            }}
            placeholder="Piezas por caja o sobre o frasco"
            required
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          />
        </div>

        {/* EAN */}
        <div className="flex flex-col">
          <label htmlFor="ean" className="mb-1 font-semibold text-teal-300">
            EAN (Código de Barras):
          </label>
          <input
            type="text"
            inputMode="numeric"
            id="ean"
            name="ean"
            value={formData.ean}
            onChange={handleChange}
            placeholder="Ingresa el código de barras"
            required
            pattern="^(\d{8}|\d{13})$"
            title="El código EAN debe tener 8 o 13 dígitos"
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          />
        </div>

        {/* Piezas */}
        <div className="flex flex-col">
          <label htmlFor="piezas" className="mb-1 font-semibold text-teal-300">
            Piezas:
          </label>
          <input
            type="number"
            id="piezas"
            name="piezas"
            value={formData.piezas}
            onChange={handleChange}
            placeholder="Ingresa el número de piezas en almacén"
            required
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          />
        </div>

        {/* Mínimo */}
        <div className="flex flex-col">
          <label htmlFor="minimo" className="mb-1 font-semibold text-teal-300">
            Mínimo:
          </label>
          <input
            type="number"
            id="minimo"
            name="minimo"
            value={formData.minimo}
            onChange={handleChange}
            placeholder="Stock mínimo permitido"
            required
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          />
        </div>

        {/* Máximo */}
        <div className="flex flex-col">
          <label htmlFor="maximo" className="mb-1 font-semibold text-teal-300">
            Máximo:
          </label>
          <input
            type="number"
            id="maximo"
            name="maximo"
            value={formData.maximo}
            onChange={handleChange}
            placeholder="Stock máximo permitido"
            required
            className="p-2 rounded-md border border-teal-500 bg-[#041616] text-teal-200 
                       focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       placeholder:text-teal-500 transition-colors"
          />
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="mt-4 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 
                     hover:from-teal-600 hover:to-cyan-600 text-white font-extrabold 
                     uppercase tracking-wide rounded-full shadow-2xl 
                     transition-transform duration-300 transform hover:scale-105 
                     focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          Registrar
        </button>
      </form>
    </div>
  );
};

export default FormMedicamento;
