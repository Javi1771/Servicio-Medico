// src/components/DetailsTab.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaNotesMedical } from 'react-icons/fa';

export default function DetailsTab({ data, setEmployeeDetails, calcularDias }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
          <FaNotesMedical className="text-indigo-500" />
          <span>Detalle de Incapacidades</span>
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          {data.length} registros encontrados
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Proveedor Médico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Días
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                Nómina
              </th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => {
              const dias = calcularDias(item.fechainicio, item.fechafin);
              return (
                <motion.tr 
                  key={index} 
                  className="hover:bg-indigo-50"
                  whileHover={{ backgroundColor: '#f0f4ff' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(item.fecha).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.nombrepaciente || (item.empleado?.fullName ?? 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {item.departamento || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {item.nombreproveedor || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                      {dias} días
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.nomina || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => setEmployeeDetails(item)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Ver más
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
