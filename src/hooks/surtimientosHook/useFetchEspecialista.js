import { useState } from "react";

export default function useFetchEspecialista() {
  const [especialista, setEspecialista] = useState(null);
  const [error, setError] = useState(null);

  const fetchEspecialista = async (claveProveedor) => {
    try {
      // 1. Consultar el especialista en la tabla [USUARIOS]
      const usuarioResponse = await fetch(
        `/api/surtimientos/getEspecialista?claveProveedor=${claveProveedor}`
      );

      if (!usuarioResponse.ok) {
        throw new Error("No se pudo obtener el especialista.");
      }

      const usuarioData = await usuarioResponse.json();
      const { nombreusuario, claveespecialidad } = usuarioData;

      // 2. Consultar el nombre de la especialidad en la tabla [especialidades]
      const especialidadResponse = await fetch(
        `/api/surtimientos/getEspecialidad?claveEspecialidad=${claveespecialidad}`
      );

      if (!especialidadResponse.ok) {
        throw new Error("No se pudo obtener la especialidad.");
      }

      const especialidadData = await especialidadResponse.json();
      const { especialidad } = especialidadData;

      // 3. Combinar datos del especialista y su especialidad
      setEspecialista({
        nombre: nombreusuario,
        especialidad,
      });
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return { especialista, fetchEspecialista, error };
}
