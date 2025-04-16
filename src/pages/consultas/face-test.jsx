/* eslint-disable @typescript-eslint/no-unused-vars */
import FaceAuth from "./components/FaceAuth";
import { connectToDatabase } from "../api/connectToDatabase";
import { useState } from "react";

export default function FaceTestPage({ initialBeneficiaries }) {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);

  /*
   * 🔍 Buscar beneficiarios después del reconocimiento facial
   */
  const fetchBeneficiariesByRecognition = async (nomina) => {
    //console.log(`🔍 Buscando beneficiarios para la nómina reconocida: ${nomina}`);

    //* Filtrar beneficiarios obtenidos previamente sin hacer una nueva consulta
    const matchedBeneficiaries = initialBeneficiaries.filter(
      (beneficiary) => beneficiary.NO_NOMINA === nomina
    );

    if (matchedBeneficiaries.length > 0) {
      //console.log("✅ Beneficiario encontrado:", matchedBeneficiaries);
      setBeneficiaries(matchedBeneficiaries);
    } else {
      //console.log("❌ No se encontró beneficiario para la nómina:", nomina);
      setBeneficiaries([]); //* Limpiar lista si no hay coincidencia
    }
  };

  return (
    <div>
      <FaceAuth
        beneficiaries={beneficiaries}
        onRecognized={fetchBeneficiariesByRecognition}
      />
    </div>
  );
}

/*
 * 🔍 Obtener beneficiarios iniciales desde la base de datos
 */
export async function getServerSideProps() {
  try {
    const db = await connectToDatabase();
    const result = await db.query(`
      SELECT 
        B.ID_BENEFICIARIO,
        B.NO_NOMINA,
        B.NOMBRE,
        B.A_PATERNO,
        B.A_MATERNO,
        B.DESCRIPTOR_FACIAL
      FROM BENEFICIARIO B
      WHERE B.DESCRIPTOR_FACIAL IS NOT NULL AND B.DESCRIPTOR_FACIAL <> '' AND B.ACTIVO = 'A'
    `);

    return { props: { initialBeneficiaries: result.recordset } };
  } catch (error) {
    console.error("❌ Error al consultar la base de datos:", error);
    return { props: { initialBeneficiaries: [] } };
  }
}
