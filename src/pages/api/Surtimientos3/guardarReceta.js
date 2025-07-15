// pages/api/Surtimientos3/guardarReceta.js
import { connectToDatabase } from '../connectToDatabase';
import sql from 'mssql';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { folioReceta, diagnostico, medicamentos } = req.body;
  if (!folioReceta || !diagnostico || !Array.isArray(medicamentos)) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  let pool;
  try {
    pool = await connectToDatabase();
  } catch (err) {
    console.error('Error al conectar BD:', err);
    return res.status(500).json({ error: 'Error de conexión' });
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    // 1) Actualiza el diagnóstico
    await transaction.request()
      .input('folio', sql.VarChar, folioReceta)
      .input('diag', sql.VarChar, diagnostico)
      .query(`
        UPDATE consultas
        SET diagnostico = @diag
        WHERE claveconsulta = @folio
      `);

    // 2) Inserta cada medicamento
    for (const med of medicamentos) {
      // Determina si hay resurtimiento
      const asignaRes = med.resurtir === 'si' ? 1 : 0;
      // Si asigna resurtimiento, cantidadMeses = mesesResurtir; si no, NULL
      const cantidadMeses = asignaRes ? med.mesesResurtir : null;
      
      // ✅ CORREGIDO: Guardar el TEXTO del tratamiento en lugar del número
      const cantidad = med.tratamiento || `DURANTE ${med.tratamientoDias || 30} DÍAS`;

      console.log(`💊 Guardando medicamento: ${med.medicamento}, cantidad: "${cantidad}"`);

      await transaction.request()
        .input('folio', sql.VarChar, folioReceta)
        .input('desc', sql.VarChar, med.medicamento)
        .input('ind', sql.VarChar, med.indicaciones)
        .input('pzas', sql.Int, med.piezas || 0)
        .input('estatus', sql.Int, 1)
        .input('cantidad', sql.VarChar, cantidad)  // ✅ Cambiar a VarChar para texto
        .input('seAsig', sql.Bit, asignaRes)
        .input('meses', sql.Int, cantidadMeses)
        .input('surtAct', sql.Int, 0)
        .query(`
          INSERT INTO detalleReceta
            (folioReceta, descMedicamento, indicaciones, estatus,
             cantidad, piezas, seAsignoResurtimiento, cantidadMeses, surtimientoActual)
          VALUES
            (@folio, @desc, @ind, @estatus,
             @cantidad, @pzas, @seAsig, @meses, @surtAct)
        `);
    }

    await transaction.commit();
    return res.status(200).json({ message: 'Guardado exitoso' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error en guardarReceta:', error);
    return res.status(500).json({ error: 'Error al guardar receta' });
  }
}