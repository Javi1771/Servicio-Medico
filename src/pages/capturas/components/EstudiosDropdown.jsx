import React from "react";
import Select, { createFilter } from "react-select";
import { FaToolbox, FaPlus, FaTrash } from "react-icons/fa";

export default function StudySelector({
  studyOptions,
  selectedStudies,
  onChangeStudy,
  onAddStudy,
  onRemoveStudy,
  loading = false,
}) {
  //* Convertimos el arreglo de estudios a formato para react-select
  const opcionesEstudios = studyOptions.map((opt) => ({
    value: opt.claveEstudio,
    label: opt.estudio,
  }));

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#fff",
      border: "1px solid #00CEFF",
      borderRadius: "0.5rem",
      minHeight: "3rem",
      padding: "0.5rem 1rem",
      fontSize: "1rem",
      boxShadow: state.isFocused ? "0 0 0 2px #0093D0" : null,
      color: "#00384B",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "0.5rem",
      overflow: "hidden",
      backgroundColor: "#F0F8FF", 
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#E0F7FA" : "#fff",
      color: "#00384B",
      padding: "0.5rem 1rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#888",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#00384B",
    }),
  };

  return (
    <div className="mb-4">
      <label className="block text-lg font-bold mb-2 text-[#00576A] flex items-center gap-2">
        <FaToolbox className="text-xl" /> Seleccionar Estudios:
      </label>
      {selectedStudies.map((study, studyIndex) => (
        <div key={studyIndex} className="flex items-center gap-2 mb-2">
          <Select
            value={opcionesEstudios.find((opt) => opt.value === study) || null}
            onChange={(selectedOption) =>
              onChangeStudy(studyIndex, selectedOption.value)
            }
            options={opcionesEstudios}
            isSearchable
            isLoading={loading}
            loadingMessage={() => "Cargando estudios..."}
            placeholder="Seleccione un estudio"
            styles={customStyles}
            filterOption={createFilter({ matchFrom: "any" })}
            className="w-full"
            menuPortalTarget={document.body}
          />
          {selectedStudies.length > 1 && (
            <button
              onClick={() => onRemoveStudy(studyIndex)}
              className="text-red-500 hover:text-red-700 transition transform hover:scale-110"
            >
              <FaTrash />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAddStudy}
        className="flex items-center gap-2 bg-[#00CEFF] hover:bg-[#0093D0] text-[#00384B] font-bold py-2 px-4 rounded-xl transition transform hover:scale-105 shadow"
      >
        <FaPlus />
        <span>Agregar otro estudio</span>
      </button>
    </div>
  );
}
