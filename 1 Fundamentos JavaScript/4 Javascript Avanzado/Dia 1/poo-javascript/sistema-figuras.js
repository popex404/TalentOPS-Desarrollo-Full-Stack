// Sistema completo de figuras geométricas extendido

// PATRÓN 1: Factory Method para creación de figuras
class FiguraFactory {
  static crearFigura(tipo, ...parametros) {
    switch(tipo.toLowerCase()) {
      case 'circulo':
        return new Circulo(...parametros);
      case 'rectangulo':
        return new Rectangulo(...parametros);
      case 'triangulo':
        return new Triangulo(...parametros);
      case 'pentagono':
        return new Pentagono(...parametros);
      case 'hexagono':
        return new Hexagono(...parametros);
      case 'cubo':
        return new Cubo(...parametros);
      case 'esfera':
        return new Esfera(...parametros);
      default:
        throw new Error(`Tipo de figura no reconocido: ${tipo}`);
    }
  }
}

// PATRÓN 2: Visitor para operaciones sobre figuras
class FiguraVisitor {
  visitar(figura) {
    throw new Error('Método visitar debe ser implementado por la subclase');
  }
}

class SimilitudVisitor extends FiguraVisitor {
  constructor(figuraReferencia) {
    super();
    this.figuraReferencia = figuraReferencia;
    this.umbralSimilitud = 0.1; // 10% de tolerancia
  }

  visitar(figura) {
    const areaRef = this.figuraReferencia.calcularArea();
    const areaFig = figura.calcularArea();
    const perimetroRef = this.figuraReferencia.calcularPerimetro();
    const perimetroFig = figura.calcularPerimetro();

    const diffArea = Math.abs(areaRef - areaFig) / areaRef;
    const diffPerimetro = Math.abs(perimetroRef - perimetroFig) / perimetroRef;

    return diffArea <= this.umbralSimilitud && diffPerimetro <= this.umbralSimilitud;
  }
}

class DibujoVisitor extends FiguraVisitor {
  visitar(figura) {
    return figura.dibujarASCII();
  }
}

// Clase base abstracta
class FiguraGeometrica {
  constructor(nombre) {
    this.nombre = nombre;
    this.#id = Math.random().toString(36).substr(2, 9);
  }

  // Propiedad privada
  #id;

  // Método abstracto (debe ser implementado por subclases)
  calcularArea() {
    throw new Error('Método calcularArea debe ser implementado por la subclase');
  }

  calcularPerimetro() {
    throw new Error('Método calcularPerimetro debe ser implementado por la subclase');
  }

  // Método común
  describir() {
    return `${this.nombre} - Área: ${this.calcularArea().toFixed(2)}, Perímetro: ${this.calcularPerimetro().toFixed(2)}`;
  }

  // Getter para ID
  get id() {
    return this.#id;
  }

  // Método para aceptar visitors
  aceptar(visitor) {
    return visitor.visitar(this);
  }

  // Método para dibujar (será sobrescrito)
  dibujarASCII() {
    return `[${this.nombre}]`;
  }

  // Método estático
  static crearDesdeJSON(jsonString) {
    const data = JSON.parse(jsonString);
    return FiguraFactory.crearFigura(data.tipo, ...data.parametros);
  }
}

// PATRÓN 3: Composite para figuras 3D
class Figura3D extends FiguraGeometrica {
  constructor(nombre) {
    super(nombre);
  }

  calcularVolumen() {
    throw new Error('Método calcularVolumen debe ser implementado por la subclase');
  }

  describir() {
    return `${super.describir()}, Volumen: ${this.calcularVolumen().toFixed(2)}`;
  }
}

// Clase Círculo
class Circulo extends FiguraGeometrica {
  constructor(radio) {
    super('Círculo');
    this.#validarParametro(radio, 'radio');
    this.radio = radio;
  }

  #validarParametro(valor, nombre) {
    if (valor <= 0) {
      throw new Error(`${nombre} debe ser mayor que 0`);
    }
    if (typeof valor !== 'number') {
      throw new Error(`${nombre} debe ser un número`);
    }
  }

  calcularArea() {
    return Math.PI * this.radio * this.radio;
  }

  calcularPerimetro() {
    return 2 * Math.PI * this.radio;
  }

  // Método específico
  calcularDiametro() {
    return this.radio * 2;
  }

  dibujarASCII() {
    const radio = Math.min(this.radio, 5); // Limitar tamaño para visualización
    let dibujo = '';
    
    for (let y = -radio; y <= radio; y++) {
      let linea = '';
      for (let x = -radio; x <= radio; x++) {
        const distancia = Math.sqrt(x * x + y * y);
        if (Math.abs(distancia - radio) < 0.5) {
          linea += '●';
        } else {
          linea += ' ';
        }
      }
      dibujo += linea + '\n';
    }
    return dibujo;
  }
}

