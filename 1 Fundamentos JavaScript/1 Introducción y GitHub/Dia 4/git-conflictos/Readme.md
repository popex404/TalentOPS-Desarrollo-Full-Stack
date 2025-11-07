# Ejercicio: Resolución de conflictos en Git

Este ejercicio tiene como objetivo practicar cómo manejar conflictos en Git de tres maneras distintas:
1. Manteniendo una de las versiones.
2. Manteniendo la otra versión.
3. Combinando ambas versiones.

## 1. Configurar repositorio de práctica

mkdir git-conflictos  
cd git-conflictos  
echo "Archivo base" > archivo.txt  
git add archivo.txt  
git commit -m "Repositorio inicial con archivo base"  

## 2. Crear la primera rama y hacer una modificación

git checkout -b m1s1d4/feature/version-A  
echo "Esta es la versión A del archivo" > archivo.txt  
git add archivo.txt  
git commit -m "agregar contenido versión A"  

## 3. Volver a la rama main y crear una segunda rama
git checkout main  
git checkout -b m1s1d4/feature/version-B  
echo "Esta es la version B del archivo." > archivo.txt  
git add archivo.txt  
git commit -m "Agregar contenido archivo B"  

## 4. Fusionar la primera rama con la rama principal
git checkout main  
git merge m1s1d4/feature/version-A  

## 5. Fusionar la segunda rama con la principal (Conflicto)
git merge m1s1d4/feature/version-B  
git status  

## 6. Resolver el conflicto 

### a. Mantener la versión A (dropear B)
Editar archivo.txt eliminando "Esta es la version B del archivo."  
git add archivo.txt  
git commit -m "Resolver conflicto manteniendo versión A"  

### b. Mantener la versión B (dropear A)
Editar archivo.txt eliminando "Esta es la version A del archivo."  
git add archivo.txt  
git commit -m "Resolver conflicto manteniendo versión B"  

### c. Combinar ambas versiones
Editar archivo.txt para incluir ambas lineas  
Esta es la versión A del archivo.  
Esta es la versión B del archivo.  

git add archivo.txt  
git commit -m "fix: resolver conflicto combinando versiones A y B"  

## 7. Limpiar ramas y revisar historial
git branch -d m1s1d4/feature/version-A  
git branch -d m1s1d4/feature/version-B  
git log --oneline --graph  
