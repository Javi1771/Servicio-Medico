// src/components/dashboard/ConsultasTable.jsx
import { useState } from 'react';

const ConsultasTable = ({ consultas, onLoadMore, hasMore, loading }) => {
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedConsultas = [...(consultas || [])].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      1: { label: 'Activo', class: 'bg-green-100 text-green-800' },
      2: { label: 'Completado', class: 'bg-blue-100 text-blue-800' },
      3: { label: 'Cancelado', class: 'bg-red-100 text-red-800' },
      4: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status] || { label: 'Desconocido', class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  const TableHeader = ({ column, children, sortable = true }) => (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:bg-gray-100' : ''
      }`}
      onClick={sortable ? () => handleSort(column) : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && <SortIcon column={column} />}
      </div>
    </th>
  );

  const ConsultaDetailModal = ({ consulta, onClose }) => {
    if (!consulta) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Detalles de Consulta #{consulta.claveconsulta}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📋 Información del Paciente</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nombre:</span> {consulta.nombrepaciente}</p>
                  <p><span className="font-medium">Edad:</span> {consulta.edad} años</p>
                  <p><span className="font-medium">Empleado:</span> {consulta.elpacienteesempleado ? 'Sí' : 'No'}</p>
                  <p><span className="font-medium">Parentesco:</span> {consulta.parentescoNombre || 'N/A'}</p>
                  <p><span className="font-medium">Departamento:</span> {consulta.departamento}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">👨‍⚕️ Información Médica</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Proveedor:</span> {consulta.nombreproveedor}</p>
                  <p><span className="font-medium">Fecha:</span> {consulta.fechaconsulta}</p>
                  <p><span className="font-medium">Estado:</span> {getStatusBadge(consulta.clavestatus)}</p>
                  <p><span className="font-medium">Especialidad:</span> {consulta.especialidadNombre || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">🩺 Signos Vitales</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Presión:</span>
                  <p>{consulta.presionarterialpaciente || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Temperatura:</span>
                  <p>{consulta.temperaturapaciente || 'N/A'}°C</p>
                </div>
                <div>
                  <span className="font-medium">Pulso:</span>
                  <p>{consulta.pulsosxminutopaciente || 'N/A'} bpm</p>
                </div>
                <div>
                  <span className="font-medium">Respiración:</span>
                  <p>{consulta.respiracionpaciente || 'N/A'} rpm</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">📝 Motivo y Diagnóstico</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Motivo:</span>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{consulta.motivoconsulta || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium">Diagnóstico:</span>
                  <p className="mt-1 p-2 bg-gray-50 rounded">{consulta.diagnostico || 'No especificado'}</p>
                </div>
                {consulta.alergias && (
                  <div>
                    <span className="font-medium">Alergias:</span>
                    <p className="mt-1 p-2 bg-red-50 rounded text-red-800">{consulta.alergias}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && (!consultas || consultas.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">📋 Consultas Recientes</h3>
        </div>
        <div className="animate-pulse p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              📋 Consultas Recientes
            </h3>
            <span className="text-sm text-gray-500">
              {consultas?.length || 0} registros
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader column="claveconsulta">ID</TableHeader>
                <TableHeader column="fechaconsulta">Fecha</TableHeader>
                <TableHeader column="nombrepaciente">Paciente</TableHeader>
                <TableHeader column="edad">Edad</TableHeader>
                <TableHeader column="nombreproveedor">Proveedor</TableHeader>
                <TableHeader column="departamento">Departamento</TableHeader>
                <TableHeader column="diagnostico">Diagnóstico</TableHeader>
                <TableHeader column="clavestatus">Estado</TableHeader>
                <TableHeader column="" sortable={false}>Acciones</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedConsultas.map((consulta) => (
                <tr 
                  key={consulta.claveconsulta}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{consulta.claveconsulta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.fechaconsulta}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {consulta.nombrepaciente?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {consulta.nombrepaciente}
                        </div>
                        <div className="text-sm text-gray-500">
                          {consulta.elpacienteesempleado ? '👔 Empleado' : '👨‍👩‍👧‍👦 Familiar'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.edad} años
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium">{consulta.nombreproveedor}</div>
                      <div className="text-xs text-gray-400">{consulta.cedulaproveedor}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consulta.departamento}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={consulta.diagnostico}>
                      {consulta.diagnostico || 'Sin diagnóstico'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(consulta.clavestatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedConsulta(consulta)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando más...
                </span>
              ) : (
                'Cargar más consultas'
              )}
            </button>
          </div>
        )}

        {!hasMore && consultas && consultas.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-center">
            <span className="text-sm text-gray-500">
              No hay más consultas para mostrar
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      <ConsultaDetailModal 
        consulta={selectedConsulta} 
        onClose={() => setSelectedConsulta(null)} 
      />
    </>
  );
};

export default ConsultasTable;