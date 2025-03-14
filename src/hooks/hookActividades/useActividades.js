// src/hooks/useActividades.js
import { useEffect, useState } from "react";

export function useActividades() {
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    // Función auxiliar para cargar datos de la API
    const fetchActividades = () => {
      fetch("/api/Actividad/actividades")
        .then((res) => res.json())
        .then((data) => {
          setActividades(data);
        })
        .catch((err) =>
          console.error("Error al obtener datos iniciales:", err)
        );
    };

    // 1. Cargar datos iniciales una vez
    fetchActividades();
    // 2. Establecer un intervalo de 5 segundos para volver a cargar
    const intervalId = setInterval(() => {
      fetchActividades();
    }, 5000);

    // 3. Limpiar el intervalo al desmontar
    return () => clearInterval(intervalId);
  }, []);

  return actividades;
}
