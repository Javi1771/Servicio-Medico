/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import ReactDOM from "react-dom"; //* Asegúrate de importar ReactDOM
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
  FaSpinner,
} from "react-icons/fa";
import Image from "next/image"; //* Asegúrate de importar Image desde next/image
import { useRouter } from "next/router";
import { showCustomAlert } from "../../utils/alertas";

export default function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [tiposUsuarios, setTiposUsuarios] = useState([]);

  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [isUsuarioValido, setIsUsuarioValido] = useState(true); //* estado para validar si el usuario es válido
  const [usuarioError, setUsuarioError] = useState(""); //! mensaje de error para el usuario
  const [passwordError, setPasswordError] = useState(""); //! Estado para manejar el error de contraseña
  const [phoneError, setPhoneError] = useState(""); //! Error de teléfono
  const [cellError, setCellError] = useState(""); //! Error de celular

  const [isFormComplete, setIsFormComplete] = useState(false); //* Estado para controlar si el formulario es válido
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false); //* Estado para el ojo de visibilidad
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); //* Estado para el mensaje de éxito
  const [newUsuario, setNewUsuario] = useState({
    nombreproveedor: "",
    direccionproveedor: "",
    coloniaproveedor: "",
    telefonoproveedor: "",
    celularproveedor: "",
    cedulaproveedor: "",
    claveespecialidad: "",
    usuario: "",
    password: "",
    clavetipousuario: "",
    costo: "",
  });

  //* Define las rutas de los sonidos de éxito y error
  const successSound = "/assets/applepay.mp3";
  const errorSound = "/assets/error.mp3";

  //! Reproduce un sonido de éxito/error
  const playSound = (isSuccess) => {
    const audio = new Audio(isSuccess ? successSound : errorSound);
    audio.play();
  };

  const [selectedUsuario, setSelectedUsuario] = useState(null); //* Estado para el usuario seleccionado

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          usuariosResponse,
          especialidadesResponse,
          tiposUsuariosResponse,
        ] = await Promise.all([
          fetch("/api/usuarios-proveedores/usuario"),
          fetch("/api/especialidades/especialidades"),
          fetch("/api/usuarios-proveedores/tiposusuarios"),
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
        ); //! Validar que sea un arreglo
      } catch {
        setError("Error al cargar los datos");
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (usuario) => {
    const confirmDelete = showCustomAlert(
      "warning",
      "¿Estás seguro?",
      "El usuario será desactivado y no podrás revertir esta acción.",
      "Sí, desactivar",
      {
        showCancelButton: true,
        confirmButtonColor: "#ce8218ff",
        cancelButtonColor: "#d33",
        cancelButtonText: "Cancelar",
      }
    );

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(
          `/api/usuarios-proveedores/eliminarUser?usuario=${usuario}`,
          {
            method: "PUT",
          }
        );

        if (!response.ok) {
          throw new Error("Error al desactivar el usuario");
        }

        //* Actualizar la lista de usuarios
        const usuariosResponse = await fetch(
          "/api/usuarios-proveedores/usuario"
        );
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        await showCustomAlert(
          "success",
          "Desactivado",
          "El usuario ha sido desactivado correctamente.",
          "Aceptar"
        );
      } catch (error) {
        console.error("Error al desactivar el usuario:", error);
        await showCustomAlert(
          "error",
          "Error",
          "Hubo un problema al desactivar el usuario. Intenta nuevamente.",
          "Aceptar"
        );
      }
    }
  };

  const filteredUsuarios = Array.isArray(usuarios)
    ? usuarios.filter(
        (usuario) =>
          usuario.activo === "S" && //* Solo incluir usuarios activos
          usuario.nombreproveedor &&
          usuario.nombreproveedor
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
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
      setIsSubmitting(false);
      setNewUsuario({
        nombreproveedor: "",
        direccionproveedor: "",
        coloniaproveedor: "",
        telefonoproveedor: "",
        celularproveedor: "",
        cedulaproveedor: "",
        claveespecialidad: "",
        usuario: "",
        password: "",
        clavetipousuario: "",
        costo: "",
      });
      setShowPassword(false); //* Reinicia la visibilidad de la contraseña
      setSelectedUsuario(null); //* Limpiar el usuario seleccionado al cerrar el modal
    }
  };

  const checkUsuarioDisponibilidad = async (usuario) => {
    if (!usuario) {
      setUsuarioError("El campo de usuario no puede estar vacío.");
      setIsUsuarioValido(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/usuarios-proveedores/usuario?usuario=${usuario}`
      );
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

    setNewUsuario((prev) => {
      const updatedUsuario = {
        ...prev,
        [name]:
          name === "claveespecialidad" || name === "clavetipousuario"
            ? parseInt(value, 10)
            : value,
      };

      //* Generar sugerencia de nombre de usuario
      if (name === "nombreproveedor") {
        if (value.trim() !== "") {
          const baseName = value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, "")
            .split(" ")
            .join("");
          const randomSuffix = Math.floor(Math.random() * 1000);
          updatedUsuario.usuario = `${baseName}_${randomSuffix}`;
          setUsuarioError(""); //! Limpiar error si el nombreproveedor tiene valor
        } else {
          updatedUsuario.usuario = ""; //* Limpiar usuario si el nombreproveedor está vacío
          setUsuarioError(
            "❌ El campo 'Nombre del Proveedor' no puede estar vacío."
          );
        }
      }

      //? Validar contraseña
      if (name === "password") {
        if (value.length < 6) {
          setPasswordError(
            "❌ La contraseña debe tener al menos 6 caracteres."
          );
        } else {
          setPasswordError(""); //* Contraseña válida
        }
      }

      //? Validar longitud exacta de teléfono
      if (name === "telefonoproveedor") {
        if (value.length === 10) {
          setPhoneError(""); //! Limpiar error si tiene exactamente 10 dígitos
        } else {
          setPhoneError("❌ El teléfono debe tener exactamente 10 dígitos.");
        }
      }

      //? Validar longitud exacta de celular
      if (name === "celularproveedor") {
        if (value.length === 10) {
          setCellError(""); //! Limpiar error si tiene exactamente 10 dígitos
        } else {
          setCellError("❌ El celular debe tener exactamente 10 dígitos.");
        }
      }

      return updatedUsuario;
    });

    //* Validar disponibilidad del usuario si el campo usuario está cambiando
    if (name === "usuario") {
      setUsuarioError(""); //! Limpiar cualquier mensaje previo
      checkUsuarioDisponibilidad(value); //* Solo validar disponibilidad
    }
  };

  const handleEditUser = (usuario) => {
    setSelectedUsuario(usuario);

    setNewUsuario({
      nombreproveedor: usuario.nombreproveedor ?? "",
      direccionproveedor: usuario.direccionproveedor ?? "",
      coloniaproveedor: usuario.coloniaproveedor ?? "",
      telefonoproveedor: usuario.telefonoproveedor ?? "",
      celularproveedor: usuario.celularproveedor ?? "",
      cedulaproveedor: usuario.cedulaproveedor ?? "",
      claveespecialidad: usuario.claveespecialidad ?? "",
      clavetipousuario: usuario.clavetipousuario ?? "",
      usuario: usuario.usuario ?? "",
      password: usuario.password, // siempre inicia vacío al editar
      costo: usuario.costo ?? "",
      usuarioOriginal: usuario.usuario, // clave para la BD
      claveproveedor: usuario.claveproveedor, // clave para la BD
    });

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; //! evita doble envío
    setIsSubmitting(true);

    if (!isUsuarioValido) {
      await showCustomAlert(
        "error",
        "Error",
        "El nombre de usuario no es válido.",
        "Aceptar"
      );

      return;
    }

    if (!newUsuario.password || newUsuario.password.length < 6) {
      await showCustomAlert(
        "error",
        "❌ Error",
        "La contraseña debe tener al menos 6 caracteres.",
        "Aceptar"
      );

      return;
    }

    const usuarioData = {
      ...newUsuario,
      claveespecialidad: parseInt(newUsuario.claveespecialidad, 10),
      clavetipousuario: parseInt(newUsuario.clavetipousuario, 10),
      costo: parseFloat(newUsuario.costo),
    };

    try {
      if (selectedUsuario) {
        //* Si hay un usuario seleccionado, hacemos un PUT
        const response = await fetch("/api/usuarios-proveedores/editUser", {
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
        //console.log("Usuario actualizado:", result);

        //* Actualizar la lista de usuarios después de editar
        const usuariosResponse = await fetch(
          "/api/usuarios-proveedores/usuario"
        );
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        //* Mostrar notificación de éxito con SweetAlert2
        await showCustomAlert(
          "success",
          "Usuario Actualizado",
          "El usuario se actualizó correctamente.",
          "Aceptar"
        );

        //* Mostrar el mensaje de éxito
        setShowSuccessMessage(true);
        toggleModal();

        //! Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        //* Validación de datos solo para agregar nuevo usuario
        if (
          !usuarioData.nombreproveedor ||
          !usuarioData.usuario ||
          !usuarioData.password
        ) {
          await showCustomAlert(
            "error",
            "Campos Vacíos",
            "Por favor, completa todos los campos requeridos para agregar un usuario.",
            "Aceptar"
          );

          return;
        }

        //* Aquí va tu lógica para crear un nuevo usuario
        const response = await fetch("/api/usuarios-proveedores/crearUser", {
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
        //console.log("Usuario agregado:", result);

        //* Actualizar la lista de usuarios después de agregar
        const usuariosResponse = await fetch(
          "/api/usuarios-proveedores/usuario"
        );
        const usuariosData = await usuariosResponse.json();
        setUsuarios(usuariosData);

        //* Mostrar notificación de éxito con SweetAlert2
        await showCustomAlert(
          "success",
          "Usuario Agregado",
          "El usuario se agregó correctamente.",
          "Aceptar"
        );

        //* Mostrar el mensaje de éxito
        setShowSuccessMessage(true);
        toggleModal();

        //! Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      await showCustomAlert(
        "error",
        "Error",
        `<p style='color: #fff; font-size: 1.1em;'>${
          selectedUsuario
            ? "Hubo un problema al actualizar el usuario."
            : "Hubo un problema al agregar el usuario."
        }</p>`,
        "Aceptar"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const router = useRouter(); //* declaro la variable router
  const handleBack = () => {
    router.replace("/inicio-servicio-medico"); //* Esto regresa a la página anterior en el historial de navegación
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  //* Función para validar el formulario
  const validateForm = () => {
    const allFieldsFilled =
      newUsuario.nombreproveedor.trim() !== "" &&
      newUsuario.direccionproveedor.trim() !== "" &&
      newUsuario.coloniaproveedor.trim() !== "" &&
      newUsuario.telefonoproveedor.trim() !== "" &&
      newUsuario.celularproveedor.trim() !== "" &&
      newUsuario.cedulaproveedor.trim() !== "" &&
      newUsuario.claveespecialidad !== "" &&
      newUsuario.clavetipousuario !== "" &&
      newUsuario.usuario.trim() !== "" &&
      newUsuario.password.trim() !== "" &&
      String(newUsuario.costo || "").trim() !== "" &&
      !isNaN(Number(newUsuario.costo)) &&
      Number(newUsuario.costo) >= 0;

    const noErrors = usuarioError === "" && passwordError === "";

    setIsFormComplete(allFieldsFilled && noErrors);
  };

  //* Efecto para validar el formulario cuando cambian los campos o errores
  useEffect(() => {
    validateForm();
  }, [newUsuario, usuarioError, passwordError]);

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <Image
          src="/baner_sjr.png"
          alt="Banner"
          layout="responsive"
          width={1920}
          height={1080}
          className={styles.banner}
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
                <td>{item.nombreproveedor}</td>
                <td>{getEspecialidadNombre(item.claveespecialidad)}</td>
                <td>{item.telefonoproveedor}</td>
                <td>{item.celularproveedor}</td>
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
            <div
              className={`${styles.modalOverlay} flex justify-center items-center`}
            >
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 rounded-lg shadow-2xl w-full max-w-4xl">
                <h2 className="text-4xl font-extrabold text-center text-teal-400 mb-6">
                  {selectedUsuario ? "Editar Usuario" : "Agregar Usuario"}
                </h2>

                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  onSubmit={handleSubmit}
                >
                  {/* Nombre completo */}
                  <div className="relative">
                    <label
                      htmlFor="nombreproveedor"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaUser className="inline mr-2 text-teal-400" /> Nombre
                      completo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        👤
                      </span>
                      <input
                        type="text"
                        id="nombreproveedor"
                        name="nombreproveedor"
                        placeholder="Ingrese el nombre completo"
                        onChange={handleInputChange}
                        value={newUsuario.nombreproveedor || ""}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese el nombre completo del proveedor.
                    </p>
                  </div>

                  {/* Dirección */}
                  <div className="relative">
                    <label
                      htmlFor="direccionproveedor"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaMapMarkerAlt className="inline mr-2 text-teal-400" />{" "}
                      Calle y Número
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        📍
                      </span>
                      <input
                        type="text"
                        id="direccionproveedor"
                        name="direccionproveedor"
                        placeholder="Ingrese la dirección"
                        onChange={handleInputChange}
                        value={newUsuario.direccionproveedor || ""}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese la dirección completa (calle y número).
                    </p>
                  </div>

                  {/* Colonia */}
                  <div className="relative">
                    <label
                      htmlFor="coloniaproveedor"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaMap className="inline mr-2 text-teal-400" /> Colonia
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        🏘️
                      </span>
                      <input
                        type="text"
                        id="coloniaproveedor"
                        name="coloniaproveedor"
                        placeholder="Ingrese la colonia"
                        onChange={handleInputChange}
                        value={newUsuario.coloniaproveedor || ""}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese el nombre de la colonia correspondiente.
                    </p>
                  </div>

                  {/* Teléfono */}
                  <div className="relative">
                    <label
                      htmlFor="telefonoproveedor"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaPhone className="inline mr-2 text-teal-400" /> Teléfono
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        📞
                      </span>
                      <input
                        type="text"
                        id="telefonoproveedor"
                        name="telefonoproveedor"
                        placeholder="Ingrese el teléfono"
                        onChange={handleInputChange}
                        value={newUsuario.telefonoproveedor || ""}
                        className={`pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 transition-all duration-300 border ${
                          phoneError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-teal-500"
                        }`}
                        autoComplete="off"
                        inputMode="numeric"
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        MXN
                      </span>
                    </div>
                    {phoneError && (
                      <p className="text-red-500 text-sm mt-2 animate-pulse">
                        {phoneError}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese un número de teléfono válido.
                    </p>
                  </div>

                  {/* Celular */}
                  <div className="relative">
                    <label
                      htmlFor="celularproveedor"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaMobileAlt className="inline mr-2 text-teal-400" />{" "}
                      Celular
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        📱
                      </span>
                      <input
                        type="text"
                        id="celularproveedor"
                        name="celularproveedor"
                        placeholder="Ingrese el celular"
                        onChange={handleInputChange}
                        value={newUsuario.celularproveedor || ""}
                        className={`pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 transition-all duration-300 border ${
                          cellError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-teal-500"
                        }`}
                        autoComplete="off"
                        inputMode="numeric"
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        MXN
                      </span>
                    </div>
                    {cellError && (
                      <p className="text-red-500 text-sm mt-2 animate-pulse">
                        {cellError}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese un número de celular válido.
                    </p>
                  </div>

                  {/* Cédula y Universidad */}
                  <div className="relative">
                    <label
                      htmlFor="cedulaproveedor"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaIdCard className="inline mr-2 text-teal-400" /> Cédula
                      y Universidad
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        🆔
                      </span>
                      <input
                        type="text"
                        id="cedulaproveedor"
                        name="cedulaproveedor"
                        placeholder="Ej: 11422001 / UNIVERSIDAD DE YUCATECOS TECNOLOGICA"
                        value={newUsuario.cedulaproveedor || ""}
                        onChange={(e) => {
                          let value = e.target.value;

                          //* Si el usuario ingresa 9 números seguidos, agregar automáticamente " / "
                          if (/^\d{9}$/.test(value)) {
                            value += " / ";
                          }

                          //* Validar el formato: números al inicio, diagonal permitida, universidad después
                          if (
                            /^\d{1,9}( \/ [A-Za-zÁÉÍÓÚáéíóúÑñ\s]*)?$/.test(
                              value
                            )
                          ) {
                            handleInputChange({
                              target: { name: "cedulaproveedor", value },
                            });
                          }
                        }}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500"
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese la cédula (solo números) seguido de <b> / </b> y
                      el nombre de la universidad.
                    </p>
                  </div>

                  {/* Especialidad */}
                  <div className="relative">
                    <label
                      htmlFor="claveespecialidad"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaBriefcase className="inline mr-2 text-teal-400" />{" "}
                      Especialidad
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        📋
                      </span>
                      <select
                        id="claveespecialidad"
                        name="claveespecialidad"
                        onChange={handleInputChange}
                        value={newUsuario.claveespecialidad || ""}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500 appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar Especialidad</option>
                        {especialidades.map((especialidad) => (
                          <option
                            key={especialidad.claveespecialidad}
                            value={especialidad.claveespecialidad}
                            className="bg-gray-800 text-white hover:bg-teal-500"
                          >
                            {especialidad.especialidad}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-400 pointer-events-none">
                        ▼
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Seleccione la especialidad correspondiente.
                    </p>
                  </div>

                  {/* Nombre de usuario */}
                  <div className="relative">
                    <label
                      htmlFor="usuario"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaUser className="inline mr-2 text-teal-400" /> Nombre de
                      usuario
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        👤
                      </span>
                      <input
                        type="text"
                        id="usuario"
                        name="usuario"
                        placeholder="Ingrese un nombre de usuario"
                        value={newUsuario.usuario || ""}
                        onChange={handleInputChange}
                        className={`pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 transition-all duration-300 border ${
                          usuarioError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-teal-500 focus:ring-teal-500"
                        }`}
                        autoComplete="off"
                      />
                    </div>
                    {usuarioError && (
                      <p className="text-red-500 text-sm mt-1 animate-pulse">
                        {usuarioError}
                      </p>
                    )}
                    {!usuarioError &&
                      newUsuario.usuario &&
                      newUsuario.usuario.includes("_") && (
                        <p className="text-teal-400 text-sm mt-1">
                          ✅ Sugerencia de sistema:{" "}
                          <span className="font-bold text-white">
                            {newUsuario.usuario}
                          </span>{" "}
                          (puedes modificarlo)
                        </p>
                      )}
                  </div>

                  {/* Contraseña */}
                  <div className="relative">
                    <label
                      htmlFor="password"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaLock className="inline mr-2 text-teal-400" />{" "}
                      Contraseña
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        🔒
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        placeholder={
                          selectedUsuario
                            ? "Escribe la nueva contraseña"
                            : "Ingrese la contraseña (mínimo 6 caracteres)"
                        }
                        onChange={handleInputChange}
                        value={newUsuario.password || ""}
                        className={`pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 transition-all duration-300 border ${
                          passwordError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-teal-500 focus:ring-teal-500"
                        }`}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-400"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-sm mt-1 animate-pulse">
                        {passwordError}
                      </p>
                    )}
                    {!passwordError && newUsuario.password.length >= 8 && (
                      <p className="text-teal-400 text-sm mt-1">
                        ✅ Contraseña válida
                      </p>
                    )}
                  </div>

                  {/* Tipo de usuario */}
                  <div className="relative">
                    <label
                      htmlFor="clavetipousuario"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaUsers className="inline mr-2 text-teal-400" /> Tipo de
                      usuario
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        🧑‍💼
                      </span>
                      <select
                        id="clavetipousuario"
                        name="clavetipousuario"
                        onChange={handleInputChange}
                        value={newUsuario.clavetipousuario || ""}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500 appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar tipo de usuario</option>
                        {tiposUsuarios.map((tipo) => (
                          <option
                            key={tipo.clavetipousuario}
                            value={tipo.clavetipousuario}
                            className="bg-gray-800 text-white hover:bg-teal-500"
                          >
                            {tipo.tipousuario}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-400 pointer-events-none">
                        ▼
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Seleccione el tipo de usuario que desea asignar.
                    </p>
                  </div>

                  {/* Costo de Consulta */}
                  <div className="relative">
                    <label
                      htmlFor="costoconsulta"
                      className="text-teal-300 font-semibold mb-2 block"
                    >
                      <FaBriefcase className="inline mr-2 text-teal-400" />{" "}
                      Costo de Consulta
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        id="costo"
                        name="costo"
                        placeholder="Ingrese el costo de la consulta"
                        onChange={handleInputChange}
                        value={newUsuario.costo || ""}
                        className="pl-10 w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-3 rounded-md shadow-inner focus:ring-2 focus:ring-teal-500 border border-teal-500 no-arrows"
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        MXN
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Ingrese el costo en pesos mexicanos (MXN).
                    </p>
                  </div>
                </form>

                {/* Botones */}
                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg"
                    onClick={toggleModal}
                  >
                    Cerrar
                  </button>
                  <div className="flex-grow"></div>
                  <button
                    type="submit"
                    disabled={!isFormComplete || isSubmitting}
                    onClick={handleSubmit}
                    className={`
                      py-2 px-6 rounded-lg shadow-lg font-bold flex items-center justify-center
                      ${
                        isFormComplete && !isSubmitting
                          ? "bg-teal-500 hover:bg-teal-600 text-white"
                          : "bg-gray-500 text-gray-300 cursor-not-allowed"
                      }
                      ${isSubmitting ? "opacity-75 cursor-wait" : ""}
                    `}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Cargando...
                      </>
                    ) : selectedUsuario ? (
                      "Actualizar Usuario"
                    ) : (
                      "Agregar Usuario"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
