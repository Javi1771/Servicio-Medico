import { useState } from 'react';
import styles from '../css/userForm.module.css'; // Puedes crear estilos específicos para el formulario

const UserForm = ({ onClose, onUserAdded }) => {
  const [nombreusuario, setNombreUsuario] = useState('');
  const [direcciousuario, setDireccionUsuario] = useState('');
  const [coloniausuario, setColoniaUsuario] = useState('');
  const [telefonousuario, setTelefonoUsuario] = useState('');
  const [celularusuario, setCelularUsuario] = useState('');
  const [cedulausuario, setCedulaUsuario] = useState('');
  const [claveespecialidad, setClaveEspecialidad] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [clavetipousuario, setClaveTipoUsuario] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUser = {
      nombreusuario,
      direcciousuario,
      coloniausuario,
      telefonousuario,
      celularusuario,
      cedulausuario,
      claveespecialidad,
      usuario,
      password,
      clavetipousuario,
    };

    try {
      const response = await fetch('/api/usuarios', { // Cambia la ruta según sea necesario
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        onUserAdded(newUser); // Llama a la función de actualización de la tabla
        onClose(); // Cierra el formulario
      } else {
        console.error('ERROR AL AGREGAR EL USUARIO');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Agregar Usuario</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nombre Usuario" value={nombreusuario} onChange={(e) => setNombreUsuario(e.target.value)} required />
        <input type="text" placeholder="Dirección" value={direcciousuario} onChange={(e) => setDireccionUsuario(e.target.value)} required />
        <input type="text" placeholder="Colonia" value={coloniausuario} onChange={(e) => setColoniaUsuario(e.target.value)} required />
        <input type="tel" placeholder="Teléfono" value={telefonousuario} onChange={(e) => setTelefonoUsuario(e.target.value)} required />
        <input type="tel" placeholder="Celular" value={celularusuario} onChange={(e) => setCelularUsuario(e.target.value)} required />
        <input type="text" placeholder="Cédula" value={cedulausuario} onChange={(e) => setCedulaUsuario(e.target.value)} required />
        <input type="text" placeholder="Clave Especialidad" value={claveespecialidad} onChange={(e) => setClaveEspecialidad(e.target.value)} required />
        <input type="text" placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="text" placeholder="Clave Tipo Usuario" value={clavetipousuario} onChange={(e) => setClaveTipoUsuario(e.target.value)} required />
        <button type="submit">Agregar Usuario</button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
};

export default UserForm;
