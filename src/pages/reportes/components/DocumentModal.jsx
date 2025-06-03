import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTimes, FaDownload, FaUser, FaInfoCircle, FaExclamationTriangle, 
  FaCheck, FaTimes as FaCloseIcon, FaWheelchair, FaGraduationCap, 
  FaBirthdayCake, FaEdit, FaFileContract, FaIdCard, 
  FaRing, FaFileSignature, FaFileMedical, FaUserGraduate, 
  FaFolderOpen, FaEye, FaEyeSlash, FaFileAlt,
  FaCalendarTimes, FaUserMd, FaHeartbeat, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const docsList = [
  { label: 'Constancia', key: 'URL_CONSTANCIA', icon: <FaInfoCircle className="text-indigo-500" /> },
  { label: 'CURP', key: 'URL_CURP', icon: <FaIdCard className="text-cyan-500" /> },
  { label: 'Acta de Nacimiento', key: 'URL_ACTA_NAC', icon: <FaFileContract className="text-amber-500" /> },
  { label: 'INE', key: 'URL_INE', icon: <FaIdCard className="text-emerald-500" /> },
  { label: 'Concubinato', key: 'URL_CONCUBINATO', icon: <FaFileSignature className="text-rose-500" /> },
  { label: 'Acta de Matrimonio', key: 'URL_ACTAMATRIMONIO', icon: <FaRing className="text-purple-500" /> },
  { label: 'No ISSSTE', key: 'URL_NOISSTE', icon: <FaFileSignature className="text-blue-500" /> },
  { label: 'Incapacidad', key: 'URL_INCAP', icon: <FaFileMedical className="text-orange-500" /> },
  { label: 'Acta Dep. Económica', key: 'URL_ACTADEPENDENCIAECONOMICA', icon: <FaFileContract className="text-lime-500" /> },
  { label: 'Vigencia de Estudios', key: 'URL_VIGENCIA', icon: <FaCalendarTimes className="text-teal-500" /> }
];

// Función para calcular la edad a partir de la fecha de nacimiento
const calcularEdad = (fechaNac) => {
  if (!fechaNac) return 0;
  
  const hoy = new Date();
  const nacimiento = new Date(fechaNac);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
};

// Función para verificar si la vigencia de estudios ha expirado
const isVigenciaExpirada = (fechaVigencia) => {
  if (!fechaVigencia) return false;
  
  const hoy = new Date();
  const vigencia = new Date(fechaVigencia);
  
  // Ajustar a inicio del día para comparar solo fechas
  hoy.setHours(0, 0, 0, 0);
  vigencia.setHours(0, 0, 0, 0);
  
  return vigencia < hoy;
};

// Lista de campos obligatorios específicos
const camposObligatorios = [
  'PARENTESCO_DESCRIPCION',
  'F_NACIMIENTO',
  'ALERGIAS',
  'SANGRE',
  'TEL_EMERGENCIA',
  'NOMBRE_EMERGENCIA',
  'FIRMA'
];

