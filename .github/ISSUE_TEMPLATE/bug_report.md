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
        Gracias por reportar un bug. Por favor, rellena la información.

  - type: input
    id: titulo_breve
    attributes:
      label: "Descripción breve del problema"
      placeholder: "El sistema se cierra al hacer X..."

  - type: textarea
    id: pasos_reproducir
    attributes:
      label: "Pasos para reproducir"
      description: "Describe los pasos para generar el error"
      placeholder: |
        1. ...
        2. ...
        3. ...

  - type: dropdown
    id: severidad
    attributes:
      label: "Severidad"
      options:
        - "Baja"
        - "Media"
        - "Alta"
