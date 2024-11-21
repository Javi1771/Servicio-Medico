import React, { useState, useEffect } from "react";
import styles from "../css/RegisterMedicamento.module.css";

const RegisterMedicamento = () => {
  const [formData, setFormData] = useState({
    ean: "",
    sustancia: "",
    piezas: "",
    activo: true,
  });

  const [medicamentos, setMedicamentos] = useState([]);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/crearMedicamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ean: parseInt(formData.ean, 10),
          sustancia: formData.sustancia,
          piezas: parseInt(formData.piezas, 10),
          activo: formData.activo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Medicamento registrado exitosamente.");
        setFormData({ ean: "", sustancia: "", piezas: "", activo: true });
        fetchMedicamentos();
      } else {
        setMessage(data.message || "Error al registrar el medicamento.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error interno del servidor.");
    }
  };

  const fetchMedicamentos = async () => {
    try {
      const response = await fetch("/api/obtenerMedicamentos");
      const data = await response.json();
      if (response.ok) {
        setMedicamentos(data);
      } else {
        console.error("Error al obtener medicamentos:", data.message);
      }
    } catch (error) {
      console.error("Error interno:", error);
    }
  };

  useEffect(() => {
    fetchMedicamentos();
  }, []);

  return (
    <div className={styles.body}>
    <div className={styles.container}>
      <h1 className={styles.title}>Registrar Medicamento</h1>
      {message && <p className={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="ean" className={styles.label}>
            EAN (Código de Barras):
          </label>
          <input
            type="number"
            id="ean"
            name="ean"
            value={formData.ean}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="sustancia" className={styles.label}>
            Sustancia:
          </label>
          <input
            type="text"
            id="sustancia"
            name="sustancia"
            value={formData.sustancia}
            onChange={handleChange}
            maxLength={50}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="piezas" className={styles.label}>
            Piezas:
          </label>
          <input
            type="number"
            id="piezas"
            name="piezas"
            value={formData.piezas}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroupCheckbox}>
          <label htmlFor="activo" className={styles.label}>
            Activo:
          </label>
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className={styles.checkbox}
          />
        </div>
        <button type="submit" className={styles.button}>
          Registrar
        </button>
      </form>

      <h2 className={styles.subtitle}>Medicamentos Registrados</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>EAN</th>
            <th>Sustancia</th>
            <th>Piezas</th>
            <th>Fecha de Creación</th>
            <th>Activo</th>
          </tr>
        </thead>
        <tbody>
          {medicamentos.length > 0 ? (
            medicamentos.map((medicamento) => (
              <tr key={medicamento.id}>
                <td>{medicamento.id}</td>
                <td>{medicamento.ean}</td>
                <td>{medicamento.sustancia}</td>
                <td>{medicamento.piezas}</td>
                <td>
                  {medicamento.fechaCreacion
                    ? new Date(medicamento.fechaCreacion).toLocaleDateString(
                        "es-ES"
                      )
                    : "N/A"}
                </td>
                <td>{medicamento.activo ? "Sí" : "No"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className={styles.noData}>
                No hay medicamentos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default RegisterMedicamento;
