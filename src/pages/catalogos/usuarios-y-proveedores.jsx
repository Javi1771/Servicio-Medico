/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import ReactDOM from "react-dom"; // Asegúrate de importar ReactDOM
import styles from "../css/usuarios.module.css";
import {
  FaUser,
  FaMapMarkerAlt,
  FaMap,
  FaPhone,
  FaMobileAlt,
  FaIdCard,
  FaLock,
  FaBriefcase,
  FaUsers,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import Image from "next/image"; // Asegúrate de importar Image desde next/image
import { useRouter } from "next/router";
import { arrayAsString } from "pdf-lib";

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [tiposUsuarios, setTiposUsuarios] = useState([]);

  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [isUsuarioValido, setIsUsuarioValido] = useState(true); // estado para validar si el usuario es válido
  const [usuarioError, setUsuarioError] = useState(""); // mensaje de error para el usuario

  const [showPassword, setShowPassword] = useState(false); // Estado para el ojo de visibilidad
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Estado para el mensaje de éxito
  const [newUsuario, setNewUsuario] = useState({
    nombreusuario: "",
    direcciousuario: "",
    coloniausuario: "",
    telefonousuario: "",
    celularusuario: "",
    cedulausuario: "",
    claveespecialidad: "",
    usuario: "",
    password: "",
    clavetipousuario: "",
  });

  const [selectedUsuario, setSelectedUsuario] = useState(null); // Estado para el usuario seleccionado

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usuariosResponse,
          especialidadesResponse,
          tiposUsuariosResponse,
        ] = await Promise.all([
          fetch("/api/usuario"),
          fetch("/api/especialidades/especialidades"),
          fetch("/api/tiposusuarios"),
        ]);

        const usuariosData = await usuariosResponse.json();
        const especialidadesData = await especialidadesResponse.json();
        const tiposUsuariosData = await tiposUsuariosResponse.json();

        setUsuarios(usuariosData);
        setEspecialidades(
          Array.isArray(especialidadesData) ? especialidadesData : []
        );
        setTiposUsuarios(
          Array.isArray(tiposUsuariosData) ? tiposUsuariosData : []
        ); // Validar que sea un arreglo
      } catch {
        setError("Error al cargar los datos");
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (usuario) => {
    const confirmDelete = await Swal.fire({
      title: "¿Estás seguro?",
      text: "El usuario será desactivado y no podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, desactivar",
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(`/api/eliminarUser?usuario=${usuario}`, {
          method: "PUT",
        });

        if (!response.ok) {
          throw new Error("Error al desactivar el usuario");
        }

        // Actualizar la lista de usuarios
        const usuariosResponse = await fetch("/api/usuario");
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        Swal.fire("Desactivado", "El usuario ha sido desactivado.", "success");
      } catch (error) {
        console.error("Error al desactivar el usuario:", error);
        setError("Error al desactivar el usuario.");
      }
    }
  };

  const filteredUsuarios = Array.isArray(usuarios)
    ? usuarios.filter(
        (usuario) =>
          usuario.activo === "S" && // Solo incluir usuarios activos
          usuario.nombreusuario &&
          usuario.nombreusuario.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getEspecialidadNombre = (clave) => {
    if (!Array.isArray(especialidades) || especialidades.length === 0) {
      return "Desconocida";
    }
    const especialidad = especialidades.find(
      (especialidad) => especialidad.claveespecialidad === clave
    );
    return especialidad ? especialidad.especialidad : "Desconocida";
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    if (showModal) {
      setNewUsuario({
        nombreusuario: "",
        direcciousuario: "",
        coloniausuario: "",
        telefonousuario: "",
        celularusuario: "",
        cedulausuario: "",
        claveespecialidad: "",
        usuario: "",
        password: "",
        clavetipousuario: "",
      });
      setShowPassword(false); // Reinicia la visibilidad de la contraseña
      setSelectedUsuario(null); // Limpiar el usuario seleccionado al cerrar el modal
    }
  };

  const checkUsuarioDisponibilidad = async (usuario) => {
    if (!usuario) {
      setUsuarioError("El campo de usuario no puede estar vacío.");
      setIsUsuarioValido(false);
      return;
    }

    try {
      const response = await fetch(`/api/usuario?usuario=${usuario}`);
      const data = await response.json();

      if (data.length > 0) {
        setUsuarioError("El nombre de usuario ya está en uso.");
        setIsUsuarioValido(false);
      } else {
        setUsuarioError("");
        setIsUsuarioValido(true);
      }
    } catch (error) {
      console.error("Error al verificar el nombre de usuario:", error);
      setUsuarioError("Error al verificar el nombre de usuario.");
      setIsUsuarioValido(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUsuario({
      ...newUsuario,
      [name]:
        name === "claveespecialidad" || name === "clavetipousuario"
          ? parseInt(value, 10)
          : value,
    });

    if (name === "usuario") {
      checkUsuarioDisponibilidad(value);
    }
  };

  const handleBlur = () => {
    const baseName = newUsuario.nombreusuario
      ?.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "") // Remueve caracteres especiales
      ?.split(" ")
      ?.join(""); // Une las palabras
    const suggestedUsername = `${baseName}${Math.floor(Math.random() * 100)}`;

    if (!newUsuario.usuario) {
      setNewUsuario((prev) => ({
        ...prev,
        usuario: suggestedUsername,
      }));
      checkUsuarioDisponibilidad(suggestedUsername);
    }
  };

  const handleEditUser = async (usuario) => {
    setSelectedUsuario(usuario);
    try {
      // Asume que tienes un endpoint que devuelve la contraseña desencriptada
      const response = await fetch(`/api/desencryptar/${usuario.usuario}`);
      const data = await response.json();
      setNewUsuario({ ...usuario, password: data.passwordDesencriptada }); // Pone la contraseña desencriptada
    } catch (error) {
      console.error("Error al obtener la contraseña desencriptada", error);
    }
    setNewUsuario(usuario); // Prellenar el formulario con los datos del usuario seleccionado
    setShowModal(true); // Mostrar el modal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isUsuarioValido) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El nombre de usuario no es válido.",
      });
      return;
    }

    const usuarioData = {
      ...newUsuario,
      claveespecialidad: parseInt(newUsuario.claveespecialidad, 10),
      clavetipousuario: parseInt(newUsuario.clavetipousuario, 10),
    };

    try {
      if (selectedUsuario) {
        // Si hay un usuario seleccionado, hacemos un PUT
        const response = await fetch("/api/editUser", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
          throw new Error("Error al actualizar el usuario");
        }

        const result = await response.json();
        console.log("Usuario actualizado:", result);

        // Actualizar la lista de usuarios después de editar
        const usuariosResponse = await fetch("/api/usuario");
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        // Mostrar notificación de éxito con SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Usuario Actualizado correctamente",
          showConfirmButton: false,
          timer: 2000,
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
        if (
          !usuarioData.nombreusuario ||
          !usuarioData.usuario ||
          !usuarioData.password
        ) {
          Swal.fire({
            icon: "error",
            title: "Campos Vacíos",
            text: "Por favor, completa todos los campos requeridos para agregar un usuario.",
          });
          return;
        }

        // Aquí va tu lógica para crear un nuevo usuario
        const response = await fetch("/api/crearUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
          throw new Error("Error al agregar el usuario");
        }

        const result = await response.json();
        console.log("Usuario agregado:", result);

        // Actualizar la lista de usuarios después de agregar
        const usuariosResponse = await fetch("/api/usuario");
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        // Mostrar notificación de éxito con SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Usuario Agregado correctamente",
          showConfirmButton: false,
          timer: 2000,
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
      setError(
        selectedUsuario
          ? "Error al actualizar el usuario"
          : "Error al agregar el usuario"
      );
    }
  };

  const router = useRouter(); // declaro la variable router
  const handleBack = () => {
    router.back("/inicio-servicio-medico"); // Esto regresa a la página anterior en el historial de navegación
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
        <button onClick={handleBack} className={styles.backButton}>
          Atrás
        </button>
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
          <button className={styles.button} onClick={toggleModal}>
            Agregar Usuario
          </button>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      className="bi bi-pencil"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-1.647 1.647-3-3L12.146.146zM11.5 1l-1 1L2 10.5V12h1.5L11 3.5 11.5 3 12 2.5 11.5 1z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteUser(item.usuario)}
                    className={styles.binButton}
                  >
                    {/* SVG para eliminar */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="currentColor"
                      className="bi bi-trash"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 0a.5.5 0 0 1 .5.5V1h5V.5a.5.5 0 0 1 1 0V1h1a1 1 0 0 1 1 1v1h-1.5l-1 11H2.5l-1-11H0V2a1 1 0 0 1 1-1h1V.5a.5.5 0 0 1 .5-.5zM1 2v1h1.5l1 11h9l1-11H15V2H1z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal &&
          ReactDOM.createPortal(
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <h2 className={styles.modalHeader}>
                  {selectedUsuario ? "Editar Usuario" : "Agregar Usuario"}
                </h2>

                <form className={styles.modalForm} onSubmit={handleSubmit}>
  {/* Campo para el nombre completo */}
  <div className={styles.inputGroup}>
    <label htmlFor="nombreusuario" className={`${styles.label} flex items-center gap-2`}>
      <FaUser className={styles.icon} /> Nombre completo
    </label>
    <input
      type="text"
      id="nombreusuario"
      name="nombreusuario"
      placeholder="Ingrese el nombre completo"
      onChange={handleInputChange}
      onBlur={() => {
        const baseName = newUsuario.nombreusuario
          ?.toLowerCase()
          .trim()
          .replace(/[^a-z0-9]/g, "")
          ?.split(" ")
          ?.join("");
        const suggestedUsername = `${baseName}${Math.floor(Math.random() * 100)}`;
        setNewUsuario((prev) => ({
          ...prev,
          usuario: suggestedUsername,
        }));
      }}
      value={newUsuario.nombreusuario || ""}
      className={styles.input}
      autoComplete="off"
    />
  </div>

  {/* Campo de dirección */}
  <div className={styles.inputGroup}>
    <label htmlFor="direcciousuario" className={`${styles.label} flex items-center gap-2`}>
      <FaMapMarkerAlt className={styles.icon} /> Calle
    </label>
    <input
      type="text"
      id="direcciousuario"
      name="direcciousuario"
      placeholder="Ingrese la dirección"
      onChange={handleInputChange}
      value={newUsuario.direcciousuario || ""}
      className={styles.input}
      autoComplete="off"
    />
  </div>

  {/* Campo de colonia */}
  <div className={styles.inputGroup}>
    <label htmlFor="coloniausuario" className={`${styles.label} flex items-center gap-2`}>
      <FaMap className={styles.icon} /> Colonia
    </label>
    <input
      type="text"
      id="coloniausuario"
      name="coloniausuario"
      placeholder="Ingrese la colonia"
      onChange={handleInputChange}
      value={newUsuario.coloniausuario || ""}
      className={styles.input}
      autoComplete="off"
    />
  </div>

  {/* Campo de teléfono */}
  <div className={styles.inputGroup}>
    <label htmlFor="telefonousuario" className={`${styles.label} flex items-center gap-2`}>
      <FaPhone className={styles.icon} /> Teléfono
    </label>
    <input
      type="text"
      id="telefonousuario"
      name="telefonousuario"
      placeholder="Ingrese el teléfono"
      onChange={handleInputChange}
      value={newUsuario.telefonousuario || ""}
      className={styles.input}
      autoComplete="off"
    />
  </div>

  {/* Campo de celular */}
  <div className={styles.inputGroup}>
    <label htmlFor="celularusuario" className={`${styles.label} flex items-center gap-2`}>
      <FaMobileAlt className={styles.icon} /> Celular
    </label>
    <input
      type="text"
      id="celularusuario"
      name="celularusuario"
      placeholder="Ingrese el celular"
      onChange={handleInputChange}
      value={newUsuario.celularusuario || ""}
      className={styles.input}
      autoComplete="off"
    />
  </div>

  {/* Campo de cédula */}
  <div className={styles.inputGroup}>
    <label htmlFor="cedulausuario" className={`${styles.label} flex items-center gap-2`}>
      <FaIdCard className={styles.icon} /> Cédula
    </label>
    <input
      type="text"
      id="cedulausuario"
      name="cedulausuario"
      placeholder="Ingrese la cédula"
      onChange={handleInputChange}
      value={newUsuario.cedulausuario || ""}
      className={styles.input}
      autoComplete="off"
    />
  </div>

  {/* Dropdown de especialidad */}
  <div className={styles.inputGroup}>
    <label htmlFor="claveespecialidad" className={`${styles.label} flex items-center gap-2`}>
      <FaBriefcase className={styles.icon} /> Especialidad
    </label>
    <select
      id="claveespecialidad"
      name="claveespecialidad"
      onChange={handleInputChange}
      value={newUsuario.claveespecialidad || ""}
      className={styles.dropdown}
    >
      <option value="">Seleccionar Especialidad</option>
      {Array.isArray(especialidades) &&
        especialidades.map((especialidad) => (
          <option key={especialidad.claveespecialidad} value={especialidad.claveespecialidad}>
            {especialidad.especialidad}
          </option>
        ))}
    </select>
  </div>

  {/* Campo de nombre de usuario */}
  <div className={styles.inputGroup}>
    <label htmlFor="usuario" className={`${styles.label} flex items-center gap-2`}>
      <FaUser className={styles.icon} /> Nombre de usuario
    </label>
    <input
      type="text"
      id="usuario"
      name="usuario"
      placeholder="Ingrese un nombre de usuario"
      onChange={handleInputChange}
      onBlur={handleBlur}
      value={newUsuario.usuario || ""}
      className={`${styles.input} ${
        usuarioError ? styles.inputError : styles.inputSuccess
      }`}
      autoComplete="off"
    />
    {usuarioError && (
      <p className={`${styles.errorMessage} ${styles.fadeIn}`}>{usuarioError}</p>
    )}
  </div>

  {/* Campo de contraseña */}
  <div className={styles.inputGroup}>
    <label htmlFor="password" className={`${styles.label} flex items-center gap-2`}>
      <FaLock className={styles.icon} /> Contraseña
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        id="password"
        name="password"
        placeholder="Ingrese la contraseña"
        onChange={handleInputChange}
        value={newUsuario.password || ""}
        className={styles.input}
        autoComplete="new-password"
      />
      <button
        onClick={togglePasswordVisibility}
        className={styles.eyeIcon}
        type="button"
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  </div>

  {/* Dropdown para tipo de usuario */}
  <div className={styles.inputGroup}>
    <label htmlFor="clavetipousuario" className={`${styles.label} flex items-center gap-2`}>
      <FaUsers className={styles.icon} /> Tipo de usuario
    </label>
    <select
      id="clavetipousuario"
      name="clavetipousuario"
      onChange={handleInputChange}
      value={newUsuario.clavetipousuario || ""}
      className={styles.dropdown}
    >
      <option value="">Seleccionar tipo de usuario</option>
      {Array.isArray(tiposUsuarios) &&
        tiposUsuarios.map((tipo) => (
          <option key={tipo.clavetipousuario} value={tipo.clavetipousuario}>
            {tipo.tipousuario}
          </option>
        ))}
    </select>
    {newUsuario.clavetipousuario === "" && (
      <p className={`${styles.errorMessage} ${styles.fadeIn}`}>
        Por favor, seleccione un tipo de usuario.
      </p>
    )}
  </div>

  {/* Botón de envío */}
  <button
    type="submit"
    className={`${styles.formSubmitBtn} ${
      !isUsuarioValido ? styles.buttonDisabled : ""
    }`}
    disabled={!isUsuarioValido}
  >
    {selectedUsuario ? "Actualizar Usuario" : "Agregar Usuario"}
  </button>
</form>


                <button className={styles.closeButton} onClick={toggleModal}>
                  Cerrar
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
