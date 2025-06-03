const url = 'http://172.16.0.7:8082/ServiceEmp/ServiceEmp.svc?wsdl';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { num_nom } = req.body;

    //console.log(`📩 Solicitud recibida con num_nom: ${num_nom}`);

    const empObject = {
      emp: {
        num_nom: num_nom,
      },
    };

    try {
      const soap = await import('soap');

      //console.log('🔧 Creando cliente SOAP...');
      const client = await soap.createClientAsync(url);

      //console.log('✅ Cliente SOAP creado exitosamente.');
      //console.log('📡 Llamando al servicio GetEmpleado con:', JSON.stringify(empObject, null, 2));

      //* Ejecutar la operación GetEmpleado
      const [result] = await client.GetEmpleadoAsync(empObject);

      console.log('📥 Respuesta recibida del servicio SOAP:', JSON.stringify(result, null, 2));

      //* Verificar si se encontró el resultado y devolverlo
      if (result && result.GetEmpleadoResult) {
        const empleado = result.GetEmpleadoResult;

        //console.log('👤 Datos del empleado recibidos:', JSON.stringify(empleado, null, 2));

        //* Validar y convertir la fecha de baja correctamente
        let fechaBaja = null;
        if (empleado.fecha_baja) {
          //* Normalizar la fecha para evitar errores
          const fechaBajaStr = empleado.fecha_baja.replace(/(\d{2})\/(\d{2})\/(\d{4}).*/, "$3-$2-$1");
          fechaBaja = new Date(fechaBajaStr);

          //console.log(`📅 Fecha de baja normalizada: ${fechaBaja.toISOString()}`);
        }

        const hoy = new Date(); //* Fecha actual
        //console.log(`📅 Fecha actual: ${hoy.toISOString()}`);
        //console.log(`🏢 Puesto del empleado: ${empleado.puesto}`);

        //* Filtrar si la fecha de baja es menor a hoy y el puesto NO es "PENSIONADO"
        if (fechaBaja && fechaBaja < hoy && empleado.puesto !== "PENSIONADO") {
          //console.log('🚫 El empleado tiene una fecha de baja anterior a hoy y NO es "PENSIONADO". No se mostrará.');
          return res.status(404).json({ error: 'El empleado tiene una fecha de baja anterior a hoy y no es PENSIONADO.' });
        }

        //console.log('✅ Empleado válido, enviando respuesta...');
        return res.status(200).json(empleado);
      } else {
        //console.log('⚠ No se encontraron datos del empleado.');
        return res.status(404).json({ error: 'No se encontraron datos del empleado.' });
      }
    } catch (error) {
      //! Manejo de errores y respuesta en caso de fallo en el servicio SOAP
      console.error('❌ Error consumiendo el servicio SOAP:', error);
      return res.status(500).json({ error: 'Error en el servidor.' });
    }
  } else {
    //! Método no permitido
    //console.log(`🚫 Método ${req.method} no permitido.`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} no permitido`);
  }
}