// Clase Rectángulo
class Rectangulo extends FiguraGeometrica {
  constructor(ancho, alto) {
    super('Rectángulo');
    this.#validarParametros(ancho, alto);
    this.ancho = ancho;
    this.altura = alto;
  }

  #validarParametros(ancho, alto) {
    [ancho, alto].forEach((param, index) => {
      if (param <= 0) {
        throw new Error(`Parámetro ${index === 0 ? 'ancho' : 'alto'} debe ser mayor que 0`);
      }
      if (typeof param !== 'number') {
        throw new Error(`Parámetro ${index === 0 ? 'ancho' : 'alto'} debe ser un número`);
      }
    });
  }

  calcularArea() {
    return this.ancho * this.altura;
  }

  calcularPerimetro() {
    return 2 * (this.ancho + this.altura);
  }

  // Método específico
  esCuadrado() {
    return this.ancho === this.altura;
  }

  dibujarASCII() {
    const ancho = Math.min(this.ancho, 10);
    const alto = Math.min(this.altura, 5);
    let dibujo = '';
    
    for (let y = 0; y < alto; y++) {
      let linea = '';
      for (let x = 0; x < ancho; x++) {
        if (y === 0 || y === alto - 1 || x === 0 || x === ancho - 1) {
          linea += '■';
        } else {
          linea += ' ';
        }
      }
      dibujo += linea + '\n';
    }
    return dibujo;
  }
}

// Clase Triángulo
class Triangulo extends FiguraGeometrica {
  constructor(base, altura) {
    super('Triángulo');
    this.#validarParametros(base, altura);
    this.base = base;
    this.altura = altura;
  }

  #validarParametros(base, altura) {
    [base, altura].forEach((param, index) => {
      if (param <= 0) {
        throw new Error(`Parámetro ${index === 0 ? 'base' : 'altura'} debe ser mayor que 0`);
      }
      if (typeof param !== 'number') {
        throw new Error(`Parámetro ${index === 0 ? 'base' : 'altura'} debe ser un número`);
      }
    });
  }

  calcularArea() {
    return (this.base * this.altura) / 2;
  }

  calcularPerimetro() {
    // Para simplificar, asumimos triángulo equilátero
    return 3 * this.base;
  }

  // Método específico
  calcularHipotenusa() {
    // Para triángulo rectángulo isósceles
    return Math.sqrt(this.base * this.base + this.altura * this.altura);
  }

  dibujarASCII() {
    const altura = Math.min(this.altura, 6);
    let dibujo = '';
    
    for (let i = 1; i <= altura; i++) {
      const espacios = altura - i;
      const caracteres = 2 * i - 1;
      dibujo += ' '.repeat(espacios) + '▲'.repeat(caracteres) + '\n';
    }
    return dibujo;
  }
}

// NUEVA FIGURA: Pentágono
class Pentagono extends FiguraGeometrica {
  constructor(lado) {
    super('Pentágono');
    this.#validarParametro(lado, 'lado');
    this.lado = lado;
  }

  #validarParametro(valor, nombre) {
    if (valor <= 0) {
      throw new Error(`${nombre} debe ser mayor que 0`);
    }
    if (typeof valor !== 'number') {
      throw new Error(`${nombre} debe ser un número`);
    }
  }

  calcularArea() {
    // Fórmula para área de pentágono regular
    return (5 * this.lado * this.lado) / (4 * Math.tan(Math.PI / 5));
  }

  calcularPerimetro() {
    return 5 * this.lado;
  }
 dibujarASCII() {
    let dibujo = '';
    
    // Pentágono regular representado con caracteres
    const lineas = [
      '   ▲   ',
      '  ╱ ╲  ',
      ' ╱   ╲ ',
      '╱     ╲',
      '╲     ╱',
      ' ╲___╱ '
    ];
    
    lineas.forEach(linea => {
      dibujo += linea + '\n';
    });
    
    return dibujo;
  }
}

// NUEVA FIGURA: Hexágono
class Hexagono extends FiguraGeometrica {
  constructor(lado) {
    super('Hexágono');
    this.#validarParametro(lado, 'lado');
    this.lado = lado;
  }

