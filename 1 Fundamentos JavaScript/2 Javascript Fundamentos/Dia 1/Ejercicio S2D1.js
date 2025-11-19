console.log("=== Diferencias Entre var, let y const ===\n");

console.log("=== Ámbito Globlal ===");

var globalVar = "soy var global";
let globalLet = "soy let global";
const globalConst = "soy const global";

console.log(globalVar);
console.log(globalLet);
console.log(globalConst);

console.log("\n=== Ámbito de Función ===");

function ejemploFuncion() {
    var funcionVar = "var dentro de función";
    let funcionLet = "let dentro de función";
    const funcionConst = "const dentro de función";

    console.log(funcionVar);
    console.log(funcionLet);
    console.log(funcionConst);
}

ejemploFuncion();

// No se pueden acceder fuera de la funcion
// Da eror
console.log(funcionVar);
console.log(funcionLet);
console.log(funcionConst);

console.log("\n=== Ámbito de Bloque ====");

if (true) {
    var bloqueVar = "var ignora el bloque";
    let bloqueLet = "let respeta el bloque";
    const bloqueConst = "const respeta el bloque";
}

console.log(bloqueVar); // var escapa del bloque
// let y const no salen del bloque
console.log(bloqueLet);
console.log(bloqueConst);

console.log("\n=== Hoisting ===");    

// var es hoisted y se inicializa como undefined
console.log(hoistVar); // undefined
var hoistVar = "var hoisting";

// let y const son hoisted pero entran en Temporal Dead Zone

try {
    console.log(hoistLet); // Reference Error
} catch (e) {
    console.log("Error hoistLet:", e.message);
}

let hoistLet = "let hoisting";

//const tambien tiene Temporal dead Zone

try {
    console.log(hoistConst); // Reference Error
} catch (e) {
    console.log("Error hoistConst:", e.message);
}

const hoistConst = "const hoisting";

console.log("\n=== Temporal Dead Zone (TDZ) ===");

function demoTDZ() {
    // TDZ ocurre desde el inicio del bloque hasta la linea donde se declara la variable
    
    try {
        console.log(milet); // ReferenceError
    } catch (e) {
        console.log("TDZ milet:", e.message);
    }

    let milet = "Ahora ya existe milet";

    console.log(milet);
}

demoTDZ();

console.log("\n=== Modificación de let y const ===");

let contador =1;
contador++;
console.log("contador:", contador);

const usuario = {
    nombre: "Javier"
};
// const no permite reasignar, pero si modificar propiedades
usuario.nombre = "Javi";
console.log("usuario:", usuario);

// Esto falla
usuario = {}; 