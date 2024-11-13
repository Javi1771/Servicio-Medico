import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const {
      noNomina,
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
      imageUrl, // Nueva URL de la imagen
    } = req.body;

    try {
      const pool = await connectToDatabase();
      await pool.request()
        .input('noNomina', noNomina)
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
        .input('imageUrl', imageUrl) // Guardar la URL de la imagen
        .input('estatus', 'A') // Guardar como activo por defecto
        .query(`
          INSERT INTO BENEFICIARIO (NO_NOMINA, PARENTESCO, NOMBRE, A_PATERNO, A_MATERNO, SEXO, F_NACIMIENTO, ALERGIAS, SANGRE, TEL_EMERGENCIA, NOMBRE_EMERGENCIA, FOTO_URL, ACTIVO)
          VALUES (@noNomina, @parentesco, @nombre, @aPaterno, @aMaterno, @sexo, @fNacimiento, @alergias, @sangre, @telEmergencia, @nombreEmergencia, @imageUrl, @estatus)
        `);

      res.status(200).json({ message: 'Beneficiario agregado correctamente' });
    } catch (error) {
      console.error('Error al agregar beneficiario:', error);
      res.status(500).json({ error: 'Error al agregar beneficiario' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
