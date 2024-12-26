import { useState, useEffect } from "react";

const useHistorialSurtimientos = (folioPase) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Evita solicitudes innecesarias si no hay folioPase
    if (!folioPase) {
      console.warn("Folio Pase no está definido. No se hará ninguna solicitud.");
      return;
    }

    let isMounted = true; // Controla si el componente está montado

    const fetchHistorial = async () => {
      console.log("Iniciando solicitud para historial de surtimientos...");

      try {
        setLoading(true);
        setError(null);

        // Solicita datos desde la API
        const response = await fetch(
          `/api/surtimientos/getHistorialSurtimientos?folioPase=${folioPase}`
        );

        if (!response.ok) {
          throw new Error("Error al obtener el historial");
        }

        const data = await response.json();

        // Depuración: Verifica la respuesta de la API
        console.log("Datos obtenidos del historial:", data.data);

        if (isMounted) {
          setHistorial(data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
        console.error("Error al obtener el historial:", err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        console.log("Finalizó la solicitud de historial.");
      }
    };

    fetchHistorial();

    return () => {
      isMounted = false; // Evita actualizaciones si el componente se desmonta
    };
  }, [folioPase]); // Solo se ejecuta si `folioPase` cambia

  return { historial, loading, error };
};

export default useHistorialSurtimientos;
