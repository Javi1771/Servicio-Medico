---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: ''
assignees: ''

---

name: "Feature Request"
description: "Proponer una nueva funcionalidad o mejora"
title: "[Feature]"
labels:
  - enhancement

body:
  - type: markdown
    attributes:
      value: |
        ¡Gracias por proponer una nueva característica!  
        Por favor, describe los detalles de tu idea y el valor que aporta al proyecto.

  - type: input
    id: titulo_breve
    attributes:
      label: "Título breve de tu propuesta"
      placeholder: "Ejemplo: Añadir reportes de estadísticas..."

  - type: textarea
    id: descripcion_detallada
    attributes:
      label: "Descripción detallada"
      description: "Explica qué problema resuelve o qué beneficio aporta la nueva funcionalidad"
      placeholder: "Sería útil para..."

  - type: input
    id: prioridad
    attributes:
      label: "Prioridad (Alta/Media/Baja)"
      placeholder: "Por ejemplo: Alta"

  - type: textarea
    id: notas_adicionales
    attributes:
      label: "Notas adicionales"
      description: "Incluye mockups, referencias u otras ideas si aplica"
      placeholder: "Ejemplo: Pantallas de ejemplo, enlaces a documentación, etc."