// Obtener documentos requeridos por parentesco
const getDocumentosRequeridos = (PARENTESCO, edad, esDiscapacitado, esEstudiante) => {
    console.log("[DEBUG] Parentesco recibido:", PARENTESCO, "Tipo:", typeof PARENTESCO);

  // Convertir parentesco a número para comparación robusta
  const parentescoNum = parseInt(PARENTESCO);
    console.log("[DEBUG] Parentesco convertido a número:", parentescoNum);
  
  // Documentos base para TODOS los beneficiarios
  const baseDocs = [
    { key: 'URL_ACTA_NAC', label: 'Acta de Nacimiento', requerido: true },
    { key: 'URL_CURP', label: 'CURP', requerido: true }
  ];

  // Esposo(a)
  if (parentescoNum === 1 || parentescoNum === '1') {
    return [
      ...baseDocs,
      { key: 'URL_ACTAMATRIMONIO', label: 'Acta de Matrimonio', requerido: true },
      { key: 'URL_NOISSTE', label: 'Carta de no afiliación', requerido: true },
      { key: 'URL_INE', label: 'INE/Identificación', requerido: true }
    ];
  }
  
  // Hijo(a)
  if (parentescoNum === 2 || parentescoNum === '2') {
    const docs = [...baseDocs];
    
    // Para mayores de 16 años
    if (edad >= 16) {
      docs.push({ key: 'URL_INE', label: 'INE/Identificación', requerido: true });
    }
    
    // Para discapacitados (cualquier edad)
    if (esDiscapacitado === 'SI') {
      docs.push({ key: 'URL_INCAP', label: 'Acta de Incapacidad', requerido: true });
    }
    
    // Para estudiantes (cualquier edad)
    if (esEstudiante === 'SI') {
      docs.push(
        { key: 'URL_CONSTANCIA', label: 'Constancia de Estudios', requerido: true },
        { key: 'URL_VIGENCIA', label: 'Vigencia de Estudios', requerido: true }
      );
    }
    
    return docs;
  }
  
  // Concubino(a)
  if (parentescoNum === 3 || parentescoNum === '3') {
    return [
      ...baseDocs,
      { key: 'URL_CONCUBINATO', label: 'Acta de Concubinato', requerido: true },
      { key: 'URL_NOISSTE', label: 'Carta de no afiliación', requerido: true },
      { key: 'URL_INE', label: 'INE/Identificación', requerido: true }
    ];
  }
  
  // Padre/Madre
  if (parentescoNum === 4 || parentescoNum === 5 || parentescoNum === '4' || parentescoNum === '5') {
    return [
      ...baseDocs,
      { key: 'URL_ACTADEPENDENCIAECONOMICA', label: 'Acta de Dependencia Económica', requerido: true },
      { key: 'URL_NOISSTE', label: 'Carta de no afiliación', requerido: true },
      { key: 'URL_INE', label: 'INE/Identificación', requerido: true }
    ];
  }
  
  // Para cualquier otro caso (incluyendo valores no reconocidos)
  return baseDocs;
};

