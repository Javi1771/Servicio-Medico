// src/components/dashboard/ExportButton.jsx
import { useState } from 'react';
import * as XLSX from 'xlsx';

const ExportButton = ({ onExport, filters, disabled }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeBasicInfo: true,
    includeVitalSigns: true,
    includeMedications: true,
    includeIncapacities: true,
    includeSpecialties: true,
    format: 'xlsx'
  });
  const [showOptions, setShowOptions] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Obtener datos para export
      const data = await onExport();
      
      if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return;
      }

      // Preparar datos según opciones seleccionadas
      const processedData = data.map(consulta => {
        const row = {};
        
        if (exportOptions.includeBasicInfo) {
          row['ID Consulta'] = consulta.claveconsulta;
          row['Fecha Consulta'] = consulta.fechaconsulta;
          row['Clave Nómina'] = consulta.clavenomina;
          row['Nombre Paciente'] = consulta.nombrepaciente;
          row['Edad'] = consulta.edad;
          row['Es Empleado'] = consulta.elpacienteesempleado ? 'Sí' : 'No';
          row['Parentesco'] = consulta.parentescoNombre || 'N/A';
          row['Departamento'] = consulta.departamento;
          row['Sindicato'] = consulta.sindicato;
          row['Proveedor'] = consulta.nombreproveedor;
          row['Cédula Proveedor'] = consulta.cedulaproveedor;
          row['Motivo Consulta'] = consulta.motivoconsulta;
          row['Diagnóstico'] = consulta.diagnostico;
          row['Alergias'] = consulta.alergias || 'Ninguna';
        }

        if (exportOptions.includeVitalSigns) {
          row['Presión Arterial'] = consulta.presionarterialpaciente || 'N/A';
          row['Temperatura'] = consulta.temperaturapaciente || 'N/A';
          row['Pulso por Minuto'] = consulta.pulsosxminutopaciente || 'N/A';
          row['Respiración'] = consulta.respiracionpaciente || 'N/A';
          row['Estatura'] = consulta.estaturapaciente || 'N/A';
          row['Peso'] = consulta.pesopaciente || 'N/A';
          row['Glucosa'] = consulta.glucosapaciente || 'N/A';
        }

        if (exportOptions.includeMedications) {
          row['Medicamentos'] = consulta.medicamentos || 'Sin medicamentos';
        }

        if (exportOptions.includeIncapacities) {
          row['Asignó Incapacidad'] = consulta.seAsignoIncapacidad ? 'Sí' : 'No';
          row['Incapacidades'] = consulta.incapacidades || 'Sin incapacidades';
        }

        if (exportOptions.includeSpecialties) {
          row['Asignó Especialidad'] = consulta.seasignoaespecialidad ? 'Sí' : 'No';
          row['Especialidad Interconsulta'] = consulta.especialidadNombre || 'N/A';
          row['Especialidades'] = consulta.especialidades || 'Sin especialidades';
          row['Fecha Cita'] = consulta.fechacita || 'N/A';
        }

        return row;
      });

      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Hoja principal con datos
      const ws = XLSX.utils.json_to_sheet(processedData);
      
      // Configurar ancho de columnas
      const colWidths = Object.keys(processedData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Consultas');

      // Hoja de resumen si hay datos
      if (data.length > 0) {
        const summary = [
          { 'Métrica': 'Total de Consultas', 'Valor': data.length },
          { 'Métrica': 'Pacientes Únicos', 'Valor': new Set(data.map(d => d.clavepaciente)).size },
          { 'Métrica': 'Proveedores Únicos', 'Valor': new Set(data.map(d => d.claveproveedor)).size },
          { 'Métrica': 'Consultas con Incapacidad', 'Valor': data.filter(d => d.seAsignoIncapacidad).length },
          { 'Métrica': 'Consultas con Especialidad', 'Valor': data.filter(d => d.seasignoaespecialidad).length },
          { 'Métrica': 'Empleados', 'Valor': data.filter(d => d.elpacienteesempleado).length },
          { 'Métrica': 'Familiares', 'Valor': data.filter(d => !d.elpacienteesempleado).length },
          { 'Métrica': 'Edad Promedio', 'Valor': (data.reduce((sum, d) => sum + (d.edad || 0), 0) / data.length).toFixed(1) + ' años' }
        ];
        
        const summaryWs = XLSX.utils.json_to_sheet(summary);
        summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
      }

      // Generar nombre de archivo
      const currentDate = new Date();
      const dateStr = currentDate.toISOString().split('T')[0];
      const timeStr = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `consultas_medicas_${dateStr}_${timeStr}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      
      setShowOptions(false);
      alert(`Archivo exportado exitosamente: ${fileName}`);
      
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar datos. Por favor, intente nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const ExportOptionsModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            📊 Opciones de Exportación
          </h3>
          <button
            onClick={() => setShowOptions(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Secciones a incluir:</h4>
            <div className="space-y-2">
              {[
                { key: 'includeBasicInfo', label: '📋 Información Básica', desc: 'Datos del paciente, proveedor, diagnóstico' },
                { key: 'includeVitalSigns', label: '🩺 Signos Vitales', desc: 'Presión, temperatura, pulso, etc.' },
                { key: 'includeMedications', label: '💊 Medicamentos', desc: 'Recetas y medicamentos prescritos' },
                { key: 'includeIncapacities', label: '🏥 Incapacidades', desc: 'Datos de incapacidades asignadas' },
                { key: 'includeSpecialties', label: '🔬 Especialidades', desc: 'Interconsultas y especialidades' }
              ].map(option => (
                <label key={option.key} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions[option.key]}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      [option.key]: e.target.checked
                    }))}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Formato:</h4>
            <select
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="xlsx">📊 Excel (.xlsx)</option>
              <option value="csv">📄 CSV (.csv)</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <div className="flex space-x-3">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exportando...
                  </span>
                ) : (
                  '📥 Exportar Datos'
                )}
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowOptions(true)}
          disabled={disabled || isExporting}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          📊 Exportar a Excel
        </button>
        
        <div className="text-sm text-gray-500">
          Los datos se exportarán según los filtros aplicados
        </div>
      </div>

      {showOptions && <ExportOptionsModal />}
    </>
  );
};

export default ExportButton;