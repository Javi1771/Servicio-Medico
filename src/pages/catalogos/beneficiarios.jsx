import { useState, useEffect } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import Modal from "react-modal";
import styles from "../css/beneficiarios.module.css";
import { useRouter } from 'next/router'; // Importar useRouter para la navegación

Modal.setAppElement("#__next"); // Configuración del modal en Next.js

export default function RegistroBeneficiario() {
  const [numNomina, setNumNomina] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [parentescoOptions, setParentescoOptions] = useState([]);
  const [sexoOptions, setSexoOptions] = useState([]);
  const [sexoNombre, setSexoNombre] = useState(""); // Define sexoNombre como un estado
  const [formData, setFormData] = useState({
    parentesco: "",
    nombre: "",
    aPaterno: "",
    aMaterno: "",
    sexo: "",
    fNacimiento: "",
    alergias: "",
    sangre: "",
    telEmergencia: "",
    nombreEmergencia: "",
    activo: "A", // Campo de estado del beneficiario (A=Activo, I=Inactivo)
  });
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBeneficiaryId, setCurrentBeneficiaryId] = useState(null);

  function showEmployeeNotFoundAlert() {
    Swal.fire({
      title: "Empleado No Encontrado",
      text: "No se ha encontrado ningún empleado con ese número de nómina.",
      icon: "error",
      confirmButtonText: "Cerrar",
      background: "#2b2f3a",
      color: "#ffffff",
      confirmButtonColor: "#ff5722",
      customClass: {
        popup: "custom-swal-popup",
      },
    });
  }

  const router = useRouter(); // Define el router usando useRouter
  const handleBack = () => {
    router.back(); // Navegar a la página anterior en el historial
  };

  // Cambiar el estado activo/inactivo
  const toggleStatus = () => {
    // Alternar entre "A" y "I" para el estado de activo/inactivo usando formData.activo
    setFormData((prevData) => ({
      ...prevData,
      activo: prevData.activo === "A" ? "I" : "A",
    }));
  };
  
  // Función para obtener las opciones de sexo desde la API
  const fetchSexoOptions = async () => {
    try {
      const response = await fetch("/api/sexo");
      const data = await response.json();
      setSexoOptions(data);
    } catch (err) {
      console.error("Error fetching sexo options:", err);
    }
  };

  // Llama a las funciones de fetch al montar el componente
  useEffect(() => {
    fetchParentescoOptions();
    fetchSexoOptions();
  }, []);

  // Función para obtener la lista de beneficiarios
  const fetchBeneficiarios = async () => {
    try {
      const response = await fetch(
        `/api/mostBeneficiarios?num_nom=${numNomina}`
      );
      const data = await response.json();
      setBeneficiarios(data);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
    }
  };
  useEffect(() => {
    if (empleado) {
      fetchBeneficiarios();
    }
  }, [empleado]);

  // Obtener opciones de parentesco
  const fetchParentescoOptions = async () => {
    try {
      const response = await fetch("/api/parentescos");
      const data = await response.json();
      setParentescoOptions(data);
    } catch (err) {
      console.error("Error fetching parentesco options:", err);
    }
  };

  // Obtener el nombre del sexo
  const fetchSexoNombre = async (idSexo) => {
    try {
      const response = await fetch(`/api/sexo?idSexo=${idSexo}`);
      const data = await response.json();
      if (response.ok) {
        setSexoNombre(data.sexo);
      } else {
        console.error("Error fetching sexo:", data.error);
        setSexoNombre("N/A");
      }
    } catch (error) {
      console.error("Error fetching sexo:", error);
      setSexoNombre("N/A");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = async () => {
    if (!numNomina) {
      Swal.fire("Error", "Por favor, ingresa el número de nómina.", "warning");
      return;
    }

    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ num_nom: numNomina }),
      });

      if (!response.ok) {
        throw new Error("Empleado no encontrado");
      }

      const data = await response.json();
      setEmpleado(data);
      setError(null);
    } catch (err) {
      setEmpleado(null);
      setError(err.message);
      showEmployeeNotFoundAlert();
    }
  };

  const handleAddBeneficiary = () => {
    if (!empleado) {
      Swal.fire("Error", "Por favor, busca primero un empleado.", "warning");
      return;
    }
    setIsEditMode(false); // Establecer en modo agregar (registro)
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();

    // Cambia el endpoint y método según el modo (registro o edición)
    const endpoint = isEditMode
      ? "/api/editarBeneficiario"
      : "/api/crearBeneficiario";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idBeneficiario: currentBeneficiaryId, // Solo se usa en modo edición
          ...formData,
          noNomina: numNomina,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo procesar la solicitud.");
      }

      Swal.fire(
        "Éxito",
        isEditMode
          ? "Beneficiario editado correctamente."
          : "Beneficiario registrado correctamente.",
        "success"
      );

      // Reinicia el modal y el estado
      setIsModalOpen(false);
      setIsEditMode(false);
      setCurrentBeneficiaryId(null);
      setFormData({
        parentesco: "",
        nombre: "",
        aPaterno: "",
        aMaterno: "",
        sexo: "",
        fNacimiento: "",
        alergias: "",
        sangre: "",
        telEmergencia: "",
        nombreEmergencia: "",
        activo: "A",
      });
      fetchBeneficiarios();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  /** STATUS DEL ACTIVO/INACTIVO*/
  const handleStatusToggle = () => {
    setFormData((prevData) => ({
      ...prevData,
      activo: prevData.activo === "A" ? "I" : "A",
    }));
  };

  // Función para editar beneficiario existente
  const handleEditBeneficiary = (beneficiario) => {
    setFormData({
      parentesco: beneficiario.PARENTESCO,
      nombre: beneficiario.NOMBRE,
      aPaterno: beneficiario.A_PATERNO,
      aMaterno: beneficiario.A_MATERNO,
      sexo: beneficiario.SEXO,
      fNacimiento: beneficiario.F_NACIMIENTO,
      alergias: beneficiario.ALERGIAS,
      sangre: beneficiario.SANGRE,
      telEmergencia: beneficiario.TEL_EMERGENCIA,
      nombreEmergencia: beneficiario.NOMBRE_EMERGENCIA,
      activo: beneficiario.ACTIVO, // Cargar estado actual del beneficiario
    });
    setCurrentBeneficiaryId(beneficiario.ID_BENEFICIARIO);
    setIsEditMode(true); // Establecer en modo edición
    setIsModalOpen(true);
  };

  // Función para ver los datos del beneficiario
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleViewBeneficiary = (beneficiario) => {
    setSelectedBeneficiary(beneficiario);
    fetchSexoNombre(beneficiario.SEXO);
    setIsViewModalOpen(true);
  };

  // Función para confirmar y eliminar beneficiario
  const handleDeleteBeneficiary = (idBeneficiario) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/eliminarBeneficiario`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idBeneficiario }),
          });

          if (!response.ok) {
            throw new Error("No se pudo eliminar el beneficiario.");
          }

          Swal.fire(
            "Eliminado",
            "El beneficiario ha sido eliminado correctamente.",
            "success"
          );
          fetchBeneficiarios(); // Refresca la lista de beneficiarios después de eliminar
        } catch (error) {
          Swal.fire("Error", error.message, "error");
        }
      }
    });
  };

  /** */
  /**TERMINO DE LA FUNCION */

  return (
    <div className={styles.body}>
      <div className={styles.bannerContainer}>
        <Image
          src="/baner_sjr.png"
          alt="Banner"
          layout="responsive"
          width={1100}
          height={150}
          className={styles.banner}
        />
      </div>

      <div className={styles.container}>
        <h1 className={styles.title}>Registro de Beneficiarios</h1>
        <p>
        <button onClick={handleBack} className={styles.backButton}>
            {/* Icono de flecha para el botón de retroceso */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 1-.5.5H3.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L3.707 7.5H14.5A.5.5 0 0 1 15 8z"/>
            </svg>
            Volver
          </button>
        </p>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Número de Nómina"
            value={numNomina}
            onChange={(e) => setNumNomina(e.target.value)}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={styles.searchButtonIcon}
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
            </svg>
            Buscar
          </button>
        </div>

        <div className={styles.statusContainer}>
          {error && (
            <div className={`${styles.statusCard} ${styles.notFound}`}>
              <p>Empleado no encontrado</p>
            </div>
          )}
          {empleado && (
            <div className={`${styles.statusCard} ${styles.found}`}>
              <p>Empleado Encontrado</p>
            </div>
          )}

          {empleado && (
            <div className={styles.employeeInfo}>
              <h2>Detalles del Empleado:</h2>
              <p>
                <strong>Nombre:</strong> {empleado.nombre}
              </p>
              <p>
                <strong>Departamento:</strong> {empleado.departamento}
              </p>
              <p>
                <strong>Puesto:</strong> {empleado.puesto}
              </p>
            </div>
          )}
        </div>

        {empleado && (
          <button
            onClick={handleAddBeneficiary}
            className={`${styles.addBeneficiaryButton}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 1a.5.5 0 0 1 .5.5v6h6a.5.5 0 0 1 0 1h-6v6a.5.5 0 0 1-1 0v-6h-6a.5.5 0 0 1 0-1h6v-6A.5.5 0 0 1 8 1z" />
            </svg>
            Agregar Beneficiario
          </button>
        )}

        {/* Modal para agregar beneficiario */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => {
            setIsModalOpen(false);
            setIsEditMode(false);
            setFormData({
              parentesco: "",
              nombre: "",
              aPaterno: "",
              aMaterno: "",
              sexo: "",
              fNacimiento: "",
              alergias: "",
              sangre: "",
              telEmergencia: "",
              nombreEmergencia: "",
              activo: "A",
            });
          }}
          overlayClassName={styles.modalOverlay}
          className={styles.modal}
        >
          <form onSubmit={handleModalSubmit} className={styles.beneficiaryForm}>
            {/* Cambia el título según el modo */}
            <h2>
              {isEditMode ? "Editar Beneficiario" : "Registrar Beneficiario"}
            </h2>
            <button
  type="button"
  onClick={toggleStatus}
  className={`${styles.statusButton} ${
    formData.activo === "A" ? styles.active : styles.inactive
  }`}
