import React, { createContext, useState } from "react";

export const FormularioContext = createContext();

export const FormularioProvider = ({ children }) => {
  const [formulariosCompletos, setFormulariosCompletos] = useState({});
  const [todosCompletos, setTodosCompletos] = useState(false);

  const updateFormulario = (pantalla, completo) => {
    setFormulariosCompletos((prevState) => {
      // Solo actualizar si el valor cambia
      if (prevState[pantalla] !== completo) {
        const nuevoEstado = { ...prevState, [pantalla]: completo };
        setTodosCompletos(Object.values(nuevoEstado).every((estado) => estado));
        return nuevoEstado;
      }
      return prevState; // No actualizar si no hay cambios
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
