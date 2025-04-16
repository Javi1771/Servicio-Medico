import { useState } from "react";

export default function useFetchDetallesByFolioPase() {
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetallesByFolioPase = async (folioPase) => {
    setLoading(true);
    setError(null);
    setDetalles([]);

    try {
      // Primera consulta: Obtener FOLIO_SURTIMIENTO
      const responseFolio = await fetch(`/api/surtimientos/getFolioSurtimiento?folioPase=${folioPase}`);
      if (!responseFolio.ok) throw new Error("No se pudo obtener el FOLIO_SURTIMIENTO");

      const { folioSurtimiento } = await responseFolio.json();
      //console.log("FOLIO_SURTIMIENTO obtenido:", folioSurtimiento);

      // Segunda consulta: Obtener registros de detalleSurtimientos
      const responseDetalles = await fetch(`/api/surtimientos/getDetallesSurtimiento?folioSurtimiento=${folioSurtimiento}`);
      if (!responseDetalles.ok) throw new Error("No se pudieron obtener los detalles del surtimiento");

      const detallesData = await responseDetalles.json();
      setDetalles(detallesData);
    } catch (err) {
      console.error("Error en fetchDetallesByFolioPase:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { detalles, loading, error, fetchDetallesByFolioPase };
}
