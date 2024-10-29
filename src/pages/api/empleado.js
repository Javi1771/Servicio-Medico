const url = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { num_nom } = req.body;

    const empObject = {
      emp: {
        num_nom: num_nom,
      },
    };

    try {
      const soap = await import('soap');

      //* Crear el cliente SOAP de manera asincrónica
      const client = await soap.createClientAsync(url);

      //* Lista de operaciones disponibles
      const operations = Object.keys(client.describe().ServiceEmp.BasicHttpBinding_IEmpleado);

      //* Imprimir todas las operaciones disponibles en el servicio
      console.log('Operaciones disponibles en el servicio SOAP:');
      operations.forEach((operation, index) => {
        console.log(`${index + 1}. ${operation}`);
      });

      //? Ejecutar la operación GetEmpleado
      const [result] = await client.GetEmpleadoAsync(empObject);

      //* Imprimir el resultado completo en consola
      console.log('Resultado completo del servicio SOAP:');
      console.log(JSON.stringify(result, null, 2));

      //* Verificar si se encontró el resultado y devolverlo
      if (result && result.GetEmpleadoResult) {
        const empleado = result.GetEmpleadoResult;

        //* Imprimir todos los detalles del empleado de forma organizada
        console.log('Detalles del empleado:');
        console.log(JSON.stringify(empleado, null, 2));

        return res.status(200).json(empleado);
      } else {
        return res.status(404).json({ error: 'No se encontraron datos del empleado.' });
      }
    } catch (error) {
      //! Manejo de errores y respuesta en caso de fallo en el servicio SOAP
      console.error('Error consumiendo el servicio SOAP:', error);
      return res.status(500).json({ error: 'Error en el servidor.' });
    }
  } else {
    //! Método no permitido
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}

