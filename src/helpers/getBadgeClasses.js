import styles from "../pages/css/estilosActividad/DashboardActividad.module.css";

export function getBadgeClasses(action) {
  const normalized = action.toLowerCase().trim();

  switch (true) {
    /* ───── Sesión ───── */
    case normalized === "inicio de sesión":
      return styles.greenBadge;

    /* ───── Antecedentes ───── */
    case normalized === "guardó un antecedente":
      return styles.lavenderBadge;

    /* ───── Beneficiarios ───── */
    case normalized === "guardó un beneficiario":
      return styles.pinkBadge;
    case normalized === "editó un beneficiario":
      return styles.tealBadge;
    case normalized === "eliminó un beneficiario":
      return styles.darkRedBadge;

    /* ───── KPI ───── */
    case normalized === "calificó un kpi":
      return styles.cyanBadge;
    case normalized === "registró un kpi":
    case normalized === "agregó un nuevo kpi":
      return styles.pinkBadge;

    /* ───── Enfermedad crónica ───── */
    case normalized === "asignó enfermedad crónica":
    case normalized === "agregó una enfermedad crónica":
      return styles.brownBadge;

    /* ───── Especialidades / Pases ───── */
    case normalized === "agregó una especialidad":
    case normalized === "editó una especialidad":
    case normalized === "eliminó una especialidad":
    case normalized === "asignó especialidad":
    case normalized === "creó un nuevo pase de especialidad":
    case normalized === "capturó un pase de especialidad":
      return styles.purpleBadge;

    /* ───── Medicamentos ───── */
    case normalized === "creó un nuevo medicamento":
    case normalized === "editó un medicamento":
    case normalized === "eliminó un medicamento":
    case normalized === "asignó medicamentos":
      return styles.blueBadge;

    /* ───── Unidades de medida ───── */
    case normalized === "agregó una nueva unidad de medida":
      return styles.indigoBadge;

    /* ───── Recetas ───── */
    case normalized === "surtió una receta":
      return styles.surtirRecetaBadge;

    /* ───── Incapacidades ───── */
    case normalized === "asignó una incapacidad":
    case normalized === "capturó una incapacidad":
      return styles.redBadge;

    /* ───── Consultas ───── */
    case normalized === "atendió una consulta":
      return styles.yellowBadge;
    case normalized === "consulta de signos vitales guardada":
      return styles.orangeBadge;

    /* ───── Proveedores ───── */
    case normalized === "agregó un nuevo proveedor":
      return styles.greenBadge;
    case normalized === "editó un proveedor":
      return styles.tealBadge;
    case normalized === "eliminó un proveedor":
      return styles.darkRedBadge;

    /* ───── Orden de estudio de laboratorio ───── */
    case normalized === "capturó una orden de estudio de laboratorio":
      return styles.violetBadge;
    case normalized === "subió resultados de laboratorio":
      return styles.violetBadge;

    /* ───── Gastos ───── */
    case normalized === "capturó un gasto y factura":
      return styles.moneyBadge;

    /* ───── Cancelaciones ───── */
    case normalized === "canceló un pase":
    case normalized === "canceló una incapacidad":
    case normalized === "canceló una orden de laboratorio":
    case normalized === "canceló un surtimiento":
      return styles.cancelBadge;

    /* ───── NUEVAS ACCIONES (Avisos / Propuestas) ───── */
    case normalized === "subió un aviso":
      return styles.avisoBadge;
    case normalized === "subió una propuesta":
      return styles.propuestaBadge;
    case normalized === "dió like a una propuesta":
      return styles.likeBadge;

    /* ───── Fallback ───── */
    default:
      return styles.grayBadge;
  }
}