>
  {formData.activo === "A" ? "Activo" : "Inactivo"}
</button>


            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Parentesco:
                  <select
                    name="parentesco"
                    value={formData.parentesco}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  >
                    <option value="">Selecciona</option>
                    {parentescoOptions.map((option) => (
                      <option
                        key={option.ID_PARENTESCO}
                        value={option.ID_PARENTESCO}
                      >
                        {option.PARENTESCO}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Nombre:
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Apellido Paterno:
                  <input
                    type="text"
                    name="aPaterno"
                    value={formData.aPaterno}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Apellido Materno:
                  <input
                    type="text"
                    name="aMaterno"
                    value={formData.aMaterno}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Sexo:
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  >
                    <option value="">Selecciona</option>
                    {sexoOptions.length > 0 &&
                      sexoOptions.map((option) => (
                        <option key={option.idSexo} value={option.idSexo}>
                          {option.sexo}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Fecha de Nacimiento:
                  <input
                    type="date"
                    name="fNacimiento"
                    value={formData.fNacimiento}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Alergias:
                  <input
                    type="text"
                    name="alergias"
                    value={formData.alergias}
                    onChange={handleInputChange}
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Tipo de Sangre:
                  <input
                    type="text"
                    name="sangre"
                    value={formData.sangre}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>

            <h3>En caso de emergencia, avisar a:</h3>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Nombre de Emergencia:
                  <input
                    type="text"
                    name="nombreEmergencia"
                    value={formData.nombreEmergencia}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Teléfono de Emergencia:
                  <input
                    type="text"
                    name="telEmergencia"
                    value={formData.telEmergencia}
                    onChange={handleInputChange}
                    required
                    className={styles.inputField}
                  />
                </label>
              </div>
            </div>
            {/* Cambia el texto del botón según el modo */}
            <button type="submit" className={styles.submitButton}>
              {isEditMode ? "Guardar Cambios" : "Guardar Beneficiario"}
            </button>
          </form>
        </Modal>

      {/**modal para ver los datos del beneficiario */}
<Modal
  isOpen={isViewModalOpen}
  onRequestClose={() => setIsViewModalOpen(false)}
  overlayClassName={styles.modalOverlay}
  className={styles.modal}
>
  {selectedBeneficiary && (
    <div className={styles.card}>
      <h2>Información del Beneficiario</h2>
      <p>
        <strong>ID:</strong> {selectedBeneficiary.ID_BENEFICIARIO}
      </p>
      <p>
        <strong>Número de Nómina:</strong> {selectedBeneficiary.NO_NOMINA}
      </p>
      <p>
        <strong>Parentesco:</strong> {selectedBeneficiary.PARENTESCO}
      </p>
      <p>
        <strong>Nombre:</strong> {selectedBeneficiary.NOMBRE}{" "}
        {selectedBeneficiary.A_PATERNO} {selectedBeneficiary.A_MATERNO}
      </p>
      <p>
        <strong>Sexo:</strong> {sexoNombre}
      </p>
      <p>
        <strong>Fecha de Nacimiento:</strong> {selectedBeneficiary.F_NACIMIENTO}
      </p>
      <p>
        <strong>Activo:</strong>{" "}
        {selectedBeneficiary.ACTIVO === "A" ? "Sí" : "No"}
      </p>
      <p>
        <strong>Alergias:</strong> {selectedBeneficiary.ALERGIAS}
      </p>
      <p>
        <strong>Tipo de Sangre:</strong> {selectedBeneficiary.SANGRE}
      </p>
      <p>
        <strong>Teléfono de Emergencia:</strong>{" "}
        {selectedBeneficiary.TEL_EMERGENCIA}
      </p>
      <p>
        <strong>Nombre de Contacto de Emergencia:</strong>{" "}
        {selectedBeneficiary.NOMBRE_EMERGENCIA}
      </p>
      <button
        onClick={() => setIsViewModalOpen(false)}
        className={styles.closeButton}
      >
        Cerrar
      </button>
    </div>
  )}
</Modal>


        {/* Tabla de beneficiarios, solo se muestra si el empleado es encontrado */}
        {empleado && beneficiarios.length > 0 && (
          <div className={styles.tableContainer}>
            <h2>Beneficiarios Registrados</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>No. Nómina</th>
                  <th>Parentesco</th>
                  <th>Nombre</th>
                  <th>Apellido Paterno</th>
                  <th>Apellido Materno</th>
                  <th>Fecha de Nacimiento</th>
                  <th>Estatus</th>
                  <th>Alergias</th>
                  <th>Tipo de Sangre</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {beneficiarios.map((beneficiario) => {
                  // Encuentra el nombre de parentesco y sexo correspondiente usando find
                  const parentesco = parentescoOptions.find(
                    (option) => option.ID_PARENTESCO === beneficiario.PARENTESCO
                  );

                  const sexo = Array.isArray(sexoOptions)
                    ? sexoOptions.find(
                        (option) => option.idSexo === beneficiario.SEXO
                      )
                    : null;

                  return (
                    <tr key={beneficiario.ID_BENEFICIARIO}>
                      <td>{beneficiario.ID_BENEFICIARIO}</td>
                      <td>{beneficiario.NO_NOMINA}</td>
                      <td>{parentesco ? parentesco.PARENTESCO : "N/A"}</td>
                      <td>{beneficiario.NOMBRE}</td>
                      <td>{beneficiario.A_PATERNO}</td>
                      <td>{beneficiario.A_MATERNO}</td>
                      <td>{beneficiario.F_NACIMIENTO}</td>
                      <td>
                        {beneficiario.ACTIVO === "A" ? "Activo" : "Inactivo"}
                      </td>
                      <td>{beneficiario.ALERGIAS}</td>
                      <td>{beneficiario.SANGRE}</td>

                      <td>
                        <button
                          onClick={() => handleEditBeneficiary(beneficiario)}
                          className={styles.editButton}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteBeneficiary(
                              beneficiario.ID_BENEFICIARIO
                            )
                          }
                          className={styles.deleteButton}
                        >
                          Eliminar
                        </button>

                        <button
                          onClick={() => handleViewBeneficiary(beneficiario)}
                          className={styles.viewButton}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M16 8s-3-5.333-8-5.333S0 8 0 8s3 5.333 8 5.333S16 8 16 8zm-8 4a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}