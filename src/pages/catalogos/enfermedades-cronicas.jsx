import { useEnfermedadesCronicas } from "../../hooks/EnfermedadesCronic/useEnfermedadesCronicas"; // Ruta al hook
import styles from "../css/catalogos/enfermedadesCronic.module.css";
import { useRouter } from "next/router";


export default function EnfermedadesCronicas() {
  const {
    enfermedades,
    newEnfermedad,
    error,
    setNewEnfermedad,
    handleSubmit,
    handleKpiSubmit, // Manejador del KPI (en el hook)
    selectedEnfermedadId,
    setSelectedEnfermedadId,
    newKpi,
    setNewKpi,
  } = useEnfermedadesCronicas();

  const router = useRouter(); // declaro la variable router
  const handleBack = () => {
    router.replace('/inicio-servicio-medico'); // Redirige a /inicio-servicio-medico
  };


  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <h2 className={styles.title}>Registro de Enfermedades Crónicas</h2>
        {error && <p className={styles.error}>{error}</p>}
        
        <button onClick={handleBack} className={styles.backButton}>
          Atrás
        </button>

        {/* Formulario para agregar nueva enfermedad */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="cronica"
            placeholder="Nueva enfermedad crónica"
            value={newEnfermedad}
            onChange={(e) => setNewEnfermedad(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.button}>
            Registrar Enfermedad
          </button>
        </form>

        {/* Tabla con las enfermedades registradas */}
        <h3 className={styles.subtitle}>Enfermedades Registradas</h3>
        <table className={styles.table}>
          <thead>
            <tr className={styles.trstyles}>
              <th>ID</th>
              <th>Enfermedad</th>
              <th>Estatus</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {enfermedades.map((enfermedad) => (
              <tr key={enfermedad.id_enf_cronica} className={styles.row}>
                <td>{enfermedad.id_enf_cronica}</td>
                <td>{enfermedad.cronica}</td>
                <td>{enfermedad.estatus === 1 ? "Inactivo" : "Activo"}</td>
                <td>
                  <div className={styles.tooltipContainer}>
                    <button
                      className={styles.kpiButton}
                      onClick={() => setSelectedEnfermedadId(enfermedad.id_enf_cronica)}
                    >
                      ❤️
                    </button>
                    <span className={styles.tooltipText}>Registrar KPIs</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Formulario de KPI */}
        {selectedEnfermedadId && (
          <div className={styles.kpiFormContainer}>
            <form onSubmit={handleKpiSubmit} className={styles.kpiForm}>
              <h4 className={styles.kpiFormTitle}>
                Registrar KPI para Enfermedad {selectedEnfermedadId}
              </h4>
              <input
                type="text"
                name="kpi"
                placeholder="Ingrese el KPI"
                value={newKpi}
                onChange={(e) => setNewKpi(e.target.value)}
                required
                className={styles.input}
              />
              <button type="submit" className={styles.button}>
                Registrar KPI
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