  #validarParametro(valor, nombre) {
    if (valor <= 0) {
      throw new Error(`${nombre} debe ser mayor que 0`);
    }
    if (typeof valor !== 'number') {
      throw new Error(`${nombre} debe ser un número`);
    }
  }

  calcularArea() {
    // Fórmula para área de hexágono regular
    return (3 * Math.sqrt(3) * this.lado * this.lado) / 2;
  }

  calcularPerimetro() {
    return 6 * this.lado;
  }

  dibujarASCII() {
    const tamaño = Math.min(this.lado, 3);
    let dibujo = '';
    
    // Representación simple de hexágono
    const lineas = [
      ' ___ ',
      '/   \\',
      '\\___/'
    ];
    
    lineas.forEach(linea => {
      dibujo += ' '.repeat(tamaño) + linea + '\n';
    });
    
    return dibujo;
  }
}

// NUEVA FIGURA 3D: Cubo
class Cubo extends Figura3D {
  constructor(lado) {
    super('Cubo');
    this.#validarParametro(lado, 'lado');
    this.lado = lado;
  }

  #validarParametro(valor, nombre) {
    if (valor <= 0) {
      throw new Error(`${nombre} debe ser mayor que 0`);
    }
    if (typeof valor !== 'number') {
      throw new Error(`${nombre} debe ser un número`);
    }
  }

  calcularArea() {
    return 6 * this.lado * this.lado;
  }

  calcularPerimetro() {
    return 12 * this.lado;
  }

  calcularVolumen() {
    return this.lado * this.lado * this.lado;
  }

  dibujarASCII() {
    let dibujo = '';
    
    // Representación simple de cubo en 2D
    const lineas = [
      '  +------+',
      ' /      /|',
      '+------+ |',
      '|      | +',
      '|      |/',
      '+------+'
    ];
    
    lineas.forEach(linea => {
      dibujo += linea + '\n';
    });
    
    return dibujo;
  }
}

// NUEVA FIGURA 3D: Esfera
class Esfera extends Figura3D {
  constructor(radio) {
    super('Esfera');
    this.#validarParametro(radio, 'radio');
    this.radio = radio;
  }

  #validarParametro(valor, nombre) {
    if (valor <= 0) {
      throw new Error(`${nombre} debe ser mayor que 0`);
    }
    if (typeof valor !== 'number') {
      throw new Error(`${nombre} debe ser un número`);
    }
  }

  calcularArea() {
    return 4 * Math.PI * this.radio * this.radio;
  }

  calcularPerimetro() {
    return 2 * Math.PI * this.radio;
  }

  calcularVolumen() {
    return (4 / 3) * Math.PI * this.radio * this.radio * this.radio;
  }

  dibujarASCII() {
    const radio = Math.min(this.radio, 3);
    let dibujo = '';
    
    for (let y = -radio; y <= radio; y++) {
      let linea = '';
      for (let x = -radio; x <= radio; x++) {
        const distancia = Math.sqrt(x * x + y * y);
        if (Math.abs(distancia - radio) < 0.7) {
          linea += '○';
        } else {
          linea += ' ';
        }
      }
      dibujo += linea + '\n';
    }
    return dibujo;
  }
}

// Clase para gestionar colección de figuras (extendida)
class ColeccionFiguras {
  constructor() {
    this.figuras = [];
  }

  agregar(figura) {
    if (figura instanceof FiguraGeometrica) {
      this.figuras.push(figura);
      return true;
    }
    return false;
  }

  // Método que demuestra polimorfismo
  listarFiguras() {
    console.log('=== COLECCIÓN DE FIGURAS ===');
    this.figuras.forEach((figura, index) => {
      console.log(`${index + 1}. ${figura.describir()}`);
    });
  }

  // Métodos que usan polimorfismo
  calcularAreaTotal() {
    return this.figuras.reduce((total, figura) => total + figura.calcularArea(), 0);
  }

  calcularPerimetroTotal() {
    return this.figuras.reduce((total, figura) => total + figura.calcularPerimetro(), 0);
  }

  calcularVolumenTotal() {
    return this.figuras.reduce((total, figura) => {
      return total + (figura.calcularVolumen ? figura.calcularVolumen() : 0);
    }, 0);
  }

  // Método que filtra por tipo (usando polimorfismo)
  filtrarPorTipo(tipo) {
    return this.figuras.filter(figura => figura.nombre === tipo);
  }

