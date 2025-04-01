---
name: Custom issue template
about: Describe this issue template's purpose here.
title: ''
labels: ''
assignees: ''

---

name: "User Story"
description: "Crear una nueva historia de usuario siguiendo un formato ágil"
title: "[User Story]"
labels:
  - user story

body:
  - type: markdown
    attributes:
      value: |
        Por favor, describe la historia de usuario con el siguiente formato:  
        **"Como [rol], quiero [acción], para [beneficio]."**

  - type: input
    id: user_story_formato
    attributes:
      label: "Historia de Usuario (Formato)"
      placeholder: "Ej: Como administrador, quiero crear usuarios, para asignarles permisos."

  - type: textarea
    id: criterios_aceptacion
    attributes:
      label: "Criterios de Aceptación"
      description: "Condiciones para considerar esta historia terminada"
      placeholder: |
        - El sistema debe...
        - Debe validarse que...
        - Mostrar un mensaje de confirmación...

  - type: textarea
    id: notas_tecnicas
    attributes:
      label: "Notas Técnicas / Dependencias"
      description: "Si hay consideraciones de implementación o dependencias"
      placeholder: "Se requiere la librería X, endpoint Y..."

  - type: textarea
    id: definition_of_done
    attributes:
      label: "Definition of Done (DoD)"
      description: "Requisitos mínimos para dar por finalizada la historia"
      placeholder: |
        - Code review completado
        - Pruebas unitarias pasadas
        - Documentación actualizada
