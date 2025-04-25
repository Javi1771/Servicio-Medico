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
    backgroundColor: state.isFocused
      ? "#6B7280"
      : state.data && state.data.isDisabled
      ? "#1F2937" //* Fondo más oscuro para deshabilitados
      : "#374151",
    color: state.data && state.data.isDisabled ? "#e7e7e7" : "#fff",
    padding: "0.5rem 1rem",
    cursor: state.data && state.data.isDisabled ? "not-allowed" : "pointer",
    opacity: state.data && state.data.isDisabled ? 0.5 : 1,
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

export default function MedicamentoDropdown({
  listaMedicamentos = [],
  value,
  onChangeMedicamento,
  isLoading = false,
}) {
  //* Aseguramos que listaMedicamentos sea un arreglo
  const medicamentosArray = Array.isArray(listaMedicamentos)
    ? listaMedicamentos
    : [];

  //* Convertimos el arreglo a formato de react-select
  const opcionesMedicamentos = medicamentosArray.map((m) => ({
    value: m.CLAVEMEDICAMENTO,
    label: `${m.MEDICAMENTO} --- Presentación Por Caja: ${
      m.presentacion || "Sin existencias"
    } --- Cajas Disponibles: ${m.piezas > 0 ? m.piezas : "Sin existencias"}`,
    // Deshabilitación temporal comentada para permitir cualquier selección
    // isDisabled:
    //   m.piezas <= 0 || m.presentacion <= 0 || m.clasificacion === null || m.clasificacion === undefined || m.clasificacion === "" || m.ean === null || m.ean === undefined || m.ean === "",
    isDisabled: false,
    data: m,
  }));

  //* Agregamos una opción placeholder al inicio de la lista de opciones
  const opcionesConPlaceholder = [
    {
      value: "",
      label: "Seleccionar Medicamento",
      isDisabled: true,
    },
    ...opcionesMedicamentos,
  ];

  //* Si no se ha seleccionado un medicamento (value es falsy), se usa la opción placeholder.
  const opcionSeleccionada = value
    ? opcionesMedicamentos.find((opt) => opt.value === value)
    : opcionesConPlaceholder[0];

  //* Manejamos el cambio de selección
  const handleChange = (selectedOption) => {
    if (!selectedOption) return;

    //* Si se selecciona el placeholder, no hacemos nada.
    if (selectedOption.value === "") return;

    const selectedMedicamento = selectedOption.data;

    // Validaciones temporales comentadas para permitir cualquier selección
    /*
    if (
      selectedMedicamento.piezas <= 0 ||
      selectedMedicamento.presentacion <= 0 ||
      selectedMedicamento.clasificacion === null
    ) {
      if (playSound) playSound(false);
      Swal.fire({
        icon: "error",
        title:
          "<span style='color: #ff1744; font-weight: bold; font-size: 1.5em;'>❌ No disponible</span>",
        html:
          selectedMedicamento.clasificacion === null
            ? "<p style='color: #fff; font-size: 1.1em;'>Este medicamento no tiene clasificación asignada.</p>"
            : "<p style='color: #fff; font-size: 1.1em;'>Este medicamento no tiene existencias en farmacia.</p>",
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
    */

    //* Avisamos al padre el cambio (solo si es válido)
    onChangeMedicamento(selectedMedicamento.CLAVEMEDICAMENTO);
  };

  return (
    <Select
      className="mt-2"
      classNamePrefix="react-select"
      styles={customStyles}
      options={opcionesConPlaceholder}
      value={opcionSeleccionada}
      onChange={handleChange}
      placeholder="Seleccionar Medicamento"
      isSearchable
      isOptionDisabled={(option) => option.isDisabled}
      filterOption={createFilter({ matchFrom: "any" })}
      //* Se activa el loader si isLoading es true o si la lista está vacía
      isLoading={isLoading || medicamentosArray.length === 0}
      loadingMessage={() => "Cargando medicamentos..."}
    />
  );
}
