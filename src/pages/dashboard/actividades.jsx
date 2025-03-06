import React, { useEffect, useState } from "react";
import io from "socket.io-client";

let socket;

const DashboardActividad = () => {
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    // Conexión a Socket.io (ajusta la URL si es necesario)
    socket = io();

    socket.on("user-activity", (data) => {
      // Agrega la actividad recibida al inicio del arreglo
      setActividades((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("user-activity");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard de Actividad</h1>
      {actividades.length > 0 ? (
        <table className="w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4">Usuario</th>
              <th className="py-2 px-4">Acción</th>
              <th className="py-2 px-4">Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {actividades.map((act, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 px-4">{act.userId}</td>
                <td className="py-2 px-4">{act.action}</td>
                <td className="py-2 px-4">{new Date(act.time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-600">No hay actividad registrada.</p>
      )}
    </div>
  );
};

export default DashboardActividad;
