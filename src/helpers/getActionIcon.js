import React from "react";
import {
  FaSignInAlt,
  FaStethoscope,
  FaHeartbeat,
  FaUserInjured,
  FaMedkit,
  FaUserMd,
  FaProcedures,
  FaQuestion,
  FaChartLine,
  FaStarHalfAlt,
  FaBookMedical,
  FaUserCheck,
  FaUserEdit,
  FaUserMinus,
  FaPlus,
  FaPrescriptionBottle,
  FaBalanceScale,
  FaVial,
  FaFileInvoiceDollar // <--- Icono para "capturó un gasto y factura"
} from "react-icons/fa";

export function getActionIcon(action) {
  const normalized = action.toLowerCase().trim();

  switch (true) {
    //? Sesión
    case normalized === "inicio de sesión":
      return <FaSignInAlt />;

    //? Antecedentes
    case normalized === "guardó un antecedente":
      return <FaBookMedical />;

    //? Beneficiarios
    case normalized === "guardó un beneficiario":
      return <FaUserCheck />;
    case normalized === "editó un beneficiario":
      return <FaUserEdit />;
    case normalized === "eliminó un beneficiario":
      return <FaUserMinus />;

    //? KPI
    case normalized === "calificó un kpi":
      return <FaStarHalfAlt />;
    case normalized === "registró un kpi":
    case normalized === "agregó un nuevo kpi":
      return <FaChartLine />;

    //? Enfermedad crónica
    case normalized === "asignó enfermedad crónica":
    case normalized === "agregó una enfermedad crónica":
      return <FaProcedures />;

    //? Especialidad y pases
    case normalized === "agregó una especialidad":
    case normalized === "editó una especialidad":
    case normalized === "eliminó una especialidad":
    case normalized === "asignó especialidad":
    case normalized === "creó un nuevo pase de especialidad":
    case normalized === "capturó un pase de especialidad":
      return <FaUserMd />;

    //? Medicamentos
    case normalized === "creó un nuevo medicamento":
    case normalized === "editó un medicamento":
    case normalized === "eliminó un medicamento":
      return <FaMedkit />;

    //? Unidades de medida
    case normalized === "agregó una nueva unidad de medida":
      return <FaBalanceScale />;

    //? Surtimientos / recetas
    case normalized === "surtió una receta":
      return <FaPrescriptionBottle />;

    //? Incapacidades
    case normalized === "asignó una incapacidad":
    case normalized === "capturó una incapacidad":
      return <FaUserInjured />;

    //? Consulta / Signos vitales
    case normalized === "atendió una consulta":
      return <FaStethoscope />;
    case normalized === "consulta de signos vitales guardada":
      return <FaHeartbeat />;

    //? Proveedores
    case normalized === "agregó un nuevo proveedor":
      return <FaPlus />;
    case normalized === "editó un proveedor":
      return <FaUserEdit />;
    case normalized === "eliminó un proveedor":
      return <FaUserMinus />;

    //? Asignar medicamentos
    case normalized === "asignó medicamentos":
      return <FaMedkit />;

    //? Orden de estudio de laboratorio
    case normalized === "capturó una orden de estudio de laboratorio":
      return <FaVial />;

    //? Gastos
    case normalized === "capturó un gasto y factura":
      return <FaFileInvoiceDollar />;

    default:
      //! Por si no coincide con ninguna de las anteriores
      return <FaQuestion />;
  }
}
