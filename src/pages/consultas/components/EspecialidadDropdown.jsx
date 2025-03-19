import React from "react";
import Select, { createFilter } from "react-select";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#374151", 
    border: "1px solid #4B5563", 
    borderRadius: "0.5rem", 
    height: "3rem", 
    padding: "0.5rem 1rem",
    fontSize: "1.125rem", 
    boxShadow: state.isFocused ? "0 0 0 2px #7E22CE" : null, 
    color: "#fff",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#6B7280" : "#374151",
    color: "#fff",
    padding: "0.5rem 1rem",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#374151",
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#D1D5DB", 
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#fff",
  }),
  input: (provided) => ({
    ...provided,
    color: "#fff",
  }),
};

const EspecialidadDropdown = ({ especialidades = [], value, onChange }) => {
  //* Convertimos el arreglo a formato de react-select
  const opcionesEspecialidades = especialidades.map((esp) => ({
    value: esp.claveespecialidad,
    label: esp.especialidad,
    data: esp,
  }));

  //* Agregamos una opción placeholder al inicio de la lista de opciones
  const opcionesConPlaceholder = [
    {
      value: "",
      label: "Seleccionar Especialidad",
      isDisabled: true,
    },
    ...opcionesEspecialidades,
  ];

  //* Si no se ha seleccionado nada, se muestra el placeholder
  const opcionSeleccionada = value
    ? opcionesEspecialidades.find((opt) => opt.value === value)
    : opcionesConPlaceholder[0];

  const handleChange = (selectedOption) => {
    if (!selectedOption || selectedOption.value === "") return;
    onChange(selectedOption.value);
  };

  return (
    <Select
      className="mt-2"
      classNamePrefix="react-select"
      styles={customStyles}
      value={opcionSeleccionada}
      onChange={handleChange}
      options={opcionesConPlaceholder}
      placeholder="Seleccionar Especialidad"
      isSearchable
      filterOption={createFilter({ matchFrom: "any" })}
    />
  );
};

export default EspecialidadDropdown;
