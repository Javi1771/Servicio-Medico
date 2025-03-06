import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

let socket;

const DashboardActividad = () => {
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    // Conectar al socket (se asume que el servidor y el cliente comparten el mismo origen)
    socket = io();

    // Escuchar el evento "user-activity"
    socket.on("user-activity", (data) => {
      console.log("Actividad recibida:", data);
      // Agrega la actividad recibida al inicio del arreglo para que las más nuevas aparezcan primero
      setActividades((prev) => [data, ...prev]);
    });

    // Limpieza de la conexión
    return () => {
      socket.off("user-activity");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard de Actividad</h1>
      {actividades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4">Usuario</th>
                <th className="py-2 px-4">Acción</th>
                <th className="py-2 px-4">Fecha y Hora</th>
              </tr>
            </thead>
            <AnimatePresence>
              <tbody>
                {actividades.map((act, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-gray-200"
                  >
                    <td className="py-2 px-4">{act.userId}</td>
                    <td className="py-2 px-4">{act.action}</td>
                    <td className="py-2 px-4">{new Date(act.time).toLocaleString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600">No hay actividad registrada.</p>
      )}
    </div>
  );
};

export default DashboardActividad;
