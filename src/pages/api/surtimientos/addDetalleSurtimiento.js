import { connectToDatabase } from "../connectToDatabase";
import sql from "mssql";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const {
    folioSurtimiento,
    claveMedicamento,
    indicaciones,
    cantidad,
    estatus
  } = req.body;

  try {
    const pool = await connectToDatabase();

    // Depurar los datos que se están enviando
    // console.log("Datos que se están enviando a la tabla DETALLE_SURTIMIENTOS:");
    // console.log({
    //   folioSurtimiento,
    //   claveMedicamento,
    //   indicaciones,
    //   cantidad,
    //   estatus
    // });

    const query = `
      INSERT INTO detalleSurtimientos
        ([folioSurtimiento],
         [claveMedicamento],
         [indicaciones],
         [cantidad],
         [ESTATUS],
         [entregado])
      VALUES
        (@folioSurtimiento,
         @claveMedicamento,
         @indicaciones,
         @cantidad,
         @estatus,
         @entregado)
    `;

    await pool
      .request()
      .input("folioSurtimiento", sql.Int, folioSurtimiento)
      .input("claveMedicamento", sql.Int, claveMedicamento)
      .input("indicaciones", sql.NVarChar(sql.MAX), indicaciones)
      .input("cantidad", sql.NVarChar, cantidad)
      .input("estatus", sql.Bit, estatus)
      .input("entregado", sql.Int, 0) // Se establece en 0 por defecto
      .query(query);

    res.status(200).json({ message: "Detalle del surtimiento insertado exitosamente." });
  } catch (error) {
    console.error("Error al insertar el detalle del surtimiento:", error.message);
    res.status(500).json({ message: "Error en el servidor." });
  }
}
