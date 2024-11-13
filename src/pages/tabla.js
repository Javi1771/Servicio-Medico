// pages/tabla.js
import { useEffect, useState } from 'react';
import styles from './css/usuarios.module.css'; 

const Tabla = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/consultas'); // Asegúrate de que la ruta sea correcta
        if (!response.ok) {
          throw new Error('Error en la solicitud');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Datos de la Tabla</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            {/* Cambia los encabezados según las columnas de tu tabla */}
            <th>ID1</th>
            <th>ID</th>
            <th>Nomina</th>
            <th>Apellido_p</th>
            <th>Apellido_m</th>
            <th>Nombre</th>
            <th>Sexo</th>
            <th>dir_Calle</th>
            <th>dir_num_ext</th>
            <th>dir_num_int</th>
            {/* Agrega más encabezados según sea necesario */}
          </tr>
        </thead>
        <tbody className={styles.th}>
          {data.map((item) => (
            <tr key={item.id}> {/* Cambia 'id' por el campo clave de tu tabla */}
              <td>{item.id1}</td>
              <td>{item.id}</td>
              <td>{item.nomina}</td>
              <td>{item.apellido_p}</td>
              <td>{item.apellido_m}</td>
              <td>{item.nombre}</td>
              <td>{item.sexo}</td>
              <td>{item.dir_calle}</td>
              <td>{item.dir_num_ext}</td>
              <td>{item.dir_num_int}</td>
              {/* Agrega más celdas según sea necesario */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Tabla;
