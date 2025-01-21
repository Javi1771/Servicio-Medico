import { connectToDatabase } from './connectToDatabase';
import sql from 'mssql';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { 
      nombreproveedor,
      direccionproveedor,
      coloniaproveedor,
      telefonoproveedor,
      celularproveedor,
      cedulaproveedor,
      claveespecialidad,
      usuario,
      password,
      clavetipousuario,
      costo
    } = req.body;

    try {
      const pool = await connectToDatabase(); //* Conectar a la base de datos

      //? Encriptar la contraseña antes de almacenarla
      const hashedPassword = await bcrypt.hash(password, 10);

      //* Realizar la inserción con el campo activo por defecto como 'S'
      await pool.request()
        .input('nombreproveedor', sql.VarChar, nombreproveedor)
        .input('direccionproveedor', sql.VarChar, direccionproveedor)
        .input('coloniaproveedor', sql.VarChar, coloniaproveedor)
        .input('telefonoproveedor', sql.VarChar, telefonoproveedor)
        .input('celularproveedor', sql.VarChar, celularproveedor)
        .input('cedulaproveedor', sql.VarChar, cedulaproveedor)
        .input('claveespecialidad', sql.Int, claveespecialidad) //* Asegúrate de que esté en formato entero
        .input('usuario', sql.VarChar, usuario)
        .input('password', sql.VarChar, hashedPassword) //* Guardar la contraseña encriptada
        .input('clavetipousuario', sql.Int, clavetipousuario) //* Asegúrate de que esté en formato entero
        .input('activo', sql.VarChar, 'S') //* Establecer el campo activo como 'S'
        .input('costo', sql.Money, costo)
        .query(`
          INSERT INTO proveedores 
            (nombreproveedor, direccionproveedor, coloniaproveedor, telefonoproveedor, celularproveedor, cedulaproveedor, claveespecialidad, usuario, password, clavetipousuario, activo, costo)
          VALUES 
            (@nombreproveedor, @direccionproveedor, @coloniaproveedor, @telefonoproveedor, @celularproveedor, @cedulaproveedor, @claveespecialidad, @usuario, @password, @clavetipousuario, @activo, @costo)
        `);

      res.status(201).json({ message: 'Usuario agregado exitosamente' });
    } catch (error) {
      console.error('Error al agregar el usuario:', error);
      res.status(500).json({ message: 'Error al agregar el usuario', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
