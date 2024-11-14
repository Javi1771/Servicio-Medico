// /api/crearBeneficiario.js
import { connectToDatabase } from '../api/connectToDatabase';
import fetch from 'node-fetch';

const getSindicato = (grupoNomina, cuotaSindical) => {
  if (grupoNomina === "NS") {
    return cuotaSindical === "S" ? "SUTSMSJR" : cuotaSindical === "" ? "SITAM" : null;
  }
  return null;
};

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
    imageUrl,
    vigencia,
    curp,
    situacion_lab,
    enfermedades_cronicas,
    tratamientos,
    domicilio, // Nuevo campo domicilio
  } = req.body;

  if (!noNomina || !nombre || !aPaterno || !fNacimiento || !telEmergencia || !sexo || !vigencia || !curp || !situacion_lab) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  let departamento = '';
  let sindicato = '';
  try {
    const response = await fetch('http://localhost:3000/api/empleado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_nom: noNomina }),
    });
    const data = await response.json();
    departamento = data.departamento || '';
    sindicato = getSindicato(data.grupoNomina, data.cuotaSindical);
  } catch (error) {
    console.error('Error al obtener departamento y sindicato:', error);
  }

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
      .input('edad', age)
      .input('departamento', departamento)
      .input('sindicato', sindicato)
      .input('alergias', alergias)
      .input('sangre', sangre)
      .input('telEmergencia', telEmergencia)
      .input('nombreEmergencia', nombreEmergencia)
      .input('imageUrl', imageUrl)
      .input('vigencia', vigencia)
      .input('curp', curp)
      .input('situacion_lab', situacion_lab)
      .input('enfermedades_cronicas', enfermedades_cronicas)
      .input('tratamientos', tratamientos)
      .input('domicilio', domicilio) // Guardar domicilio
      .input('estatus', 'A')
      .query(`
        INSERT INTO BENEFICIARIO (
          NO_NOMINA, PARENTESCO, NOMBRE, A_PATERNO, A_MATERNO, SEXO, 
          F_NACIMIENTO, EDAD, DEPARTAMENTO, SINDICATO, ALERGIAS, SANGRE, 
          TEL_EMERGENCIA, NOMBRE_EMERGENCIA, FOTO_URL, VIGENCIA, CURP, 
          situacion_lab, enfermedades_cronicas, tratamientos, domicilio, ACTIVO
        )
        VALUES (
          @noNomina, @parentesco, @nombre, @aPaterno, @aMaterno, @sexo, 
          @fNacimiento, @edad, @departamento, @sindicato, @alergias, @sangre, 
          @telEmergencia, @nombreEmergencia, @imageUrl, @vigencia, @curp, 
          @situacion_lab, @enfermedades_cronicas, @tratamientos, @domicilio, @estatus
        )
      `);

    res.status(200).json({ message: 'Beneficiario agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar beneficiario:', error);
    res.status(500).json({ error: 'Error al agregar beneficiario' });
  }
}
