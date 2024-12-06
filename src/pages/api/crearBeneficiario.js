// /api/crearBeneficiario.js
import { connectToDatabase } from './connectToDatabase';
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
    domicilio,
    esEstudiante,
    esDiscapacitado,
    vigenciaEstudiosInicio, // Fecha de inicio de vigencia de estudios
    vigenciaEstudiosFin, // Fecha de fin de vigencia de estudios
  } = req.body;

  if (!noNomina || !nombre || !aPaterno || !fNacimiento || !telEmergencia || !sexo || !vigencia || !curp) {
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
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
  
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
      .input('fNacimiento', new Date(fNacimiento).toISOString())
      .input('edad', new Date().getFullYear() - new Date(fNacimiento).getFullYear())
      .input('departamento', departamento)
      .input('sindicato', sindicato)
      .input('alergias', alergias)
      .input('sangre', sangre)
      .input('telEmergencia', telEmergencia)
      .input('nombreEmergencia', nombreEmergencia)
      .input('imageUrl', imageUrl)
      .input('vigencia', new Date(vigencia).toISOString())
      .input('curp', curp)
      .input('domicilio', domicilio)
      .input('esEstudiante', esEstudiante)
      .input('vigenciaEstudiosInicio', vigenciaEstudiosInicio ? new Date(vigenciaEstudiosInicio).toISOString() : null)
      .input('vigenciaEstudiosFin', vigenciaEstudiosFin ? new Date(vigenciaEstudiosFin).toISOString() : null)
      .input('esDiscapacitado', esDiscapacitado)
      .input('estatus', 'A')
      .query(`
        INSERT INTO BENEFICIARIO (
          NO_NOMINA, PARENTESCO, NOMBRE, A_PATERNO, A_MATERNO, SEXO, 
          F_NACIMIENTO, EDAD, DEPARTAMENTO, SINDICATO, ALERGIAS, SANGRE, 
          TEL_EMERGENCIA, NOMBRE_EMERGENCIA, FOTO_URL, VIGENCIA, CURP,domicilio,ESESTUDIANTE, VIGENCIA_ESTUDIOS_INICIO, VIGENCIA_ESTUDIOS_FIN, 
          ESDISCAPACITADO, ACTIVO
        )
        VALUES (
          @noNomina, @parentesco, @nombre, @aPaterno, @aMaterno, @sexo, 
          @fNacimiento, @edad, @departamento, @sindicato, @alergias, @sangre, 
          @telEmergencia, @nombreEmergencia, @imageUrl, @vigencia, @curp, 
          @domicilio,
          @esEstudiante, @vigenciaEstudiosInicio, @vigenciaEstudiosFin, 
          @esDiscapacitado, @estatus
        )
      `);

    res.status(200).json({ message: 'Beneficiario agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar beneficiario:', error);
    res.status(500).json({ error: 'Error al agregar beneficiario' });
  }
}