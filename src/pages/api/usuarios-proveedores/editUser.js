import sql from 'mssql';
import { connectToDatabase } from '../connectToDatabase';

//* Endpoint para editar un usuario
export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const {
    usuarioOriginal,       
    usuario,               
    nombreproveedor,
    direccionproveedor,
    coloniaproveedor,
    telefonoproveedor,
    celularproveedor,
    cedulaproveedor,
    claveespecialidad,
    clavetipousuario,
    password,              
    costo,                 
  } = req.body;

  //* Validaciones mínimas
  if (!usuarioOriginal) {
    return res.status(400).json({
      message: 'Falta el usuarioOriginal para localizar el registro.',
    });
  }
  if (!usuario) {
    return res.status(400).json({
      message: 'Falta el campo usuario (nuevo).',
    });
  }
  if (!claveespecialidad || !clavetipousuario) {
    return res
      .status(400)
      .json({ message: 'Faltan la clave de especialidad o tipo de usuario.' });
  }

  try {
    //* Conexión a la base de datos
    const pool = await connectToDatabase();

    //* Preparamos la petición
    const request = pool
      .request()
      //* Inputs para actualizaciones genéricas
      .input('nombreproveedor', sql.VarChar, nombreproveedor)
      .input('direccionproveedor', sql.VarChar, direccionproveedor)
      .input('coloniaproveedor', sql.VarChar, coloniaproveedor)
      .input('telefonoproveedor', sql.VarChar, telefonoproveedor)
      .input('celularproveedor', sql.VarChar, celularproveedor)
      .input('cedulaproveedor', sql.VarChar, cedulaproveedor)
      .input('claveespecialidad', sql.Int, claveespecialidad)
      .input('clavetipousuario', sql.Int, clavetipousuario)
      .input('usuario', sql.VarChar, usuario)             
      .input('usuarioOriginal', sql.VarChar, usuarioOriginal);

    //* Si manejas costo:
    if (typeof costo !== 'undefined') {
      //* Ajusta el tipo de dato a lo que uses en SQL (decimal, numeric, money, etc.)
      request.input('costo', sql.Decimal, costo);
    }

    let query;

    //* Definimos la parte SET común a todos
    let setClause = `
      nombreproveedor   = @nombreproveedor,
      direccionproveedor= @direccionproveedor,
      coloniaproveedor  = @coloniaproveedor,
      telefonoproveedor = @telefonoproveedor,
      celularproveedor  = @celularproveedor,
      cedulaproveedor   = @cedulaproveedor,
      claveespecialidad = @claveespecialidad,
      clavetipousuario  = @clavetipousuario,
      usuario           = @usuario
    `;

    //* Si tienes costo en la tabla, agrégalo al SET
    if (typeof costo !== 'undefined') {
      setClause += `, costo = @costo`;
    }

    //* Si hay nueva contraseña, la añadimos a la query
    if (password && password.trim() !== '') {
      request.input('password', sql.VarChar, password);

      query = `
        UPDATE proveedores
           SET ${setClause},
               password = @password
         WHERE usuario = @usuarioOriginal
      `;
    } else {
      query = `
        UPDATE proveedores
           SET ${setClause}
         WHERE usuario = @usuarioOriginal
      `;
    }

    //* Ejecutar la consulta
    await request.query(query);

    res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res
      .status(500)
      .json({ message: 'Error en el servidor', error: error.message });
  }
}