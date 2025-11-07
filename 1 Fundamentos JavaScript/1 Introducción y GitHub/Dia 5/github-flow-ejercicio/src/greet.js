
// Módulo de saludo mejorado
function greet(name) {
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  return `Hola, ${name}!`;
}

module.exports = { greet };

