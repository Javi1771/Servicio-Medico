import React, { createContext, useState } from "react";

export const FormularioContext = createContext();

export const FormularioProvider = ({ children }) => {
  const pantallasIniciales = {
    DatosAdicionales: true, 
    Medicamentos: true, 
    PaseEspecialidad: true, 
    Incapacidades: true, 
  };  

  const [formulariosCompletos, setFormulariosCompletos] = useState(
    pantallasIniciales
  );
  const [todosCompletos, setTodosCompletos] = useState(false);

  const updateFormulario = (pantalla, completo) => {
    setFormulariosCompletos((prevState) => {
      if (prevState[pantalla] !== completo) {
        const nuevoEstado = { ...prevState, [pantalla]: completo };
        setTodosCompletos(Object.values(nuevoEstado).every((estado) => estado));
        return nuevoEstado;
      }
      return prevState; //! No actualizar si no hay cambios
    });
  };

  return (
    <FormularioContext.Provider
      value={{ formulariosCompletos, todosCompletos, updateFormulario }}
    >
      {children}
    </FormularioContext.Provider>
  );
};

