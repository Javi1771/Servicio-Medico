/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { showCustomAlert } from "../../utils/alertas";
import styles from "../css/usuarios.module.css";
import Image from "next/image";
import { useRouter } from "next/router";

export default function EspecialidadesTable() {
  const [especialidades, setEspecialidades] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newEspecialidad, setNewEspecialidad] = useState({
    especialidad: "",
  });
  const [selectedEspecialidad, setSelectedEspecialidad] = useState(null);

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch("/api/especialidades/especialidades");
      const data = await response.json();
      setEspecialidades(data);
    } catch {
      setError("Error al cargar los datos");
    }
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    if (showModal) {
      setNewEspecialidad({ especialidad: "" });
      setSelectedEspecialidad(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEspecialidad({ ...newEspecialidad, [name]: value });
  };

  const handleEditEspecialidad = (especialidad) => {
    setSelectedEspecialidad(especialidad);
    setNewEspecialidad({ especialidad: especialidad.especialidad });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const especialidadData = {
      claveespecialidad: selectedEspecialidad?.claveespecialidad, // Solo si es edición
      especialidad: newEspecialidad.especialidad,
    };

    //console.log("Datos enviados al backend:", especialidadData);

    try {
      const url = selectedEspecialidad
        ? "/api/especialidades/editEspecialidad"
        : "/api/especialidades/crearEspecialidad";
      const method = selectedEspecialidad ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(especialidadData),
      });

      if (response.status === 409) {
        //! Manejo del error de clave duplicada con SweetAlert
        await showCustomAlert(
          "error",
          "Error",
          "Ya existe una especialidad con este nombre. Por favor, ingrese un nombre diferente.",
          "Entendido"
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          selectedEspecialidad
            ? "Error al actualizar la especialidad"
            : "Error al agregar la especialidad"
        );
      }

      await showCustomAlert(
        "success",
        selectedEspecialidad
          ? "Especialidad actualizada correctamente"
          : "Especialidad agregada correctamente",
        "", // sin contenido adicional
        "Aceptar",
        {
          showConfirmButton: false,
          timer: 2000,
        }
      );

      await fetchEspecialidades();
      toggleModal();
    } catch (error) {
      console.error(error);

      await showCustomAlert(
        "error",
        "Error",
        selectedEspecialidad
          ? "Ocurrió un problema al actualizar la especialidad. Inténtelo de nuevo más tarde."
          : "Ocurrió un problema al agregar la especialidad. Inténtelo de nuevo más tarde.",
        "Entendido"
      );

      setError(
        selectedEspecialidad
          ? "Error al actualizar la especialidad"
          : "Error al agregar la especialidad"
      );
    }
  };

  const handleDeleteEspecialidad = async (claveespecialidad) => {
    // console.log(
    //   "Clave de especialidad enviada para eliminar:",
    //   claveespecialidad
    // ); // Agregamos un log para depuración

    const confirmDelete = await showCustomAlert(
      "warning",
      "¿Estás seguro?",
      "No podrás revertir esta acción",
      "Sí, eliminar",
      {
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        cancelButtonColor: "#d33",
        confirmButtonColor: "#d68030ff",
      }
    );

    if (confirmDelete.isConfirmed) {
      // Lógica para eliminar...
    }

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(
          "/api/especialidades/eliminarEspecialidades",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ claveespecialidad }), // Enviamos la claveespecialidad
          }
        );

        if (!response.ok) throw new Error("Error al eliminar la especialidad");

        await fetchEspecialidades(); // Refrescar la lista después de eliminar
        await showCustomAlert(
          "success",
          "Eliminado",
          "La especialidad ha sido eliminada",
          "Aceptar"
        );
      } catch (error) {
        console.error("Error al intentar eliminar la especialidad:", error);
        setError("Error al eliminar la especialidad");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const router = useRouter();
  const handleBack = () => {
    router.replace("/inicio-servicio-medico"); // Redirige a /inicio-servicio-medico
  };

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
        <h2 className={styles.title}>Lista de Especialidades</h2>
        {error && <p className={styles.error}>{error}</p>}
        {showSuccessMessage && (
          <div className={styles.successModal}>
            <p>Especialidad agregada o actualizada correctamente</p>
          </div>
        )}

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar especialidad..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${styles.input} input`}
          />
        </div>
        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={toggleModal}>
            Agregar Especialidad
          </button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Clave</th>
              <th>Especialidad</th>
              <th>Estatus</th>
              <th>Editar / Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {especialidades
              .filter((item) =>
                item.especialidad
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((item, index) => (
                <tr key={index} className={styles.row}>
                  <td>{item.claveespecialidad}</td>
                  <td>{item.especialidad}</td>
                  <td>{item.estatus ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button
                      onClick={() => handleEditEspecialidad(item)}
                      className={styles.editButton}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteEspecialidad(item.claveespecialidad)
                      } // Aquí enviamos claveespecialidad
                      className={styles.binButton}
                    >
                      Eliminar
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
                  {selectedEspecialidad
                    ? "Editar Especialidad"
                    : "Agregar Especialidad"}
                </h2>
                <form className={styles.modalForm} onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="especialidad"
                    placeholder="Especialidad"
                    onChange={handleInputChange}
                    value={newEspecialidad.especialidad}
                    required
                  />
                  <button type="submit" className={styles.formSubmitBtn}>
                    {selectedEspecialidad
                      ? "Actualizar Especialidad"
                      : "Agregar Especialidad"}
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
