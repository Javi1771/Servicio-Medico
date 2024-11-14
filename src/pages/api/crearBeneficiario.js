// api/crearBeneficiario.js
import { connectToDatabase } from '../api/connectToDatabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  // Validar datos recibidos
  if (!noNomina || !nombre || !aPaterno || !fNacimiento || !telEmergencia || !sexo) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  // Calcular la edad a partir de la fecha de nacimiento
  const birthDate = new Date(fNacimiento);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

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
      .input('edad', age)  // Añadir la edad calculada
      .input('alergias', alergias)
      .input('sangre', sangre)
      .input('telEmergencia', telEmergencia)
      .input('nombreEmergencia', nombreEmergencia)
      .input('imageUrl', imageUrl)
      .input('estatus', 'A')
      .query(`
        INSERT INTO BENEFICIARIO (
          NO_NOMINA, PARENTESCO, NOMBRE, A_PATERNO, A_MATERNO, SEXO, 
          F_NACIMIENTO, EDAD, ALERGIAS, SANGRE, TEL_EMERGENCIA, NOMBRE_EMERGENCIA, FOTO_URL, ACTIVO
        )
        VALUES (
          @noNomina, @parentesco, @nombre, @aPaterno, @aMaterno, @sexo, 
          @fNacimiento, @edad, @alergias, @sangre, @telEmergencia, @nombreEmergencia, @imageUrl, @estatus
        )
      `);

    res.status(200).json({ message: 'Beneficiario agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar beneficiario:', error);
    res.status(500).json({ error: 'Error al agregar beneficiario' });
  }
}
