
// Calculadora mejorada
function add(a, b) {
    if (typeof a !== "number" || typeof b !== "number") {
        throw new Error("Both arguments must be numbers");
    }
    return a + b;
}

function multiply(a, b) {
    if (typeof a !== "number" || typeof b !== "number") {
        throw new Error("Both arguments must be numbers");
    }
    return a * b;
}

function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
}

module.exports = { add, multiply, divide };

