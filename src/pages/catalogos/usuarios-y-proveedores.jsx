import { useEffect, useState } from 'react';
import styles from '../css/usuarios.module.css'; 

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usuariosResponse, especialidadesResponse] = await Promise.all([
          fetch('/api/usuario'), // Cambia esta ruta a la ruta de tu API
          fetch('/api/especialidades') // Cambia esta ruta a la ruta de tu API
        ]);
        
        const usuariosData = await usuariosResponse.json();
        const especialidadesData = await especialidadesResponse.json();

        setUsuarios(usuariosData);
        setEspecialidades(especialidadesData);
      } catch (error) {
        setError('Error al cargar los datos');
      }
    };

    fetchData();
  }, []);

  // Filtrar usuarios según el término de búsqueda
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombreusuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para obtener la especialidad por su clave
  const getEspecialidadNombre = (clave) => {
    const especialidad = especialidades.find(especialidad => especialidad.claveespecialidad === clave);
    return especialidad ? especialidad.especialidad : 'Desconocida'; // Retorna 'Desconocida' si no se encuentra
  };

  return (
    <div className={styles.body}>
     <div className={styles.container}>
    <img src="/baner_sjr.png" alt="Banner" className={styles.banner} />
    <h2 className={styles.title}>Lista de Usuarios</h2>
    {error && <p className={styles.error}>{error}</p>}
    
    <input
      type="text"
      placeholder="Buscar usuario..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className={styles.searchInput}
    />

    <div className={styles.buttonContainer}>
      <button className={styles.button}>Agregar Usuario</button>
      <button className={styles.button}>Editar Usuario</button>
      <button className={styles.button}>Eliminar Usuario</button>
      <button className={styles.button}>Actualizar Lista</button>
    </div>

    <table className={styles.table}>
      <thead>
        <tr>
          <th>Nombre Usuario</th>
          <th>Especialidad</th>
          <th>Teléfono</th>
          <th>Celular</th>
        </tr>
      </thead>
      <tbody>
        {filteredUsuarios.map((item, index) => (
          <tr key={index} className={styles.row}>
            <td>{item.nombreusuario}</td>
            <td>{getEspecialidadNombre(item.claveespecialidad)}</td>
            <td>{item.telefonousuario}</td>
            <td>{item.celularusuario}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  </div>

  );
}
