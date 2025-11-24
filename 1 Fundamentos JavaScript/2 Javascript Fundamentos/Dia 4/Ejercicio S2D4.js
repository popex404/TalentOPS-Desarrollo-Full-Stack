console.log("=== SISTEMA DE BIBLIOTECA EXTENDIDO ===\n");

// Base de datos de libros
const libros = [
  { id: 1, titulo: "JavaScript: The Good Parts", autor: "Douglas Crockford", genero: "Programación", disponible: true, popularidad: 0 },
  { id: 2, titulo: "Clean Code", autor: "Robert C. Martin", genero: "Programación", disponible: false, popularidad: 0 },
  { id: 3, titulo: "The Pragmatic Programmer", autor: "Andrew Hunt", genero: "Programación", disponible: true, popularidad: 0 },
  { id: 4, titulo: "1984", autor: "George Orwell", genero: "Ficción", disponible: true, popularidad: 0 },
  { id: 5, titulo: "To Kill a Mockingbird", autor: "Harper Lee", genero: "Ficción", disponible: false, popularidad: 0 }
];

// Sistema de usuarios
const usuarios = [
  { id: 1, nombre: "Javier ", historial: [], multas: 0 },
  { id: 2, nombre: "Victoria", historial: [], multas: 0 }
];

// Función para calcular días entre dos fechas
const diasEntre = (inicio, fin) =>
  Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));

// Biblioteca avanzada
const biblioteca = {
  // Búsqueda avanzada
  buscarAvanzado({ titulo, autor, genero, disponible }) {
    return libros.filter(libro => {
      return (
        (!titulo || libro.titulo.toLowerCase().includes(titulo.toLowerCase())) &&
        (!autor || libro.autor.toLowerCase().includes(autor.toLowerCase())) &&
        (!genero || libro.genero === genero) &&
        (disponible === undefined || libro.disponible === disponible)
      );
    });
  },

  // Registrar préstamo
  prestarLibro({ idLibro, idUsuario }) {
    const libro = libros.find(l => l.id === idLibro);
    const usuario = usuarios.find(u => u.id === idUsuario);

    if (!libro) return { ok: false, mensaje: "Libro no encontrado" };
    if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };
    if (!libro.disponible) return { ok: false, mensaje: "Libro no disponible" };

    libro.disponible = false;
    libro.popularidad++;
    
    const fechaPrestamo = new Date();
    usuario.historial.push({ idLibro, fechaPrestamo });

    return { ok: true, mensaje: `Libro "${libro.titulo}" prestado a ${usuario.nombre}` };
  },

  // Devolver libro + cálculo de multa
  devolverLibro({ idLibro, idUsuario, fechaDevolucion = new Date() }) {
    const libro = libros.find(l => l.id === idLibro);
    const usuario = usuarios.find(u => u.id === idUsuario);

    if (!libro || !usuario) 
      return { ok: false, mensaje: "Libro o usuario no encontrado" };

    const registro = usuario.historial.find(r => r.idLibro === idLibro && !r.fechaDevolucion);

    if (!registro)
      return { ok: false, mensaje: "Este usuario no tenía este libro" };

    libro.disponible = true;
    registro.fechaDevolucion = fechaDevolucion;

    // Multa:  $200 por día después de 7 días
    const dias = diasEntre(registro.fechaPrestamo, fechaDevolucion);
    const retraso = Math.max(0, dias - 7);
    const multa = retraso * 200;

    usuario.multas += multa;

    return { ok: true, mensaje: `Libro devuelto. Multa: $${multa}` };
  },

  // Reporte de popularidad
  reportePopularidad() {
    return [...libros]
      .sort((a, b) => b.popularidad - a.popularidad)
      .map(({ titulo, popularidad }) => ({ titulo, popularidad }));
  },

  // Reporte por usuario
  reporteUsuario(idUsuario) {
    const usuario = usuarios.find(u => u.id === idUsuario);
    if (!usuario) return null;

    const prestamos = usuario.historial.map(({ idLibro, fechaPrestamo, fechaDevolucion }) => {
      const libro = libros.find(l => l.id === idLibro);
      return {
        titulo: libro.titulo,
        fechaPrestamo,
        fechaDevolucion: fechaDevolucion || "No devuelto"
      };
    });

    return { usuario: usuario.nombre, multas: usuario.multas, prestamos };
  }
};

// ========================= DEMOSTRACIONES =========================

console.log("BÚSQUEDA AVANZADA (genero = 'Programación')");
console.log(biblioteca.buscarAvanzado({ genero: "Programación" }), "\n");

console.log("PRESTAR LIBRO");
console.log(biblioteca.prestarLibro({ idLibro: 1, idUsuario: 1 }).mensaje, "\n");

console.log("REPORTE DE USUARIO");
console.log(biblioteca.reporteUsuario(1), "\n");

console.log("POPULARIDAD DE LIBROS");
console.log(biblioteca.reportePopularidad(), "\n");