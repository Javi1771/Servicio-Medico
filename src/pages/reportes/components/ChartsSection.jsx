// src/components/dashboard/ChartsSection.jsx
import { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const ChartsSection = ({ graficos, loading }) => {
  const [activeTab, setActiveTab] = useState('timeline');

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ];

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: '📈' },
    { id: 'diagnosticos', label: 'Diagnósticos', icon: '🏥' },
    { id: 'proveedores', label: 'Proveedores', icon: '👨‍⚕️' },
    { id: 'demograficos', label: 'Demográficos', icon: '👥' },
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊' }
  ];

  const renderTimelineChart = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        📊 Consultas por Día
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={graficos?.consultasPorDia || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="fecha" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, 'Consultas']}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="cantidad" 
            stroke="#3B82F6" 
            fill="#3B82F6" 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDiagnosticosChart = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        🏥 Top Diagnósticos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={graficos?.topDiagnosticos || []} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="diagnostico" 
            tick={{ fontSize: 12 }}
            width={200}
          />
          <Tooltip formatter={(value) => [value, 'Casos']} />
          <Bar dataKey="cantidad" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderProveedoresChart = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        👨‍⚕️ Consultas por Proveedor
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={graficos?.consultasPorProveedor || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ nombreproveedor, percent }) => 
              `${nombreproveedor}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="cantidad"
          >
            {(graficos?.consultasPorProveedor || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDistribucionEdadChart = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        👥 Distribución por Edad
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={graficos?.distribucionEdad || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="rangoEdad" />
          <YAxis />
          <Tooltip formatter={(value) => [value, 'Pacientes']} />
          <Bar dataKey="cantidad" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderMedicamentosChart = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        💊 Medicamentos Más Recetados
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={graficos?.medicamentosMasRecetados || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="medicamento" 
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              value, 
              name === 'cantidad' ? 'Recetas' : 'Cantidad Total'
            ]}
          />
          <Bar dataKey="cantidad" fill="#8B5CF6" name="cantidad" />
          <Bar dataKey="cantidadTotal" fill="#EC4899" name="cantidadTotal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <div className="grid grid-cols-1 gap-6">
            {renderTimelineChart()}
          </div>
        );
      case 'diagnosticos':
        return (
          <div className="grid grid-cols-1 gap-6">
            {renderDiagnosticosChart()}
          </div>
        );
      case 'proveedores':
        return (
          <div className="grid grid-cols-1 gap-6">
            {renderProveedoresChart()}
          </div>
        );
      case 'demograficos':
        return (
          <div className="grid grid-cols-1 gap-6">
            {renderDistribucionEdadChart()}
          </div>
        );
      case 'medicamentos':
        return (
          <div className="grid grid-cols-1 gap-6">
            {renderMedicamentosChart()}
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderTimelineChart()}
            {renderDiagnosticosChart()}
            {renderProveedoresChart()}
            {renderDistribucionEdadChart()}
          </div>
        );
    }
  };

  return (
    <div className="mb-8">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Chart Content */}
      {renderTabContent()}
    </div>
  );
};

export default ChartsSection;