export default function DocumentModal({ beneficiary, onClose }) {
  // Obtener campos especiales
  const { FOTO_URL, FIRMA, ESDISCAPACITADO, ESESTUDIANTE, F_NACIMIENTO, F_NACIMIENTO_ISO, PARENTESCO, FECHA_VIGENCIA } = beneficiary;
  
  // Calcular edad usando F_NACIMIENTO_ISO para compatibilidad con el endpoint
  const edad = calcularEdad(F_NACIMIENTO_ISO || F_NACIMIENTO);
  
  // Verificar si falta la firma
  const faltaFirma = !FIRMA || FIRMA.trim() === '';
  
  // Estado para campos faltantes
  const [camposFaltantes, setCamposFaltantes] = useState([]);
  const [documentosFaltantes, setDocumentosFaltantes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [documentosRequeridos, setDocumentosRequeridos] = useState([]);
  const [vigenciaExpirada, setVigenciaExpirada] = useState(false);
  
  // Nuevo estado para mostrar/ocultar alertas
  const [showAlerts, setShowAlerts] = useState(true);
  const [showRules, setShowRules] = useState(false);

  // Usar useMemo para documentos requeridos
  const docsRequeridos = useMemo(() => {
    return getDocumentosRequeridos(PARENTESCO, edad, ESDISCAPACITADO, ESESTUDIANTE);
  }, [PARENTESCO, edad, ESDISCAPACITADO, ESESTUDIANTE]);
  
  // Validar campos obligatorios y documentos
  useEffect(() => {
    // Validar campos obligatorios
    const camposFaltantesTemp = camposObligatorios.filter(campo => 
      !beneficiary[campo] || beneficiary[campo].toString().trim() === ''
    );
    
    setCamposFaltantes(camposFaltantesTemp);
    
    // Validar documentos requeridos
    const documentosFaltantesTemp = [];
    docsRequeridos.forEach(doc => {
      if (doc.requerido && !beneficiary[doc.key]) {
        documentosFaltantesTemp.push(doc.label);
      }
    });
    setDocumentosFaltantes(documentosFaltantesTemp);
    
    // Verificar vigencia de estudios
    let vigenciaExpiradaTemp = false;
    if (ESESTUDIANTE === 'SI' && beneficiary.URL_VIGENCIA) {
      vigenciaExpiradaTemp = isVigenciaExpirada(FECHA_VIGENCIA);
    }
    setVigenciaExpirada(vigenciaExpiradaTemp);
    
    // Construir alertas
    const alertasTemp = [];
    if (faltaFirma) {
      alertasTemp.push('Falta firma');
    }
    camposFaltantesTemp.forEach(campo => {
      alertasTemp.push(`Falta capturar: ${campo.replace(/_/g, ' ')}`);
    });
    documentosFaltantesTemp.forEach(doc => {
      alertasTemp.push(`Documento requerido: Falta ${doc}`);
    });
    if (vigenciaExpiradaTemp) {
      alertasTemp.push('La vigencia de estudios ha expirado');
    }
    setAlertas(alertasTemp);
    
    setDocumentosRequeridos(docsRequeridos);
  }, [beneficiary, faltaFirma, docsRequeridos, ESESTUDIANTE, FECHA_VIGENCIA]);
  
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      >
        {/* Fondo con efecto de vidrio */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-10 border border-indigo-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                {/* Foto del beneficiario */}
                <div className="relative">
                  <div className="bg-white border-2 border-white rounded-full w-16 h-16 overflow-hidden shadow-lg flex items-center justify-center">
                    {FOTO_URL ? (
                      <Image
                        src={FOTO_URL}
                        alt={`Foto de ${beneficiary.NOMBRE}`}
                        className="w-full h-full object-cover"
                        width={64}
                        height={64}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/user_icon_.png';
                        }}
                        unoptimized
                      />
                    ) : (
                      <Image
                        src="/user_icon_.png"
                        alt="Icono de usuario"
                        className="w-full h-full object-cover"
                        width={64}
                        height={64}
                        unoptimized
                      />
                    )}
                  </div>
                  
                  {/* Indicador de estado de discapacidad */}
                  <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                    ESDISCAPACITADO === 'SI' 
                      ? "bg-green-500" 
                      : "bg-gray-400"
                  }`}>
                    {ESDISCAPACITADO === 'SI' ? (
                      <FaCheck className="text-white text-xs" />
                    ) : (
                      <FaCloseIcon className="text-white text-xs" />
                    )}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {beneficiary.NOMBRE} {beneficiary.A_PATERNO} {beneficiary.A_MATERNO}
                  </h2>
                  <p className="text-indigo-200 mt-1">Documentos del beneficiario</p>
                  
                  {/* Estado de discapacidad y estudiante */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      ESDISCAPACITADO === 'SI' 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {ESDISCAPACITADO === 'SI' ? (
                        <><FaWheelchair /> Discapacitado</>
                      ) : (
                        <><FaWheelchair /> No discapacitado</>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      ESESTUDIANTE === 'SI' 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {ESESTUDIANTE === 'SI' ? (
                        <><FaGraduationCap /> Estudiante</>
                      ) : (
                        <><FaGraduationCap /> No estudiante</>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                      <FaBirthdayCake /> Edad: {edad} años
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                onClick={onClose}
              >
                <FaTimes size={24} />
              </button>
            </div>
          </div>
          
          {/* Botón para mostrar/ocultar alertas */}
          <div className="flex justify-between px-6 py-2 bg-indigo-700">
            <div className="flex items-center">
              <div className={`text-xs font-bold px-3 py-1 rounded-full ${
                documentosFaltantes.length > 0 
                  ? "bg-red-100 text-red-700" 
                  : "bg-green-100 text-green-700"
              }`}>
                {documentosFaltantes.length > 0 
                  ? `${documentosFaltantes.length} documentos faltantes` 
                  : "Documentos completos"}
              </div>
            </div>
            
            <button 
              onClick={() => setShowAlerts(!showAlerts)}
              className="text-indigo-100 text-sm flex items-center gap-2 hover:bg-indigo-600 px-3 py-1 rounded-lg"
            >
              {showAlerts ? "Ocultar alertas" : "Mostrar alertas"} 
              {showAlerts ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Alertas de validación */}
          {(showAlerts && alertas.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-red-50 to-orange-50 border-t-4 border-red-500"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0" />
                  <h3 className="text-red-800 font-bold">¡Atención! Faltan documentos y/o información</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Cuadritos para documentos faltantes */}
                  {documentosFaltantes.map((doc, index) => (
                    <div 
                      key={`doc-${index}`} 
                      className="flex items-start gap-2 p-3 bg-red-100 rounded-lg"
                    >
                      <FaFileAlt className="text-red-600 mt-0.5" />
                      <div>
                        <span className="font-medium text-red-800">Documento faltante:</span>
                        <div className="text-red-700">{doc}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Cuadritos para campos faltantes */}
                  {camposFaltantes.map((campo, index) => {
                    // Determinar icono según tipo de campo
                    let icono = <FaEdit className="text-amber-600 mt-0.5" />;
                    if (campo.includes('SANGRE')) icono = <FaHeartbeat className="text-amber-600 mt-0.5" />;
                    if (campo.includes('ALERGIAS')) icono = <FaUserMd className="text-amber-600 mt-0.5" />;
                    
                    return (
                      <div 
                        key={`campo-${index}`} 
                        className="flex items-start gap-2 p-3 bg-amber-100 rounded-lg"
                      >
                        {icono}
                        <div>
                          <span className="font-medium text-amber-800">Dato faltante:</span>
                          <div className="text-amber-700">
                            {campo.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Alerta para vigencia expirada */}
                  {vigenciaExpirada && (
                    <div className="flex items-start gap-2 p-3 bg-red-100 rounded-lg">
                      <FaCalendarTimes className="text-red-600 mt-0.5" />
                      <div>
                        <span className="font-medium text-red-800">Documento expirado:</span>
                        <div className="text-red-700">Vigencia de estudios</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Contenido principal */}
          <div className="flex-1 overflow-auto flex flex-col md:flex-row">
            {/* Panel lateral de datos personales */}
            <div className="w-full md:w-2/5 border-r border-gray-200 p-6 bg-gradient-to-b from-indigo-50 to-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                  <FaUser className="text-indigo-500" />
                  Datos Personales
                </h3>
              </div>
              
              <div className="space-y-4">
                {camposObligatorios.map(campo => {
                  const valor = beneficiary[campo];
                  const estaVacio = !valor || valor.toString().trim() === '';
                  const esCampoFaltante = camposFaltantes.includes(campo);
                  
                  // No formatear F_NACIMIENTO porque ya viene formateado
                  let valorMostrado = valor;
                  
                  return (
                    <div 
                      key={campo} 
                      className={`bg-white rounded-xl p-4 shadow-sm border ${
                        esCampoFaltante ? "border-red-500 bg-red-50" : "border-gray-100"
                      }`}
                    >
                      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
                        {campo.replace(/_/g, ' ')}
                        {esCampoFaltante && (
                          <span className="text-red-500 ml-2">(Falta capturar)</span>
                        )}
                      </div>
                      <div className={`font-medium ${esCampoFaltante ? "text-red-700" : "text-gray-800"}`}>
                        {estaVacio ? "—" : valorMostrado}
                        
                        {/* Mostrar edad para fecha de nacimiento */}
                        {campo === 'F_NACIMIENTO' && !estaVacio && (
                          <div className="mt-1 text-sm text-indigo-600">
                            Edad: {edad} años
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* SECCIÓN MEJORADA: Documentos requeridos para este beneficiario */}
              <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-indigo-700 flex items-center gap-2">
                    <FaInfoCircle className="text-indigo-500" />
                    Documentos requeridos para {beneficiary.NOMBRE}
                  </h4>
                  
                  <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                    documentosFaltantes.length > 0 
                      ? "bg-red-100 text-red-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {documentosFaltantes.length > 0 
                      ? `${documentosFaltantes.length} faltantes` 
                      : "Completo"}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {documentosRequeridos.map((doc, index) => {
                    const existeDocumento = beneficiary[doc.key];
                    const esFaltante = doc.requerido && !existeDocumento;
                    
                    return (
                      <li 
                        key={index}
                        className={`flex items-start gap-2 p-2 rounded-lg ${
                          esFaltante
                            ? "bg-red-50 border border-red-200"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          esFaltante ? "bg-red-500" : "bg-green-500"
                        }`}>
                          {esFaltante 
                            ? <FaTimes className="text-white text-xs" />
                            : <FaCheck className="text-white text-xs" />
                          }
                        </div>
                        
                        <div>
                          <span className="font-medium">{doc.label}</span>
                          <div className={`text-xs ${
                            esFaltante 
                              ? "text-red-600 font-bold" 
                              : "text-green-600"
                          }`}>
                            {esFaltante 
                              ? "FALTANTE (obligatorio)" 
                              : "PRESENTE"}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                
                {/* Botón para ver reglas */}
                <button 
                  onClick={() => setShowRules(!showRules)}
                  className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                >
                  {showRules ? "Ocultar reglas" : "Ver reglas de documentos"}
                  {showRules ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
                
                {/* Reglas de documentos (solo cuando se expande) */}
                {showRules && (
                  <div className="mt-3 pt-3 border-t border-indigo-100">
                    <h5 className="font-semibold text-indigo-700 mb-2">
                      Reglas por parentesco:
                    </h5>
                    <ul className="list-disc pl-5 text-indigo-700 space-y-1 text-sm">
                      <li><strong>Esposo(a):</strong> Acta nacimiento, CURP, Acta matrimonio, No ISSSTE, INE</li>
                      <li><strong>Hijo(a):</strong>
                        <ul className="list-disc pl-5">
                          <li>Menor de 16 años: Acta nacimiento, CURP</li>
                          <li>Mayor de 16 años: + INE</li>
                          <li>Discapacitado: + Acta incapacidad</li>
                          <li>Estudiante: + Constancia estudios</li>
                        </ul>
                      </li>
                      <li><strong>Concubino(a):</strong> Acta nacimiento, CURP, Acta concubinato, No ISSSTE, INE</li>
                      <li><strong>Padre/Madre:</strong> Acta nacimiento, CURP, Acta dependencia económica, No ISSSTE, INE</li>
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Sección de alertas mejorada */}
              {alertas.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="text-red-500" />
                    <h4 className="font-semibold text-red-700">Acciones requeridas</h4>
                  </div>
                  
                  <ul className="space-y-2">
                    {alertas.map((alerta, index) => (
                      <li 
                        key={index} 
                        className="flex items-start gap-2 text-red-600"
                      >
                        <div className="mt-0.5 w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                        <span>{alerta}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Panel principal de documentos */}
            <div className="w-full md:w-3/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                  <FaDownload className="text-indigo-500" />
                  Documentos Requeridos
                </h3>
              </div>
              
              {/* Advertencia */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg flex items-start gap-3">
                <FaExclamationTriangle className="text-yellow-500 text-xl mt-0.5 flex-shrink-0" />
                <p className="text-yellow-800">
                  <strong>Nota:</strong> Los documentos requeridos varían según el parentesco y características del beneficiario
                </p>
              </div>
              
              {/* Documentos requeridos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {documentosRequeridos.map((doc, index) => {
                  const existeDocumento = beneficiary[doc.key];
                  const esRequerido = doc.requerido;
                  const esFaltante = esRequerido && !existeDocumento;
                  
                  // Verificar si es la vigencia y está expirada
                  const esVigenciaExpirada = doc.key === 'URL_VIGENCIA' && vigenciaExpirada;
                  
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${
                        esVigenciaExpirada 
                          ? "border-red-500 bg-red-50" 
                          : esFaltante
                            ? "border-red-500 bg-red-50 animate-pulse" 
                            : existeDocumento 
                              ? "border-green-500 bg-green-50" 
                              : "border-blue-500 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          {(() => {
                            switch(doc.key) {
                              case 'URL_ACTA_NAC': return <FaFileContract className="text-indigo-500 text-xl" />;
                              case 'URL_CURP': return <FaIdCard className="text-indigo-500 text-xl" />;
                              case 'URL_ACTAMATRIMONIO': return <FaRing className="text-indigo-500 text-xl" />;
                              case 'URL_CONCUBINATO': return <FaFileSignature className="text-indigo-500 text-xl" />;
                              case 'URL_NOISSTE': return <FaFileSignature className="text-indigo-500 text-xl" />;
                              case 'URL_INE': return <FaIdCard className="text-indigo-500 text-xl" />;
                              case 'URL_INCAP': return <FaFileMedical className="text-indigo-500 text-xl" />;
                              case 'URL_CONSTANCIA': return <FaUserGraduate className="text-indigo-500 text-xl" />;
                              case 'URL_VIGENCIA': return <FaCalendarTimes className="text-indigo-500 text-xl" />;
                              default: return <FaFileContract className="text-indigo-500 text-xl" />;
                            }
                          })()}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-800">{doc.label}</h4>
                          <div className={`text-sm font-medium mt-1 flex items-center gap-2 ${
                            esVigenciaExpirada 
                              ? "text-red-600" 
                              : esFaltante
                                ? "text-red-600" 
                                : existeDocumento 
                                  ? "text-green-600" 
                                  : "text-blue-600"
                          }`}>
                            {esVigenciaExpirada ? (
                              <><FaExclamationTriangle /> Vigencia expirada</>
                            ) : esFaltante ? (
                              <><FaExclamationTriangle /> Documento requerido</>
                            ) : existeDocumento ? (
                              <><FaCheck /> Documento disponible</>
                            ) : (
                              <><FaInfoCircle /> Documento opcional</>
                            )}
                          </div>
                          
                          {/* Mostrar fecha de vigencia si está disponible */}
                          {doc.key === 'URL_VIGENCIA' && beneficiary.FECHA_VIGENCIA && (
                            <div className={`mt-2 text-xs font-medium ${
                              vigenciaExpirada ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              Fecha de vigencia: {new Date(beneficiary.FECHA_VIGENCIA).toLocaleDateString()}
                              {vigenciaExpirada && (
                                <span className="ml-2 font-bold">(Expirada)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mensaje de documento faltante */}
                      {esFaltante && (
                        <div className="mt-3 flex items-center gap-2 text-red-600 font-bold">
                          <FaExclamationTriangle />
                          <span>DOCUMENTO OBLIGATORIO FALTANTE</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                  <FaFolderOpen className="text-indigo-500" />
                  Documentos Disponibles
                </h3>
                
                {docsList.some(d => beneficiary[d.key]) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docsList.map(d => {
                      const url = beneficiary[d.key];
                      if (!url) return null;
                      
                      // Verificar si es la vigencia y está expirada
                      const esVigenciaExpirada = d.key === 'URL_VIGENCIA' && vigenciaExpirada;
                      
                      return (
                        <motion.div 
                          key={d.key}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className={`bg-white rounded-xl shadow-md border overflow-hidden ${
                            esVigenciaExpirada 
                              ? "border-red-500 border-2" 
                              : "border-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                            <div className="bg-white rounded-lg w-10 h-10 flex items-center justify-center shadow-sm">
                              {d.icon}
                            </div>
                            <h4 className="font-semibold text-indigo-800">{d.label}</h4>
                            
                            {esVigenciaExpirada && (
                              <span className="ml-auto bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                                Expirada
                              </span>
                            )}
                          </div>
                          
                          <div className="p-4">
                            <div className="w-full h-40 bg-gray-100 rounded-lg border border-gray-200 shadow-inner flex items-center justify-center">
                              <FaFileContract className="text-indigo-300 text-4xl" />
                            </div>
                            
                            <div className="mt-4 flex justify-center">
                              <a 
                                href={url} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg flex items-center gap-2 hover:shadow-md transition-all"
                              >
                                <FaDownload /> Descargar
                              </a>
                            </div>
                            
                            {/* Mostrar fecha de vigencia si está disponible */}
                            {d.key === 'URL_VIGENCIA' && beneficiary.FECHA_VIGENCIA && (
                              <div className={`mt-3 text-center text-sm font-medium ${
                                vigenciaExpirada ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                Fecha de vigencia: {new Date(beneficiary.FECHA_VIGENCIA).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center border border-indigo-100">
                    <div className="bg-gradient-to-r from-indigo-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaFolderOpen className="text-white text-2xl" />
                    </div>
                    <h4 className="text-xl font-semibold text-indigo-800 mb-2">No hay documentos disponibles</h4>
                    <p className="text-indigo-600 mb-4">
                      No se encontraron documentos para este beneficiario
                    </p>
                    
                    {/* Mostrar documentos faltantes si existen */}
                    {documentosFaltantes.length > 0 && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                        <h5 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <FaExclamationTriangle className="text-red-500" />
                          Documentos obligatorios faltantes:
                        </h5>
                        <ul className="list-disc pl-5 text-red-600">
                          {documentosFaltantes.map((doc, index) => (
                            <li key={index}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}