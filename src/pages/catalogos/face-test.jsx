import FaceAuth from "../catalogos/components/FaceAuth";
import { connectToDatabase } from "../api/connectToDatabase";
import styles from "../css/FaceTestPage.module.css";

export default function FaceTestPage({ beneficiaries }) {
  return (
      <FaceAuth beneficiaries={beneficiaries} />

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

    const beneficiaries = result.recordset.map((row) => ({
      ID_BENEFICIARIO: row.ID_BENEFICIARIO,
      NO_NOMINA: row.NO_NOMINA,
      NOMBRE: row.NOMBRE,
      A_PATERNO: row.A_PATERNO,
      A_MATERNO: row.A_MATERNO,
      DESCRIPTOR_FACIAL: row.DESCRIPTOR_FACIAL,
    }));

    return { props: { beneficiaries } };
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    return { props: { beneficiaries: [] } };
  }
}
