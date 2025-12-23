class Calculadora {
  constructor() {
    this.operaciones = [];
  }

  sumar(a, b) {
    const resultado = a + b;
    this.registrarOperacion('suma', a, b, resultado);
    return resultado;
  }

  restar(a, b) {
    const resultado = a - b;
    this.registrarOperacion('resta', a, b, resultado);
    return resultado;
  }

  multiplicar(a, b) {
    const resultado = a * b;
    this.registrarOperacion('multiplicación', a, b, resultado);
    return resultado;
  }

  dividir(a, b) {
    if (b === 0) {
      throw new Error('No se puede dividir por cero');
    }
    const resultado = a / b;
    this.registrarOperacion('división', a, b, resultado);
    return resultado;
  }

  registrarOperacion(tipo, a, b, resultado) {
    this.operaciones.push({
      tipo,
      operandos: [a, b],
      resultado,
      timestamp: new Date()
    });
  }

  obtenerHistorial() {
    return this.operaciones.map(op => ({
      operacion: `${op.operandos[0]} ${this.obtenerSimbolo(op.tipo)} ${op.operandos[1]} = ${op.resultado}`,
      fecha: op.timestamp.toLocaleString()
    }));
  }

  obtenerSimbolo(tipo) {
    const simbolos = {
      suma: '+',
      resta: '-',
      multiplicación: '×',
      división: '÷'
    };
    return simbolos[tipo] || '?';
  }

  obtenerEstadisticas() {
    const total = this.operaciones.length;
    const tipos = this.operaciones.reduce((acc, op) => {
      acc[op.tipo] = (acc[op.tipo] || 0) + 1;
      return acc;
    }, {});

    return { total, tipos };
  }
}

// Procesar argumentos de línea de comandos
function procesarArgumentos() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    mostrarAyuda();
    return;
  }

  const comando = args[0].toLowerCase();
  
  if (comando === 'historial') {
    mostrarHistorial();
    return;
  }

  if (comando === 'estadisticas') {
    mostrarEstadisticas();
    return;
  }

  if (comando === 'info') {
    mostrarInfoSistema();
    return;
  }

  if (comando === 'ayuda' || comando === '--help' || comando === '-h') {
    mostrarAyuda();
    return;
  }

  // Verificar si es una operación matemática
  if (args.length < 3) {
    console.error('Error: Se necesitan al menos 3 argumentos: operación num1 num2');
    console.error('Ejemplo: node calculadora.js sumar 5 3');
    return;
  }

  const a = parseFloat(args[1]);
  const b = parseFloat(args[2]);

  if (isNaN(a) || isNaN(b)) {
    console.error('Error: Los operandos deben ser números válidos');
    return;
  }

  const calc = new Calculadora();
  let resultado;

  try {
    switch (comando) {
      case 'sumar':
        resultado = calc.sumar(a, b);
        break;
      case 'restar':
        resultado = calc.restar(a, b);
        break;
      case 'multiplicar':
        resultado = calc.multiplicar(a, b);
        break;
      case 'dividir':
        resultado = calc.dividir(a, b);
        break;
      default:
        console.error(`Error: Operación no válida '${comando}'`);
        console.error('Operaciones válidas: sumar, restar, multiplicar, dividir');
        return;
    }

    console.log(`${a} ${calc.obtenerSimbolo(comando === 'multiplicar' ? 'multiplicación' : comando === 'dividir' ? 'división' : comando)} ${b} = ${resultado}`);
    
    // Si hay más argumentos, procesar operaciones encadenadas
    if (args.length > 3) {
      procesarOperacionesEncadenadas(calc, resultado, args.slice(3));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

function procesarOperacionesEncadenadas(calc, valorActual, argsRestantes) {
  if (argsRestantes.length < 2) return;

  for (let i = 0; i < argsRestantes.length; i += 2) {
    const operacion = argsRestantes[i];
    const b = parseFloat(argsRestantes[i + 1]);

    if (isNaN(b)) {
      console.error(`Error: Operando no válido '${argsRestantes[i + 1]}'`);
      return;
    }

    try {
      switch (operacion) {
        case 'sumar':
          valorActual = calc.sumar(valorActual, b);
          break;
        case 'restar':
          valorActual = calc.restar(valorActual, b);
          break;
        case 'multiplicar':
          valorActual = calc.multiplicar(valorActual, b);
          break;
        case 'dividir':
          valorActual = calc.dividir(valorActual, b);
          break;
        default:
          console.error(`Error: Operación no válida '${operacion}'`);
          return;
      }

      console.log(`→ ${calc.obtenerSimbolo(operacion === 'multiplicar' ? 'multiplicación' : operacion === 'dividir' ? 'división' : operacion)} ${b} = ${valorActual}`);
    } catch (error) {
      console.error('Error:', error.message);
      return;
    }
  }
}

function mostrarHistorial() {
  const calc = new Calculadora();
  // Nota: En una aplicación real, el historial se guardaría persistentemente
  console.log('=== HISTORIAL DE OPERACIONES ===');
  console.log('(Nota: El historial se reinicia cada vez que se ejecuta el programa)');
  const historial = calc.obtenerHistorial();
  if (historial.length === 0) {
    console.log('No hay operaciones registradas.');
  } else {
    historial.forEach((op, index) => {
      console.log(`${index + 1}. ${op.operacion} (${op.fecha})`);
    });
  }
}

function mostrarEstadisticas() {
  const calc = new Calculadora();
  console.log('\n=== ESTADÍSTICAS ===');
  const stats = calc.obtenerEstadisticas();
  console.log(`Total de operaciones: ${stats.total}`);
  console.log('Operaciones por tipo:', stats.tipos);
}

function mostrarInfoSistema() {
  console.log('\n=== INFORMACIÓN DEL SISTEMA ===');
  console.log('Node.js versión:', process.version);
  console.log('Plataforma:', process.platform);
  console.log('Arquitectura:', process.arch);
  console.log('Directorio actual:', process.cwd());
  console.log('Uptime de Node:', Math.round(process.uptime()), 'segundos');
}

function mostrarAyuda() {
  console.log(`
=== CALCULADORA DE LÍNEA DE COMANDOS ===

USO:
  node calculadora.js <operación> <num1> <num2> [operación num3 ...]

EJEMPLOS:
  node calculadora.js sumar 5 3
  node calculadora.js restar 10 4
  node calculadora.js multiplicar 5 6
  node calculadora.js dividir 15 3
  
  # Operaciones encadenadas:
  node calculadora.js sumar 5 3 restar 2 multiplicar 4

COMANDOS ESPECIALES:
  node calculadora.js historial     # Muestra el historial de operaciones
  node calculadora.js estadisticas  # Muestra estadísticas de uso
  node calculadora.js info          # Muestra información del sistema
  node calculadora.js ayuda         # Muestra este mensaje de ayuda

OPERACIONES DISPONIBLES:
  - sumar
  - restar
  - multiplicar
  - dividir
  `);
}

// Iniciar la aplicación
procesarArgumentos();