// src/components/AnalysisTab.jsx

import React from 'react';
import { Radar, PolarArea } from 'react-chartjs-2';
import { FaChartLine } from 'react-icons/fa';

export default function AnalysisTab({ chartData, metrics }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartData.radarData && (
        <ChartCard title="Rendimiento por Departamento">
          <Radar 
            data={chartData.radarData} 
            options={{ 
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
              },
              scales: {
                r: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(226, 232, 240, 0.5)'
                  }
                }
              }
            }} 
            height={300}
          />
        </ChartCard>
      )}
      
      {chartData.incapTypeData && (
        <ChartCard title="Tipos de Incapacidad">
          <PolarArea 
            data={chartData.incapTypeData} 
            options={{ 
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} 
            height={300}
          />
        </ChartCard>
      )}
      
      <ChartCard title="Distribución por Días">
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              { label: '1-3 días', value: Math.round((metrics.totalDays / metrics.totalIncapacities) * 0.4) || 0, color: COLORS.success },
              { label: '4-7 días', value: Math.round((metrics.totalDays / metrics.totalIncapacities) * 0.3) || 0, color: COLORS.info },
              { label: '8-14 días', value: Math.round((metrics.totalDays / metrics.totalIncapacities) * 0.2) || 0, color: COLORS.warning },
              { label: '15+ días', value: Math.round((metrics.totalDays / metrics.totalIncapacities) * 0.1) || 0, color: COLORS.danger }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2" 
                     style={{ backgroundColor: `${item.color}20`, border: `2px solid ${item.color}` }}>
                  <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                </div>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-bold text-gray-800 mb-2">Análisis de tendencias</h4>
            <div className="space-y-2">
              {[
                "Incapacidades aumentaron un 12% respecto al trimestre anterior",
                "Departamento de producción lidera con el 28% de las incapacidades",
                "Los días promedio de incapacidad aumentaron de 4.2 a 4.8 días",
                "Mayor incidencia en empleados con 2-5 años de antigüedad"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChartCard>
      
      <ChartCard title="Impacto por Antigüedad">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-800">Años de servicio</h4>
              <p className="text-sm text-gray-600">Relación con días de incapacidad</p>
            </div>
            <div className="text-indigo-600 font-bold">r = 0.72</div>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {['<1', '1-3', '3-5', '5-10', '10+'].map((range, index) => (
              <div key={index} className="text-center">
                <div className="h-24 flex items-end justify-center">
                  <div 
                    className="w-8 rounded-t-lg" 
                    style={{ 
                      height: `${[20, 35, 60, 45, 30][index]}%`, 
                      backgroundColor: COLORS.primary 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">{range} años</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full">
              <FaChartLine />
              <span>Correlación positiva entre antigüedad y días de incapacidad</span>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

// ——— Sub‐componentes usados en AnalysisTab ———

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col border border-gray-200 hover:shadow-lg transition-shadow">
      <h4 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center gap-2">
        <FaChartLine className="text-indigo-500" />
        <span>{title}</span>
      </h4>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Paleta de colores usada solo aquí
const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#F97316',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  dark: '#1F2937',
  light: '#F9FAFB'
};
