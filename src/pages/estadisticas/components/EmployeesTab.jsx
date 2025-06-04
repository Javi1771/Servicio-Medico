// src/components/EmployeesTab.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaUser } from 'react-icons/fa';

export default function EmployeesTab({ data, setEmployeeDetails, calcularDias }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item, index) => {
        const dias = calcularDias(item.fechainicio, item.fechafin);
        return (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 w-14 h-14 rounded-full flex items-center justify-center">
                  <FaUser className="text-indigo-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {item.empleado?.fullName || item.nombrepaciente || 'N/A'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.empleado?.puesto || 'Puesto no disponible'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-sm">Departamento</p>
                  <p className="font-medium">{item.departamento || '—'}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-sm">Nómina</p>
                  <p className="font-medium">{item.nomina || '—'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-sm">Días incapacidad</p>
                  <p className="font-medium text-amber-700">{dias}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-gray-600 text-sm">Proveedor Médico</p>
                  <p className="font-medium text-amber-700">{item.nombreproveedor || '—'}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setEmployeeDetails(item)}
                className="w-full mt-4 bg-indigo-100 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-200 transition"
              >
                Ver detalles
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
