// src/utils/userColorsMap.js

// Diccionario global: [usuario => colorHex]
const userColors = {};

/**
 * Retorna siempre el mismo color aleatorio para cada usuario.
 */
export function getRandomColorForUser(username) {
  const key = (username || "desconocido").toLowerCase().trim();

  if (userColors[key]) {
    // Ya existe color asignado, regrésalo
    return userColors[key];
  }

  // Genera un color aleatorio en formato hex (#RRGGBB)
  const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);

  // Almacena el color en el diccionario
  userColors[key] = randomColor;

  return randomColor;
}
