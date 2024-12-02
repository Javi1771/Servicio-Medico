import React, { useState } from "react";
import Swal from "sweetalert2";
import styles from "../../css/EstilosFarmacia/SurtirBeneficiario.module.css";

const SurtirBeneficiario = ({ onRowClick }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [empleado, setEmpleado] = useState(null);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEmpleado = async () => {
    setLoading(true);
    setError("");
    try {
      const empleadoResponse = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_nom: searchTerm }),
      });

      const empleadoData = await empleadoResponse.json();

      if (empleadoResponse.ok) {
        setEmpleado(empleadoData);

        const beneficiariosResponse = await fetch(
          "/api/farmacia/getBeneficiario_farmacia",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ num_nomina: searchTerm }),
          }
        );

        const beneficiariosData = await beneficiariosResponse.json();

        if (beneficiariosResponse.ok) {
          setBeneficiarios(beneficiariosData);
        } else {
          setBeneficiarios([]);
          setError(
            beneficiariosData.error ||
              "No se encontraron beneficiarios registrados."
          );
        }
      } else {
        setEmpleado(null);
        Swal.fire({
          icon: "error",
          title: "Empleado No Encontrado",
          text: `No se encontró ningún empleado con el número de nómina: ${searchTerm}.`,
          background: "#1e1e2d",
          color: "#ffffff",
          confirmButtonColor: "#fa009a",
        });
      }
    } catch (err) {
      console.error("Error al buscar empleado:", err);
      Swal.fire({
        icon: "error",
        title: "Error Inesperado",
        text: "Hubo un problema al buscar la información del empleado.",
        background: "#1e1e2d",
        color: "#ffffff",
        confirmButtonColor: "#fa009a",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (empleado) =>
    `${empleado?.nombre || ""} ${empleado?.a_paterno || ""} ${
      empleado?.a_materno || ""
    }`.trim();

  return (
    <div className={styles.body}>
      <div className={styles.surtirBeneficiarioContainer}>
        <h2 className={styles.surtirBeneficiarioTitle}>
          Surtir a Beneficiario
        </h2>

        {/* Barra de búsqueda */}
        <div className={styles.surtirBeneficiarioSearchContainer}>
          <input
            type="text"
            placeholder="Ingrese el número de nómina..."
            className={styles.surtirBeneficiarioSearchBar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className={styles.surtirBeneficiarioSearchButton}
            onClick={fetchEmpleado}
            disabled={loading || !searchTerm.trim()}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {/* Mensajes de error */}
        {error && (
          <p className={styles.surtirBeneficiarioError}>
            {typeof error === "string" ? error : "Ocurrió un error inesperado."}
          </p>
        )}

        {/* Contenedor del empleado */}
        {empleado && (
          <>
            <div className={styles.surtirBeneficiarioContent}>
              <div className={styles.surtirBeneficiarioCard}>
                <h3>
                  <strong>Nombre: </strong>
                  {getFullName(empleado)}
                </h3>
                <p>
                  <strong>Número de Nómina:</strong> {empleado.num_nom}
                </p>
                <p>
                  <strong>Departamento:</strong>{" "}
                  {empleado.departamento || "N/A"}
                </p>
                <p>
                  <strong>Teléfono:</strong> {empleado.telefono || "N/A"}
                </p>
                <p>
                  <strong>Puesto:</strong> {empleado.puesto || "N/A"}
                </p>
              </div>
            </div>

            {/* Contenedor de la tabla de beneficiarios */}
            {beneficiarios.length > 0 && (
              <div className={styles.beneficiariosTableContainer}>
                <h3 className={styles.beneficiariosTableTitle}>
                  Beneficiarios Registrados
                </h3>
                <table className={styles.beneficiariosTable}>
                  <thead>
                    <tr>
                      <th>Parentesco</th>
                      <th>Nombre</th>
                      <th>Sexo</th>
                      <th>Edad</th>
                      <th>Alergias</th>
                      <th>Sangre</th>
                      <th>Enfermedades Crónicas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiarios.map((beneficiario, index) => (
                      <tr
                        key={index}
                        onClick={() => onRowClick(beneficiario)}
                        className={styles.tableRow}
                      >
                        <td>{beneficiario.PARENTESCO || "N/A"}</td>
                        <td>
                          {beneficiario.NOMBRE} {beneficiario.A_PATERNO}{" "}
                          {beneficiario.A_MATERNO}
                        </td>
                        <td>
                          {beneficiario.SEXO === "1" ? "Masculino" : "Femenino"}
                        </td>
                        <td>{beneficiario.EDAD || "N/A"}</td>
                        <td>{beneficiario.ALERGIAS || "N/A"}</td>
                        <td>{beneficiario.SANGRE || "N/A"}</td>
                        <td>
                          {beneficiario.enfermedades_cronicas || "Ninguna"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SurtirBeneficiario;
