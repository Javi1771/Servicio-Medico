
import { useState, useCallback } from "react";

export default function useFetchEmpleado() {
  const [empleadoData, setEmpleadoData] = useState(null);
  const [empleadoError, setEmpleadoError] = useState(null);
  const [empleadoLoading, setEmpleadoLoading] = useState(false);

  const fetchEmpleado = useCallback(async (numNom) => {
    //console.log("Realizando consulta al web service con numNom:", numNom);
    setEmpleadoLoading(true);
    setEmpleadoError(null);
    setEmpleadoData(null);

    try {
      const response = await fetch(`/api/empleado`, {
        method: "POST", // Método POST
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: numNom }), // Cuerpo con número de nómina
      });

      //console.log("Respuesta del servidor:", response);

      if (!response.ok) {
        throw new Error(`Error al obtener empleado: ${response.statusText}`);
      }

      const data = await response.json();

      // Calcular la edad a partir de la fecha de nacimiento
      const calcularEdad = (fechaNacimiento) => {
        // Normalizar la fecha al formato ISO
        const fechaISO = fechaNacimiento.split(" ")[0].split("/").reverse().join("-");
        const birthDate = new Date(fechaISO);
        
        if (isNaN(birthDate)) {
          console.error("Fecha de nacimiento no válida:", fechaNacimiento);
          return "Desconocida";
        }

        const today = new Date();
        let edad = today.getFullYear() - birthDate.getFullYear();

        // Ajuste si el cumpleaños aún no ha ocurrido este año
        if (
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate())
        ) {
          edad--;
        }

        return edad;
      };

      const empleadoConEdad = {
        ...data,
        edad: calcularEdad(data.fecha_nacimiento), // Calcular edad
      };

      setEmpleadoData(empleadoConEdad);
    } catch (error) {
      console.error("Error al consultar el empleado:", error.message);
      setEmpleadoError(error.message);
    } finally {
      setEmpleadoLoading(false);
    }
  }, []);

  return { empleadoData, empleadoError, empleadoLoading, fetchEmpleado };
}