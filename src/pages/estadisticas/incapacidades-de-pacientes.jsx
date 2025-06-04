// src/pages/estadisticas/incapacidades-de-pacientes.jsx

import React, { useState, useEffect } from 'react';
import IncapacidadesContent from './components/IncapacidadesContent';

// Función auxiliar para calcular días entre dos fechas (inclusive)
function calcularDias(inicio, fin) {
  const dateStart = new Date(inicio);
  const dateEnd = new Date(fin);
  const diffMs = dateEnd - dateStart;
  if (isNaN(diffMs) || diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export default function DashboardIncapacidadesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
        if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);
        params.append('page', '1');
        params.append('pageSize', '1000');

        const response = await fetch(`/api/estadisticas/infoIncapacidades?${params.toString()}`);
        const result = await response.json();
        if (response.ok) {
          setData(result.data || []);
        } else {
          throw new Error(result.error || 'Error desconocido al obtener datos');
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  return (
    <IncapacidadesContent
      data={data}
      loading={loading}
      error={error}
      startDate={startDate}
      endDate={endDate}
      setStartDate={setStartDate}
      setEndDate={setEndDate}
      calcularDias={calcularDias}
    />
  );
}
