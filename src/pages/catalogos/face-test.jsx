// pages/face-test.jsx
import FaceAuth from "../catalogos/components/FaceAuth";
import { connectToDatabase } from "../api/connectToDatabase";

export default function FaceTestPage({ beneficiaries }) {
  return (
    <div style={styles.pageContainer}>
      <h1 style={styles.title}>Prueba de Autenticación Facial</h1>
      <FaceAuth beneficiaries={beneficiaries} />
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const db = await connectToDatabase();
    const result = await db.query(`
      SELECT
        ID_BENEFICIARIO,
        NO_NOMINA,
        NOMBRE,
        A_PATERNO,
        A_MATERNO,
        DESCRIPTOR_FACIAL
      FROM BENEFICIARIO
      WHERE DESCRIPTOR_FACIAL IS NOT NULL
    `);

    // Convertimos recordset a un array
    const beneficiaries = result.recordset.map((row) => ({
      ID_BENEFICIARIO: row.ID_BENEFICIARIO,
      NO_NOMINA: row.NO_NOMINA,
      NOMBRE: row.NOMBRE,
      A_PATERNO: row.A_PATERNO,
      A_MATERNO: row.A_MATERNO,
      DESCRIPTOR_FACIAL: row.DESCRIPTOR_FACIAL, // string JSON
    }));

    return { props: { beneficiaries } };
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    return { props: { beneficiaries: [] } };
  }
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f5f7fa",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#333",
    marginBottom: "30px",
    fontSize: "2rem",
  },
};
