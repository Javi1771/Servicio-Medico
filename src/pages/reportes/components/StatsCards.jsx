// src/components/dashboard/StatsCards.jsx
import { useState, useEffect } from 'react';

const StatsCards = ({ estadisticas, loading }) => {
  const [animatedStats, setAnimatedStats] = useState({});

  useEffect(() => {
    if (estadisticas && !loading) {
      // Animar números gradualmente
      const animate = (key, target) => {
        const duration = 1000;
        const steps = 50;
        const stepValue = target / steps;
        let current = 0;
        
        const interval = setInterval(() => {
          current += stepValue;
          if (current >= target) {
            current = target;
            clearInterval(interval);
          }
          setAnimatedStats(prev => ({
            ...prev,
            [key]: Math.floor(current)
          }));
        }, duration / steps);
      };

      Object.entries(estadisticas).forEach(([key, value]) => {
        if (typeof value === 'number') {
          animate(key, value);
        }
      });
    }
  }, [estadisticas, loading]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString();
  };

  const statsConfig = [
    {
      key: 'totalConsultas',
      title: 'Total Consultas',
      icon: '📋',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      key: 'totalPacientes',
      title: 'Total Pacientes',
      icon: '👥',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      key: 'totalProveedores',
      title: 'Proveedores',
      icon: '👨‍⚕️',
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      key: 'edadPromedio',
      title: 'Edad Promedio',
      icon: '📊',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      suffix: ' años'
    },
    {
      key: 'totalIncapacidades',
      title: 'Incapacidades',
      icon: '🏥',
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      key: 'totalEspecialidades',
      title: 'Especialidades',
      icon: '🩺',
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      key: 'totalEmpleados',
      title: 'Empleados',
      icon: '👔',
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      key: 'totalFamiliares',
      title: 'Familiares',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat) => {
        const value = animatedStats[stat.key] || 0;
        const rawValue = estadisticas?.[stat.key] || 0;
        
        return (
          <div
            key={stat.key}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{stat.icon}</span>
                  <h3 className="text-sm font-medium text-gray-600 truncate">
                    {stat.title}
                  </h3>
                </div>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <span className="animate-pulse bg-gray-200 rounded w-16 h-8 block"></span>
                    ) : (
                      <>
                        {stat.key === 'edadPromedio' 
                          ? rawValue.toFixed(1) 
                          : formatNumber(value)
                        }
                        {stat.suffix}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center`}>
                <span className="text-white text-xl">{stat.icon}</span>
              </div>
            </div>
            
            {/* Barra de progreso animada */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${stat.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                  style={{ 
                    width: loading ? '0%' : `${Math.min(100, (value / Math.max(...Object.values(animatedStats))) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;