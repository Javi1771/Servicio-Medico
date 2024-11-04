import { useEffect, useState } from 'react';
import styles from '../css/usuarios.module.css';

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [tiposUsuarios, setTiposUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newUsuario, setNewUsuario] = useState({
    nombreusuario: '',
    direcciousuario: '',
    coloniausuario: '',
    telefonousuario: '',
    celularusuario: '',
    cedulausuario: '',
    claveespecialidad: '',
    usuario: '',
    password: '',
    clavetipousuario: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usuariosResponse, especialidadesResponse, tiposUsuariosResponse] = await Promise.all([
          fetch('/api/usuario'),
          fetch('/api/especialidades'),
          fetch('/api/tiposusuarios')
        ]);
        
        const usuariosData = await usuariosResponse.json();
        const especialidadesData = await especialidadesResponse.json();
        const tiposUsuariosData = await tiposUsuariosResponse.json();

        setUsuarios(usuariosData);
        setEspecialidades(especialidadesData);
        setTiposUsuarios(tiposUsuariosData);
      } catch (error) {
        setError('Error al cargar los datos');
      }
    };

    fetchData();
  }, []);

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombreusuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEspecialidadNombre = (clave) => {
    const especialidad = especialidades.find(especialidad => especialidad.claveespecialidad === clave);
    return especialidad ? especialidad.especialidad : 'Desconocida';
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    if (showModal) {
      setNewUsuario({
        nombreusuario: '',
        direcciousuario: '',
        coloniausuario: '',
        telefonousuario: '',
        celularusuario: '',
        cedulausuario: '',
        claveespecialidad: '',
        usuario: '',
        password: '',
        clavetipousuario: ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Asignar directamente el valor entero de la clave cuando se selecciona en dropdown
    setNewUsuario({ 
      ...newUsuario, 
      [name]: name === 'claveespecialidad' || name === 'clavetipousuario' ? parseInt(value, 10) : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuarioData = {
      ...newUsuario,
      claveespecialidad: parseInt(newUsuario.claveespecialidad, 10), // Convertir a entero
      clavetipousuario: parseInt(newUsuario.clavetipousuario, 10) // Convertir a entero
    };

    try {
      const response = await fetch('/api/crearUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuarioData), // Usar el objeto con los valores convertidos
      });

      if (!response.ok) {
        throw new Error('Error al crear el usuario');
      }

      const result = await response.json();
      console.log('Usuario creado:', result);
      toggleModal();
    } catch (error) {
      console.error(error);
      setError('Error al crear el usuario');
    }
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
          <button className={styles.button} onClick={toggleModal}>Agregar Usuario</button>
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

        {/* Modal */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalHeader}>Agregar Usuario</h2>
              <form className={styles.modalForm} onSubmit={handleSubmit}>
                <input type="text" name="nombreusuario" placeholder="Nombre" onChange={handleInputChange} value={newUsuario.nombreusuario} />
                <input type="text" name="direcciousuario" placeholder="Dirección" onChange={handleInputChange} value={newUsuario.direcciousuario} />
                <input type="text" name="coloniausuario" placeholder="Colonia" onChange={handleInputChange} value={newUsuario.coloniausuario} />
                <input type="text" name="telefonousuario" placeholder="Teléfono" onChange={handleInputChange} value={newUsuario.telefonousuario} />
                <input type="text" name="celularusuario" placeholder="Celular" onChange={handleInputChange} value={newUsuario.celularusuario} />
                <input type="text" name="cedulausuario" placeholder="Cédula" onChange={handleInputChange} value={newUsuario.cedulausuario} />

                {/* Dropdown para seleccionar la clave de especialidad */}
                <label htmlFor="claveespecialidad">Especialidad</label>
                <select
                  name="claveespecialidad"
                  onChange={handleInputChange}
                  value={newUsuario.claveespecialidad}
                  className={styles.dropdown}
                >
                  <option value="">Seleccionar Especialidad</option>
                  {especialidades.map((especialidad) => (
                    <option key={especialidad.claveespecialidad} value={especialidad.claveespecialidad}>
                      {especialidad.especialidad}
                    </option>
                  ))}
                </select>

                <input type="text" name="usuario" placeholder="Usuario" onChange={handleInputChange} value={newUsuario.usuario} />
                <input type="password" name="password" placeholder="Contraseña" onChange={handleInputChange} value={newUsuario.password} />

                {/* Dropdown para seleccionar el tipo de usuario */}
                <label htmlFor="clavetipousuario">Tipo de Usuario</label>
                <select
                  name="clavetipousuario"
                  onChange={handleInputChange}
                  value={newUsuario.clavetipousuario}
                  className={styles.dropdown}
                >
                  <option value="">Seleccionar Tipo de Usuario</option>
                  {tiposUsuarios.map((tipo) => (
                    <option key={tipo.clavetipousuario} value={tipo.clavetipousuario}>
                      {tipo.tipousuario}
                    </option>
                  ))}
                </select>

                <button type="submit" className={styles.formSubmitBtn}>Agregar Usuario</button>
              </form>
              <button className={styles.closeButton} onClick={toggleModal}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
