import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import styles from "../css/usuarios.module.css";
import Image from "next/image";
import { useRouter } from "next/router";

export default function MedicamentosTable() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newMedicamento, setNewMedicamento] = useState({
    medicamento: "",
    clasificacion: "",
    ean: "", // Nuevo campo para el código EAN
  });
  const [selectedMedicamento, setSelectedMedicamento] = useState(null);
  const [clasificaciones, setClasificaciones] = useState({});
  const [selectedClasificacion, setSelectedClasificacion] = useState("");

  useEffect(() => {
    fetchMedicamentos();
    fetchClasificaciones();
  }, []);

  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/mostMedicamentos");
      const data = await response.json();
      // Filtrar medicamentos activos
      const medicamentosActivos = data.filter(
        (medicamento) =>
          medicamento.ESTATUS === 1 || medicamento.ESTATUS === true
      );

      setMedicamentos(medicamentosActivos);
    } catch {
      setError("Error al cargar los datos");
    }
  };

  const fetchClasificaciones = async () => {
    try {
      const response = await fetch("/api/clasificacionesMed");
      const data = await response.json();
      const clasificacionMap = data.reduce((map, item) => {
        map[item.TIPO_MED] = item.DESCRIPCION;
        return map;
      }, {});
      setClasificaciones(clasificacionMap);
    } catch {
      setError("Error al cargar los datos de clasificaciones");
    }
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    if (showModal) {
      setNewMedicamento({ medicamento: "", clasificacion: "", ean: "" });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedicamento({ ...newMedicamento, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const medicamentoData = {
      medicamento: newMedicamento.medicamento,
      clasificacion: newMedicamento.clasificacion,
      ean: newMedicamento.ean || null,
    };

    try {
      const response = await fetch("/api/crearMedicamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicamentoData),
      });

      if (!response.ok) {
        throw new Error("Error al agregar el medicamento");
      }

      Swal.fire({
        icon: "success",
        title: "Medicamento agregado correctamente",
        showConfirmButton: false,
        timer: 2000,
      });

      await fetchMedicamentos(); // Refresca la lista
      toggleModal(); // Cierra el modal
    } catch (error) {
      console.error("Error al agregar el medicamento:", error);
      setError("Error al agregar el medicamento");
    }
  };

  const handleDeleteMedicamento = async (clavemedicamento) => {
    const confirmDelete = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(`/api/eliminarMedicamentos`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clavemedicamento }),
        });

        if (!response.ok) throw new Error("Error al eliminar el medicamento");

        await fetchMedicamentos();
        Swal.fire("Eliminado", "El medicamento ha sido eliminado", "success");
      } catch (error) {
        console.error("Error al intentar eliminar el medicamento:", error);
        setError("Error al eliminar el medicamento");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClasificacionChange = (e) => {
    setSelectedClasificacion(e.target.value);
  };

  const filteredMedicamentos = medicamentos.filter((item) => {
    const matchesSearch =
      item.MEDICAMENTO &&
      item.MEDICAMENTO.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClasificacion = selectedClasificacion
      ? item.CLASIFICACION === selectedClasificacion
      : true;
    return matchesSearch && matchesClasificacion;
  });

  const router = useRouter();
  const handleBack = () => {
    router.back();
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
        <h2 className={styles.title}>Lista de Medicamentos</h2>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar medicamento..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${styles.input} input`}
          />
        </div>

        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={toggleModal}>
            Agregar Medicamento
          </button>
        </div>

        {/* Agregar checkboxes para filtrar */}
        <div className={styles.radioContainer}>
          <label className={styles.label}>
            <input
              type="radio"
              name="clasificacion"
              value=""
              checked={selectedClasificacion === ""}
              onChange={handleClasificacionChange}
              className={styles.radioInput}
            />
            <div className={styles.radioDesign}></div>
            <div className={styles.labelText}>Todos</div>
          </label>
          <label className={styles.label}>
            <input
              type="radio"
              name="clasificacion"
              value="P"
              checked={selectedClasificacion === "P"}
              onChange={handleClasificacionChange}
              className={styles.radioInput}
            />
            <div className={styles.radioDesign}></div>
            <div className={styles.labelText}>Patente</div>
          </label>
          <label className={styles.label}>
            <input
              type="radio"
              name="clasificacion"
              value="G"
              checked={selectedClasificacion === "G"}
              onChange={handleClasificacionChange}
              className={styles.radioInput}
            />
            <div className={styles.radioDesign}></div>
            <div className={styles.labelText}>Genérico</div>
          </label>
          <label className={styles.label}>
            <input
              type="radio"
              name="clasificacion"
              value="C"
              checked={selectedClasificacion === "C"}
              onChange={handleClasificacionChange}
              className={styles.radioInput}
            />
            <div className={styles.radioDesign}></div>
            <div className={styles.labelText}>Controlado</div>
          </label>
          <label className={styles.label}>
            <input
              type="radio"
              name="clasificacion"
              value="E"
              checked={selectedClasificacion === "E"}
              onChange={handleClasificacionChange}
              className={styles.radioInput}
            />
            <div className={styles.radioDesign}></div>
            <div className={styles.labelText}>Especialidad</div>
          </label>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Clave</th>
              <th>Medicamento</th>
              <th>Clasificación</th>
              <th>EAN</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicamentos.map((item, index) => (
              <tr key={index} className={styles.row}>
                <td>{item.CLAVEMEDICAMENTO}</td>
                <td>{item.MEDICAMENTO}</td>
                <td>
                  {clasificaciones[item.CLASIFICACION] || item.CLASIFICACION}
                </td>
                <td>{item.EAN || "N/A"}</td>
                <td>
                  <button
                    onClick={() =>
                      handleDeleteMedicamento(item.CLAVEMEDICAMENTO)
                    }
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
                  {selectedMedicamento
                    ? "Editar Medicamento"
                    : "Agregar Medicamento"}
                </h2>
                <form className={styles.modalForm} onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="medicamento"
                    placeholder="Medicamento"
                    onChange={handleInputChange}
                    value={newMedicamento.medicamento}
                    required
                  />
                  <select
                    name="clasificacion"
                    onChange={handleInputChange}
                    value={newMedicamento.clasificacion}
                    required
                    className={styles.selectInput}
                  >
                    <option value="">Seleccionar Clasificación</option>
                    {Object.entries(clasificaciones).map(
                      ([codigo, descripcion]) => (
                        <option key={codigo} value={codigo}>
                          {descripcion}
                        </option>
                      )
                    )}
                  </select>
                  <input
                    type="text"
                    name="ean"
                    placeholder="EAN (Opcional)"
                    onChange={handleInputChange}
                    value={newMedicamento.ean}
                  />
                  <button type="submit" className={styles.formSubmitBtn}>
                    {selectedMedicamento
                      ? "Actualizar Medicamento"
                      : "Agregar Medicamento"}
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
