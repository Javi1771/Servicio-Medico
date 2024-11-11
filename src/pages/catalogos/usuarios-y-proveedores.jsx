import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom'; // Asegúrate de importar ReactDOM
import styles from '../css/usuarios.module.css';
import Swal from 'sweetalert2';
import Image from 'next/image'; // Asegúrate de importar Image desde next/image
import { useRouter } from 'next/router';


export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [tiposUsuarios, setTiposUsuarios] = useState([]);


  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false); // Estado para el ojo de visibilidad
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Estado para el mensaje de éxito
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
  
  const [selectedUsuario, setSelectedUsuario] = useState(null); // Estado para el usuario seleccionado

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
        setEspecialidades(Array.isArray(especialidadesData) ? especialidadesData : []);
        setTiposUsuarios(Array.isArray(tiposUsuariosData) ? tiposUsuariosData : []); // Validar que sea un arreglo
      } catch {
        setError('Error al cargar los datos');
      }
    };

    fetchData();
  }, []);


  const handleDeleteUser = async (usuario) => {
    const confirmDelete = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(`/api/eliminarUser?usuario=${usuario}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Error al eliminar el usuario');
        }
        const usuariosResponse = await fetch('/api/usuario');
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        Swal.fire('Eliminado', 'El usuario ha sido eliminado', 'success');
      } catch (error) {
        console.error(error);
        setError('Error al eliminar el usuario');
      }
    }
  };

  const filteredUsuarios = Array.isArray(usuarios) ? usuarios.filter(usuario =>
    usuario.nombreusuario && usuario.nombreusuario.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  


  
  const getEspecialidadNombre = (clave) => {
    if (!Array.isArray(especialidades) || especialidades.length === 0) {
      return 'Desconocida';
    }
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
      setShowPassword(false); // Reinicia la visibilidad de la contraseña
      setSelectedUsuario(null); // Limpiar el usuario seleccionado al cerrar el modal
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUsuario({
      ...newUsuario,
      [name]: name === 'claveespecialidad' || name === 'clavetipousuario' ? parseInt(value, 10) : value
    });
  };

  const handleEditUser = async (usuario) => {
    setSelectedUsuario(usuario);
    try {
      // Asume que tienes un endpoint que devuelve la contraseña desencriptada
      const response = await fetch(`/api/desencryptar/${usuario.usuario}`);
      const data = await response.json();
      setNewUsuario({ ...usuario, password: data.passwordDesencriptada }); // Pone la contraseña desencriptada
    } catch (error) {
      console.error('Error al obtener la contraseña desencriptada', error);
    }
    setNewUsuario(usuario); // Prellenar el formulario con los datos del usuario seleccionado
    setShowModal(true); // Mostrar el modal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const usuarioData = {
      ...newUsuario,
      claveespecialidad: parseInt(newUsuario.claveespecialidad, 10),
      clavetipousuario: parseInt(newUsuario.clavetipousuario, 10)
    };

    try {
      if (selectedUsuario) { // Si hay un usuario seleccionado, hacemos un PUT
        const response = await fetch('/api/editUser', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el usuario');
        }
        

        const result = await response.json();
        console.log('Usuario actualizado:', result);
        
        // Actualizar la lista de usuarios después de editar
        const usuariosResponse = await fetch('/api/usuario');
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

         // Mostrar notificación de éxito con SweetAlert2
         Swal.fire({
          icon: 'success',
          title: 'Usuario Actualizado correctamente',
          showConfirmButton: false,
          timer: 2000
        });

        // Mostrar el mensaje de éxito
        setShowSuccessMessage(true);
        toggleModal();

        // Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        // Validación de datos solo para agregar nuevo usuario
        if (!usuarioData.nombreusuario || !usuarioData.usuario || !usuarioData.password) {
          Swal.fire({
            icon: 'error',
            title: 'Campos Vacíos',
            text: 'Por favor, completa todos los campos requeridos para agregar un usuario.'
          });
          return;
        }

        // Aquí va tu lógica para crear un nuevo usuario
        const response = await fetch('/api/crearUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
          throw new Error('Error al agregar el usuario');
        }
        

        const result = await response.json();
        console.log('Usuario agregado:', result);

        // Actualizar la lista de usuarios después de agregar
        const usuariosResponse = await fetch('/api/usuario');
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

         // Mostrar notificación de éxito con SweetAlert2
         Swal.fire({
          icon: 'success',
          title: 'Usuario Agregado correctamente',
          showConfirmButton: false,
          timer: 2000
        });


        // Mostrar el mensaje de éxito
        setShowSuccessMessage(true);
        toggleModal();

        // Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } catch {
      console.error(error);
      setError(selectedUsuario ? 'Error al actualizar el usuario' : 'Error al agregar el usuario');
    }
  };

  const router = useRouter(); // declaro la variable router
  const handleBack = () => {
    router.back('/inicio-servicio-medico'); // Esto regresa a la página anterior en el historial de navegación
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={styles.body}>
    <div className={styles.container}>
    <Image
          src="/baner_sjr.png" // Asegúrate de que esta imagen esté en la carpeta public
          alt="Banner"
          layout="responsive" // Mantiene la relación de aspecto
          width={1920} // Ancho de la imagen
          height={1080} // Alto de la imagen
          className={styles.banner} // Clase CSS para la imagena la imagen
        />
      <button onClick={handleBack} className={styles.backButton}>Atrás</button>
      <h2 className={styles.title}>Lista de Usuarios</h2>
      {error && <p className={styles.error}>{error}</p>}
      {showSuccessMessage && (
        <div className={styles.successModal}>
          <p>Usuario agregado o actualizado correctamente</p>
        </div>
      )}

      <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${styles.input} input`}
          />
          </div>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={toggleModal}>Agregar Usuario</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
          <th>Usuario</th>
            <th>Nombre Usuario</th>
            <th>Especialidad</th>
            <th>Teléfono</th>
            <th>Celular</th>
            <th>Editar / Eliminar</th>

          </tr>
        </thead>
        <tbody>
        {filteredUsuarios.map((item, index) => (
    <tr key={index} className={styles.row}>
      <td>{item.usuario}</td>
      <td>{item.nombreusuario}</td>
      <td>{getEspecialidadNombre(item.claveespecialidad)}</td>
      <td>{item.telefonousuario}</td>
      <td>{item.celularusuario}</td>
      <td>
        <button 
          onClick={() => handleEditUser(item)} 
          className={styles.editButton}
        >
          {/* SVG para editar */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-1.647 1.647-3-3L12.146.146zM11.5 1l-1 1L2 10.5V12h1.5L11 3.5 11.5 3 12 2.5 11.5 1z"/>
          </svg>
        </button>
        <button 
          onClick={() => handleDeleteUser(item.usuario)} 
          className={styles.binButton}
        >
          {/* SVG para eliminar */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 0a.5.5 0 0 1 .5.5V1h5V.5a.5.5 0 0 1 1 0V1h1a1 1 0 0 1 1 1v1h-1.5l-1 11H2.5l-1-11H0V2a1 1 0 0 1 1-1h1V.5a.5.5 0 0 1 .5-.5zM1 2v1h1.5l1 11h9l1-11H15V2H1z"/>
          </svg>
        </button>
      </td>
    </tr>
  ))}
</tbody>
      </table>


      {showModal && ReactDOM.createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalHeader}>{selectedUsuario ? 'Editar Usuario' : 'Agregar Usuario'}</h2>
            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.inputContainer}>
                <input type="text" name="nombreusuario" placeholder="Nombre" onChange={handleInputChange} value={newUsuario.nombreusuario} />
              </div>
              <input type="text" name="direcciousuario" placeholder="Dirección" onChange={handleInputChange} value={newUsuario.direcciousuario} />
              <input type="text" name="coloniausuario" placeholder="Colonia" onChange={handleInputChange} value={newUsuario.coloniausuario} />
              <input type="text" name="telefonousuario" placeholder="Teléfono" onChange={handleInputChange} value={newUsuario.telefonousuario} />
              <input type="text" name="celularusuario" placeholder="Celular" onChange={handleInputChange} value={newUsuario.celularusuario} />
              <input type="text" name="cedulausuario" placeholder="Cédula" onChange={handleInputChange} value={newUsuario.cedulausuario} />

              <label htmlFor="claveespecialidad">Especialidad</label>
              <select name="claveespecialidad" onChange={handleInputChange} value={newUsuario.claveespecialidad} className={styles.dropdown}>
              <option value="">Seleccionar Especialidad</option>
              {Array.isArray(especialidades) &&
              especialidades.map((especialidad) => (
                <option key={especialidad.claveespecialidad} value={especialidad.claveespecialidad}>
                  {especialidad.especialidad}
                  </option>
                   ))}
                </select>

             {/* Campo de usuario */}
        <div className={styles.inputContainer}>
          <input
            type="text"
            name="usuario"
            placeholder="Usuario"
            onChange={handleInputChange}
            value={newUsuario.usuario || ''} // Asegúrate de inicializar el valor correctamente
          />
        </div>

        {/* Campo de contraseña */}
        <div className={styles.inputContainer}>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Contraseña"
            onChange={handleInputChange}
            value={newUsuario.password || ''} // Muestra la contraseña desencriptada en el formulario
          />
                <button 
                 onClick={togglePasswordVisibility} 
                  className={styles.eyeIcon} 
                  type="button" // Evitar que el botón envíe el formulario
                  >
    {/* SVG para mostrar/ocultar contraseña */}
    {showPassword ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5.977 5.977 0 0 0-5.623 4H2a6 6 0 1 0 0 6h.377A5.977 5.977 0 0 0 8 13a5.977 5.977 0 0 0 5.623-4H14a6 6 0 0 0 0-6h-.377A5.977 5.977 0 0 0 8 3zM8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM8 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5.977 5.977 0 0 0-5.623 4H2a6 6 0 1 0 0 6h.377A5.977 5.977 0 0 0 8 13a5.977 5.977 0 0 0 5.623-4H14a6 6 0 0 0 0-6h-.377A5.977 5.977 0 0 0 8 3zM1 8a7 7 0 0 1 14 0 7 7 0 0 1-14 0z" />
      </svg>
    )}
  </button>
</div>
              <label htmlFor="clavetipousuario">Tipo de Usuario</label>
              <select name="clavetipousuario" onChange={handleInputChange} value={newUsuario.clavetipousuario} className={styles.dropdown}>
                <option value="">Seleccionar Tipo de Usuario</option>
                {tiposUsuarios.map((tipo) => (
                  <option key={tipo.clavetipousuario} value={tipo.clavetipousuario}>
                    {tipo.tipousuario}
                  </option>
                ))}
              </select>

              <button type="submit" className={styles.formSubmitBtn}>
                {selectedUsuario ? 'Actualizar Usuario' : 'Agregar Usuario'}
              </button>
            </form>
            <button className={styles.closeButton} onClick={toggleModal}>Cerrar</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  </div>
  );
}
