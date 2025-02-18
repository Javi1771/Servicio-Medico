import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const EditMedicamentoForm = ({ medicamento, onEdit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    medicamento: "",
    clasificación: "",
    presentacion: "",
    ean: "",
    piezas: "",
  });

  useEffect(() => {
    if (medicamento) {
      setFormData({
        id: medicamento.id || "",
        medicamento: medicamento.medicamento || "",
        clasificación: medicamento.clasificación
          ? medicamento.clasificación.toLowerCase()
          : "",
        presentacion: medicamento.presentacion || "",
        ean: medicamento.ean || "",
        piezas: medicamento.piezas || "",
      });
    }
  }, [medicamento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.presentacion || !formData.ean || !formData.piezas) {
      Swal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>⚠️ Campos incompletos</span>",
        html: "<p style='color: #fff; font-size: 1.2em;'>Todos los campos son obligatorios. Asegúrate de completar la información.</p>",
        background: "linear-gradient(145deg, #4a0000, #220000)",
        confirmButtonColor: "#ff1744",
        confirmButtonText:
          "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
        customClass: {
          popup:
            "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
        },
      });
      return;
    }

    Swal.fire({
      title:
        "<span style='color: #ff9800; font-weight: bold; font-size: 1.6em;'>⚠️ ¿Estás seguro?</span>",
      html: "<p style='color: #fff; font-size: 1.2em;'>Los cambios serán permanentes.</p>",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff9800",
      cancelButtonColor: "#d33",
      confirmButtonText:
        "<span style='color: #fff; font-weight: bold;'>Sí, guardar</span>",
      cancelButtonText:
        "<span style='color: #fff; font-weight: bold;'>Cancelar</span>",
      background: "linear-gradient(145deg, #4a2600, #220f00)",
      customClass: {
        popup:
          "border border-yellow-600 shadow-[0px_0px_25px_5px_rgba(255,152,0,0.9)] rounded-lg",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onEdit({
          id: formData.id,
          medicamento: formData.medicamento,
          clasificación: formData.clasificación,
          presentacion: parseInt(formData.presentacion, 10),
          ean: parseInt(formData.ean, 10),
          piezas: parseInt(formData.piezas, 10),
        });

        Swal.fire({
          icon: "success",
          title:
            "<span style='color: #00e676; font-weight: bold; font-size: 1.8em;'>✔️ Cambios guardados</span>",
          html: "<p style='color: #fff; font-size: 1.2em;'>El medicamento ha sido actualizado exitosamente.</p>",
          background: "linear-gradient(145deg, #003300, #001a00)",
          confirmButtonColor: "#00e676",
          confirmButtonText:
            "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
          customClass: {
            popup:
              "border border-green-600 shadow-[0px_0px_25px_5px_rgba(0,255,118,0.7)] rounded-lg",
          },
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Contenedor principal con gradiente oscuro y borde neón */}
      <div className="relative bg-gradient-to-br from-[#040f0f] to-[#0c1e1e] text-teal-200 border border-teal-500 border-opacity-30 rounded-2xl shadow-[0_0_40px_rgba(0,255,255,0.2)] p-8 w-full max-w-lg mx-4">
        {/* Título con efecto neón */}
        <h2 className="text-3xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] uppercase tracking-wide">
          Editar Medicamento
        </h2>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Medicamento */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Medicamento:
            </label>
            <input
              type="text"
              name="medicamento"
              value={formData.medicamento}
              readOnly
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg text-gray-300 cursor-not-allowed shadow-inner"
            />
          </div>

          {/* Clasificación */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Clasificación:
            </label>
            <select
              name="clasificación"
              value={formData.clasificación}
              disabled
              className="w-full px-4 py-2 bg-[#0b2424] border border-teal-600 rounded-lg text-gray-300 cursor-not-allowed shadow-inner"
            >
              <option value="p">PATENTE</option>
              <option value="g">GENERICO</option>
              <option value="c">CONTROLADO</option>
              <option value="e">ESPECIALIDAD</option>
            </select>
          </div>

          {/* Presentación */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Presentación:
            </label>
            <input
              type="number"
              name="presentación"
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
                if (/^\d{0,13}$/.test(value)) {
                  setFormData({ ...formData, ean: value });
                }
              }}
              onBlur={() => {
                if (formData.ean.length !== 8 && formData.ean.length !== 13) {
                  Swal.fire({
                    icon: "error",
                    title:
                      "<span style='color: #ff1744; font-weight: bold;'>⚠️ EAN inválido</span>",
                    html: "<p style='color: #fff; font-size: 1.2em;'>El código EAN debe tener 8 o 13 dígitos.</p>",
                    background: "linear-gradient(145deg, #4a0000, #220000)",
                    confirmButtonColor: "#ff1744",
                    confirmButtonText:
                      "<span style='color: #fff; font-weight: bold;'>Aceptar</span>",
                    customClass: {
                      popup:
                        "border border-red-600 shadow-[0px_0px_20px_5px_rgba(255,23,68,0.9)] rounded-lg",
                    },
                  });
                  setFormData({ ...formData, ean: "" });
                }
              }}
              required
              placeholder="*Escanea de 8 o 13 dígitos*"
              maxLength={13}
              pattern="\d{8}|\d{13}"
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

          {/* Botones */}
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
