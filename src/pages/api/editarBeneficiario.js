import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const {
      idBeneficiario,
      parentesco,
      nombre,
      aPaterno,
      aMaterno,
      sexo,
      fNacimiento,
      alergias,
      sangre,
      telEmergencia,
      nombreEmergencia,
      activo, // Estado de actividad (A o I)
    } = req.body;

    if (!idBeneficiario) {
      return res.status(400).json({ message: "ID del beneficiario es requerido" });
    }

    // Debug: Verificar el valor de 'activo' recibido
    console.log("Valor de 'activo' recibido en la API:", activo);

    // Validación adicional: verificar que 'activo' sea "A" o "I"
    if (activo !== 'A' && activo !== 'I') {
      return res.status(400).json({ message: "Valor de 'activo' no válido. Debe ser 'A' o 'I'." });
    }

    try {
      const pool = await connectToDatabase();
      await pool.request()
        .input('idBeneficiario', idBeneficiario)
        .input('parentesco', parentesco)
        .input('nombre', nombre)
        .input('aPaterno', aPaterno)
        .input('aMaterno', aMaterno)
        .input('sexo', sexo)
        .input('fNacimiento', fNacimiento)
        .input('alergias', alergias)
        .input('sangre', sangre)
        .input('telEmergencia', telEmergencia)
        .input('nombreEmergencia', nombreEmergencia)
        .input('activo', activo) // Asegurarse de que es "A" o "I"
        .query(`
          UPDATE BENEFICIARIO
          SET PARENTESCO = @parentesco,
              NOMBRE = @nombre,
              A_PATERNO = @aPaterno,
              A_MATERNO = @aMaterno,
              SEXO = @sexo,
              F_NACIMIENTO = @fNacimiento,
              ALERGIAS = @alergias,
              SANGRE = @sangre,
              TEL_EMERGENCIA = @telEmergencia,
              NOMBRE_EMERGENCIA = @nombreEmergencia,
              [ACTIVO] = @activo -- Campo activo
          WHERE ID_BENEFICIARIO = @idBeneficiario
        `);

      res.status(200).json({ message: 'Beneficiario actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el beneficiario:', error);
      res.status(500).json({ message: 'Error al actualizar el beneficiario' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
