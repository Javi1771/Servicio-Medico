import React, { useEffect, useState } from "react";

/**
 * Componente que muestra los detalles de la consulta.
 * Se hace fetch a /api/detalleConsulta?clave=CLAVE
 */
export default function DetalleConsulta({ claveConsulta }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`/api/Actividad/detalleConsulta?clave=${claveConsulta}`);
        if (!resp.ok) {
          throw new Error(`Error de servidor: ${resp.status}`);
        }
        const data = await resp.json();
        setDetalle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (claveConsulta) {
      fetchDetalle();
    }
  }, [claveConsulta]);

  if (!claveConsulta) {
    return <p style={{ color: "gray" }}>No existe clave de consulta.</p>;
  }

  if (loading) {
    return <p>Cargando detalle...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>Error: {error}</p>;
  }

  return (
    <div style={{ lineHeight: "1.5" }}>
      <p>
        <strong>Paciente:</strong> {detalle.nombrepaciente}
      </p>
      <p>
        <strong>Edad:</strong> {detalle.edad}
      </p>
      <p>
        <strong>Motivo:</strong> {detalle.motivoconsulta}
      </p>
      <p>
        <strong>Diagnóstico:</strong> {detalle.diagnostico}
      </p>
      <p>
        <strong>Clavenomina:</strong> {detalle.clavenomina}
      </p>
    </div>
  );
}