  // Nuevo método: encontrar figuras similares
  encontrarSimilares(figuraReferencia) {
    const visitor = new SimilitudVisitor(figuraReferencia);
    return this.figuras.filter(figura => 
      figura !== figuraReferencia && figura.aceptar(visitor)
    );
  }

  // Nuevo método: dibujar todas las figuras
  dibujarTodas() {
    const visitor = new DibujoVisitor();
    this.figuras.forEach((figura, index) => {
      console.log(`\n${index + 1}. ${figura.nombre}:`);
      console.log(figura.aceptar(visitor));
    });
  }

  // Método estático
  static compararAreas(figura1, figura2) {
    const area1 = figura1.calcularArea();
    const area2 = figura2.calcularArea();

    if (area1 > area2) {
      return `${figura1.nombre} es más grande que ${figura2.nombre}`;
    } else if (area1 < area2) {
      return `${figura2.nombre} es más grande que ${figura1.nombre}`;
    } else {
      return `Ambas figuras tienen la misma área`;
    }
  }
}

// DEMOSTRACIÓN COMPLETA DEL SISTEMA EXTENDIDO
console.log('SISTEMA DE FIGURAS GEOMÉTRICAS EXTENDIDO\n');

try {
  // Crear figuras usando Factory Method
  console.log('=== CREACIÓN CON FACTORY METHOD ===');
  const circulo = FiguraFactory.crearFigura('circulo', 5);
  const pentagono = FiguraFactory.crearFigura('pentagono', 4);
  const hexagono = FiguraFactory.crearFigura('hexagono', 3);
  const cubo = FiguraFactory.crearFigura('cubo', 2);
  const esfera = FiguraFactory.crearFigura('esfera', 3);

  // Crear colección
  const coleccion = new ColeccionFiguras();

  // Agregar figuras
  coleccion.agregar(circulo);
  coleccion.agregar(pentagono);
  coleccion.agregar(hexagono);
  coleccion.agregar(cubo);
  coleccion.agregar(esfera);

  // Listar todas las figuras
  coleccion.listarFiguras();

  // Calcular totales
  console.log(`\n Área total: ${coleccion.calcularAreaTotal().toFixed(2)}`);
  console.log(`Perímetro total: ${coleccion.calcularPerimetroTotal().toFixed(2)}`);
  console.log(`Volumen total: ${coleccion.calcularVolumenTotal().toFixed(2)}`);

  // Demostrar similitud entre figuras
  console.log('\n=== COMPARACIÓN DE SIMILITUD ===');
  const circuloSimilar = FiguraFactory.crearFigura('circulo', 5.1); // Muy similar al círculo original
  coleccion.agregar(circuloSimilar);
  
  const similares = coleccion.encontrarSimilares(circulo);
  console.log(`Figuras similares al círculo: ${similares.length}`);

  // Demostrar dibujo ASCII
  console.log('\n=== DIBUJO ASCII DE FIGURAS ===');
  coleccion.dibujarTodas();

  // Demostrar validación de parámetros
  console.log('\n=== VALIDACIÓN DE PARÁMETROS ===');
  try {
    const circuloInvalido = FiguraFactory.crearFigura('circulo', -5);
  } catch (error) {
    console.log(`Validación funcionando: ${error.message}`);
  }

  // Demostrar serialización
  console.log('\n=== SERIALIZACIÓN ===');
  const figuraJSON = JSON.stringify({
    tipo: 'hexagono',
    parametros: [4]
  });

  const figuraDesdeJSON = FiguraGeometrica.crearDesdeJSON(figuraJSON);
  console.log(`Figura creada desde JSON: ${figuraDesdeJSON.describir()}`);

  // Comparar áreas
  console.log(`\n  ${ColeccionFiguras.compararAreas(cubo, esfera)}`);

  // Métodos específicos de nuevas figuras
  console.log(`\n FUNCIONES ESPECÍFICAS DE NUEVAS FIGURAS:`);
  console.log(`Volumen del cubo: ${cubo.calcularVolumen().toFixed(2)}`);
  console.log(`Volumen de la esfera: ${esfera.calcularVolumen().toFixed(2)}`);
  console.log(`Área del pentágono: ${pentagono.calcularArea().toFixed(2)}`);
  console.log(`Área del hexágono: ${hexagono.calcularArea().toFixed(2)}`);

  console.log('\n Sistema POO extendido implementado exitosamente!');

} catch (error) {
  console.error('Error:', error.message);
}