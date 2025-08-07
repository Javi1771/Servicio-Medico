import React, { useState, useEffect } from "react";
import { showCustomAlert } from "../../../utils/alertas";

const EditMedicamentoForm = ({ medicamento, onEdit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    medicamento: "",
    clasificacion: "",
    presentacion: "",
    ean: "",
    piezas: "",
    maximo: "",
    minimo: "",
    medida: "",        // Aquí se guarda el id de la unidad
    unidadMedida: "",  // Aquí se guarda el nombre de la unidad
    precio: ""         // <-- NUEVO: Agregamos campo precio
  });

  // Estado para las unidades de medida traídas de la API
  const [unidades, setUnidades] = useState([]);

  // Fetch de las unidades de medida desde el endpoint
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const res = await fetch("/api/farmacia/unidades");
        if (!res.ok) {
          throw new Error("Error al obtener las unidades de medida");
        }
        const data = await res.json();
        setUnidades(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUnidades();
  }, []);

  // Cuando cargamos el medicamento, llenamos el form con sus datos,
  // incluyendo el precio si existe
  useEffect(() => {
    if (medicamento) {
      //console.log("📌 Medicamento recibido:", medicamento);
      setFormData({
        id: medicamento.id || "",
        medicamento: medicamento.medicamento || "",
        clasificacion: medicamento.clasificacion
          ? medicamento.clasificacion.toLowerCase()
          : "",
        presentacion: medicamento.presentacion || "",
        ean: medicamento.ean || "",
        piezas: medicamento.piezas || "",
        maximo: medicamento.maximo || "",
        minimo: medicamento.minimo || "",
        medida: medicamento.medida || "",      // ID
        unidadMedida: medicamento.unidadMedida || "", // Nombre
        precio: medicamento.precio || ""       // <-- Capturamos precio
      });
    }
  }, [medicamento]);

  // Handler para inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Al enviar el formulario:
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación mínima
    if (
      !formData.presentacion ||
      !formData.ean ||
      !formData.piezas ||
      !formData.maximo ||
      !formData.minimo ||
      !formData.medida ||
      !formData.precio        // <-- Incluimos precio si es obligatorio
    ) {
await showCustomAlert(
  "error",
  "Campos incompletos",
  "Todos los campos son obligatorios. Asegúrate de completar la información.",
  "Aceptar"
);

      return;
    }

await showCustomAlert(
  "warning",
  "¿Estás seguro?",
  "Los cambios serán permanentes.",
  "Sí, guardar",
  {
    showCancelButton: true,
    confirmButtonColor: "#ff9800",
    cancelButtonColor: "#d33",
    cancelButtonText: "Cancelar",
    background: "linear-gradient(145deg, #4a2600, #220f00)",
    customClass: {
      popup:
        "border border-yellow-600 shadow-[0px_0px_25px_5px_rgba(255,152,0,0.9)] rounded-lg"
    }
  }
).then(async (result) => {
      if (result.isConfirmed) {
        // Llamamos onEdit con todos los datos, incluyendo precio.
        onEdit({
          id: formData.id,
          medicamento: formData.medicamento,
          clasificacion: formData.clasificacion,
          presentacion: parseInt(formData.presentacion, 10),
          ean: formData.ean,
          piezas: parseInt(formData.piezas, 10),
          maximo: parseInt(formData.maximo, 10),
          minimo: parseInt(formData.minimo, 10),
          medida: formData.medida,
          precio: parseFloat(formData.precio) // <-- Convertir a número
        });

await showCustomAlert(
  "success",
  "Cambios guardados",
  "El medicamento ha sido actualizado exitosamente.",
  "Aceptar",
);

      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-gradient-to-br from-[#040f0f] to-[#0c1e1e] text-teal-200 border border-teal-500 border-opacity-30 rounded-2xl shadow-[0_0_40px_rgba(0,255,255,0.2)] p-8 w-full max-w-lg mx-4">
        <h2 className="text-3xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] uppercase tracking-wide">
          Editar Medicamento
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Medicamento */}
          <div>
            <label className="text-sm font-semibold mb-1">Medicamento:</label>
            <input
              type="text"
              name="medicamento"
              value={formData.medicamento}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg text-gray-300 shadow-inner"
            />
          </div>

          {/* Clasificación */}
          <div>
            <label className="text-sm font-semibold mb-1">Clasificación:</label>
            <select
              name="clasificacion"
              value={formData.clasificacion}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#041616] border border-teal-500 rounded-lg text-teal-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              <option value="p">PATENTE</option>
              <option value="g">GENERICO</option>
              <option value="c">CONTROLADO</option>
              <option value="e">ESPECIALIDAD</option>
            </select>
          </div>

          {/* Unidad de Medida */}
          <div className="flex flex-col">
            <label htmlFor="medida" className="mb-1 font-semibold text-teal-300">
              Unidad de Medida:
            </label>
            <select
              id="medida"
              name="medida"
              value={String(formData.medida)}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#041616] border border-teal-500 rounded-lg text-teal-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            >
              {formData.medida === "" && (
                <option value="">Seleccione una unidad</option>
              )}

              {formData.medida &&
                !unidades.some(
                  (u) => String(u.code) === String(formData.medida)
                ) && (
                  <option value={String(formData.medida)}>
                    {formData.unidadMedida}
                  </option>
                )}

              {unidades.map((unidad) => (
                <option key={unidad.code} value={String(unidad.code)}>
                  {unidad.label}
                </option>
              ))}
            </select>
          </div>

          {/* Presentación */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Presentación:
            </label>
            <input
              type="number"
              name="presentacion"
              value={formData.presentacion}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="*Cantidad de producto por caja o frasco*"
            />
          </div>

          {/* EAN */}
          <div>
            <label className="block text-sm font-semibold mb-1">EAN:</label>
            <input
              type="text"
              name="ean"
              value={formData.ean || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  setFormData({ ...formData, ean: value });
                }
              }}
              required
              placeholder="*Escanea el código (cualquier cantidad de dígitos)*"
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-500 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          {/* Piezas */}
          <div>
            <label className="block text-sm font-semibold mb-1">Piezas:</label>
            <input
              type="number"
              name="piezas"
              value={formData.piezas || ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="*Cantidad de cajas o frascos en stock*"
            />
          </div>

          {/* Máximo */}
          <div>
            <label className="block text-sm font-semibold mb-1">Máximo:</label>
            <input
              type="number"
              name="maximo"
              value={formData.maximo || ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="*Cantidad máxima permitida*"
            />
          </div>

          {/* Mínimo */}
          <div>
            <label className="block text-sm font-semibold mb-1">Mínimo:</label>
            <input
              type="number"
              name="minimo"
              value={formData.minimo || ""}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="*Cantidad mínima permitida*"
            />
          </div>

          {/* PRECIO - NUEVO CAMPO */}
          <div>
            <label className="block text-sm font-semibold mb-1">Precio:</label>
            <input
              type="number"
              name="precio"
              step="0.01"
              value={formData.precio}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="Ej. 123.45"
            />
          </div>

          {/* Botones Guardar/Cancelar */}
          <div className="flex justify-between gap-4 mt-4">
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMedicamentoForm;
