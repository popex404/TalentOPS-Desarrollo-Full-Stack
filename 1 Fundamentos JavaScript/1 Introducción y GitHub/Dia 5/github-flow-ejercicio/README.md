# Ejercicio Semana 1 Dia 5: Flujo de trabajo con GitHub Flow
Este ejercicio simula el proceso de colaboración en equipo utilizando **GitHub Flow**, creando una rama de funcionalidad, realizando commits descriptivos, y finalizando con un merge limpio a la rama principal.

## 1. Inicializar el repositorio
mkdir github-flow-ejercicio  
cd github-flow-ejercicio  
git init  

Crear Estructura Inicial:  
mkdir src tests  
echo '# Proyecto de práctica con GitHub Flow' > README.md  
echo '{"name": "github-flow-ejercicio", "version": "1.0.0"}' > package.json  
echo 'console.log("Inicio del proyecto de práctica")' > src/app.js  
git add .
git commit -m "feat: inicializar estructura base del proyecto"

## 2. Crear una rama de funcionalidad

git checkout -b feature/greeting  
echo '
// Módulo de saludo
function greet(name) {
  return `Hola, ${name}!`;
}

module.exports = { greet };
' > src/greet.js  
echo '
const { greet } = require("../src/greet");

test("greet function returns correct message", () => {
  expect(greet("Javier")).toBe("Hola, Javier!");
});
' > tests/greet.test.js  
git add src/greet.js  
git commit -m "feat: implementar función de saludo"  

git add tests/greet.test.js  
git commit -m "test: agregar pruebas para función de saludo"  

## 3. Simular flujo de colaboracion
Se sube la rama para la revisión  
Se crea un Pull Request  
Otro miembro del equipo revisa el codigo.  

git push origin feature/greeting  

## 4. Simular revision y mejora
Editar funcion y agregar validación  

echo '
// Módulo de saludo mejorado
function greet(name) {
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  return `Hola, ${name}!`;
}

module.exports = { greet };
' > src/greet.js  
git add src/greet.js  
git commit -m "fix: agregar validación de nombre en función de saludo"  

## 5. Fusionar cambios a main (GitHub Flow)
git checkout main  
git pull origin main  
git merge feature/greeting  

## 6. Limpiar ramas y etiquetar versión
git branch -d feature/greeting  
git push origina --delete feature/greeting  

git tag -a v1.0.1 -m "Release v1.0.1: Función de saludo básica"  
git push origin v.1.0.1

## 7. Ver historial limpio
git log --oneline --graph