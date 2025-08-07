// src/components/dashboard/MedicalDashboard.jsx
import { useState, useEffect } from 'react';
import StatsCards from './StatsCards';
import ChartsSection from './ChartsSection';
import FiltersPanel from './FiltersPanel';
import ConsultasTable from './ConsultasTable';
import ExportButton from './ExportButton';
import LoadingSpinner from './LoadingSpinner';

const MedicalDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    claveproveedor: '',
    departamento: '',
    clavestatus: '',
    limit: 100,
    offset: 0
  });
  const [error, setError] = useState(null);

  const fetchDashboardData = async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/OIC/dashboard?${queryParams}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al cargar datos');
      }

      setDashboardData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  },);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    fetchDashboardData(updatedFilters);
  };

  const handleLoadMore = () => {
    const newFilters = { ...filters, offset: filters.offset + filters.limit };
    setFilters(newFilters);
    fetchDashboardData(newFilters);
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '' && key !== 'limit' && key !== 'offset') {
          queryParams.append(key, value);
        }
      });
      queryParams.append('exportExcel', 'true');

      const response = await fetch(`/api/OIC/dashboard?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        // Aquí puedes implementar la lógica para descargar el Excel
        // Por ejemplo, usando una librería como xlsx-js
        return result.data;
      }
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  if (loading && !dashboardData) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Dashboard Médico
          </h1>
          <p className="text-gray-600">
            Análisis completo de consultas médicas y estadísticas
          </p>
        </div>

        {/* Filters Panel */}
        <FiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />

        {/* Export Button */}
        <div className="mb-6">
          <ExportButton
            onExport={handleExport}
            filters={filters}
            disabled={loading}
          />
        </div>

        {dashboardData && (
          <>
            {/* Stats Cards */}
            <StatsCards
              estadisticas={dashboardData.estadisticas}
              loading={loading}
            />

            {/* Charts Section */}
            <ChartsSection
              graficos={dashboardData.graficos}
              loading={loading}
            />

            {/* Consultas Table */}
            <ConsultasTable
              consultas={dashboardData.consultas}
              onLoadMore={handleLoadMore}
              hasMore={dashboardData.consultas.length >= filters.limit}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MedicalDashboard;