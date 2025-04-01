---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

name: "Bug Report"
description: "Completa este formulario para reportar un bug"
title: "[BUG]"
labels:
  - bug

body:
  - type: markdown
    attributes:
      value: |
        ¡Gracias por reportar un bug!  
        Por favor, rellena la información a continuación para ayudarnos a resolverlo.

  - type: input
    id: titulo_breve
    attributes:
      label: "Descripción breve del problema"
      placeholder: "Ejemplo: El sistema se cierra al hacer clic en X..."

  - type: textarea
    id: pasos_reproducir
    attributes:
      label: "Pasos para reproducir"
      description: "Describe los pasos necesarios para que ocurra el error"
      placeholder: |
        1. ...
        2. ...
        3. ...

  - type: textarea
    id: comportamiento_esperado
    attributes:
      label: "Comportamiento esperado"
      description: "¿Qué esperabas que sucediera en lugar del error?"
      placeholder: "El sistema debía..."

  - type: textarea
    id: evidencia_o_logs
    attributes:
      label: "Evidencia / Logs"
      description: "Si es posible, adjunta capturas de pantalla o logs relevantes"
      placeholder: "Adjunta links o pegas logs aquí"
