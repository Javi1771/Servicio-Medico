// src/components/OverviewTab.jsx

import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  FaFileMedical,
  FaClock,
  FaCalendarCheck,
  FaUserFriends,
  FaTrophy,
  FaUser,
  FaChartLine
} from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function OverviewTab({ metrics, chartData, data }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard 
          icon={<FaFileMedical className="text-2xl" />} 
          title="Total Incapacidades" 
          value={metrics.totalIncapacities} 
          description="Registros totales" 
          color="from-indigo-500 to-indigo-600"
        />
        <MetricCard 
          icon={<FaClock className="text-2xl" />} 
          title="Días Totales" 
          value={metrics.totalDays} 
          description="Suma de días" 
          color="from-cyan-500 to-cyan-600"
        />
        <MetricCard 
          icon={<FaCalendarCheck className="text-2xl" />} 
          title="Duración Promedio" 
          value={`${metrics.avgDuration} días`} 
          description="Por registro" 
          color="from-emerald-500 to-emerald-600"
        />
        <MetricCard 
          icon={<FaUserFriends className="text-2xl" />} 
          title="Empleados Únicos" 
          value={new Set(data.map(item => item.nomina || 'SIN_NOMINA')).size} 
          description="Con al menos una incapacidad" 
          color="from-purple-500 to-purple-600"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            <FaTrophy className="text-amber-500" />
            <span>Empleado con más registros</span>
          </h3>
          
          {metrics.topEmployee && (
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center">
                <FaUser className="text-indigo-600 text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-lg">
                  {metrics.topEmployee.employee?.fullName 
                    || metrics.topEmployee.nomina 
                    || 'N/A'}
                </h4>
                <p className="text-gray-600">
                  {metrics.topEmployee.employee?.puesto || 'Puesto no disponible'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {metrics.topEmployee.count} registros
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            <FaClock className="text-amber-500" />
            <span>Empleado con más días</span>
          </h3>
          
          {metrics.topDaysEmployee && (
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center">
                <FaUser className="text-amber-600 text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-lg">
                  {metrics.topDaysEmployee.employee?.fullName 
                    || metrics.topDaysEmployee.nomina 
                    || 'N/A'}
                </h4>
                <p className="text-gray-600">
                  {metrics.topDaysEmployee.employee?.puesto || 'Puesto no disponible'}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                    {metrics.topDaysEmployee.days} días
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {chartData.deptBarData && (
          <ChartCard title="Incapacidades por Departamento">
            <Bar 
              data={chartData.deptBarData} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
                }
              }} 
              height={300}
            />
          </ChartCard>
        )}
        
        {chartData.employeeDoughnutData && (
          <ChartCard title="Top 5 Empleados">
            <Doughnut 
              data={chartData.employeeDoughnutData} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' }
                },
                cutout: '60%'
              }} 
              height={300}
            />
          </ChartCard>
        )}
      </div>
      
      {chartData.monthlyLineData && (
        <div className="mb-8">
          <ChartCard title="Tendencia Mensual">
            <Line 
              data={chartData.monthlyLineData} 
              options={{ 
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} 
              height={300}
            />
          </ChartCard>
        </div>
      )}
    </>
  );
}

// ——— Sub‐componentes usados en OverviewTab ———

function MetricCard({ icon, title, value, description, color }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${color} text-white rounded-2xl p-5 shadow-xl overflow-hidden relative`}
    >
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full"></div>
      
      <div className="relative z-10">
        <div className="mb-4">{icon}</div>
        <h3 className="text-2xl font-bold mb-1">{value}</h3>
        <p className="font-semibold text-white/95">{title}</p>
        <p className="font-light text-white/80 text-sm mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

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
