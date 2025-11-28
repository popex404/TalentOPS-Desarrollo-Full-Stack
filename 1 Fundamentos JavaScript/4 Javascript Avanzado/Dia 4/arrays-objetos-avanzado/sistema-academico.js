// Base de datos de estudiantes (inmutable)
const estudiantes = Object.freeze([
  Object.freeze({
    id: 1,
    nombre: 'Ana García',
    edad: 22,
    carrera: 'Ingeniería Informática',
    calificaciones: Object.freeze([
      Object.freeze({ asignatura: 'Matemáticas', nota: 8.5, creditos: 6 }),
      Object.freeze({ asignatura: 'Programación', nota: 9.0, creditos: 8 }),
      Object.freeze({ asignatura: 'Bases de Datos', nota: 7.5, creditos: 4 })
    ]),
    activo: true
  }),
  Object.freeze({
    id: 2,
    nombre: 'Carlos López',
    edad: 24,
    carrera: 'Ingeniería Informática',
    calificaciones: Object.freeze([
      Object.freeze({ asignatura: 'Matemáticas', nota: 6.0, creditos: 6 }),
      Object.freeze({ asignatura: 'Programación', nota: 8.5, creditos: 8 }),
      Object.freeze({ asignatura: 'Redes', nota: 7.0, creditos: 5 })
    ]),
    activo: true
  }),
  Object.freeze({
    id: 3,
    nombre: 'María Rodríguez',
    edad: 21,
    carrera: 'Arquitectura',
    calificaciones: Object.freeze([
      Object.freeze({ asignatura: 'Dibujo Técnico', nota: 9.5, creditos: 4 }),
      Object.freeze({ asignatura: 'Historia del Arte', nota: 8.0, creditos: 3 })
    ]),
    activo: false
  })
]);

// Sistema de matrícula con validaciones
const SistemaMatricula = {
  // Validaciones de estudiante
  validarEstudiante(estudiante) {
    const errores = [];
    
    if (!estudiante.nombre || estudiante.nombre.trim().length < 2) {
      errores.push('Nombre debe tener al menos 2 caracteres');
    }
    
    if (estudiante.edad < 17 || estudiante.edad > 70) {
      errores.push('Edad debe estar entre 17 y 70 años');
    }
    
    if (!estudiante.carrera || estudiante.carrera.trim().length === 0) {
      errores.push('Carrera es requerida');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  },

  // Validaciones de calificaciones
  validarCalificaciones(calificaciones) {
    const errores = [];
    
    calificaciones.forEach((cal, index) => {
      if (!cal.asignatura || cal.asignatura.trim().length === 0) {
        errores.push(`Asignatura ${index + 1}: nombre requerido`);
      }
      
      if (cal.nota < 0 || cal.nota > 10) {
        errores.push(`Asignatura ${cal.asignatura}: nota debe estar entre 0 y 10`);
      }
      
      if (cal.creditos <= 0) {
        errores.push(`Asignatura ${cal.asignatura}: créditos deben ser mayores a 0`);
      }
    });
    
    return {
      valido: errores.length === 0,
      errores
    };
  },

  // Matricular nuevo estudiante (operación inmutable)
  matricularEstudiante(nuevoEstudiante) {
    const validacionEstudiante = this.validarEstudiante(nuevoEstudiante);
    const validacionCalificaciones = this.validarCalificaciones(nuevoEstudiante.calificaciones);
    
    const todosErrores = [...validacionEstudiante.errores, ...validacionCalificaciones.errores];
    
    if (todosErrores.length > 0) {
      return {
        exito: false,
        errores: todosErrores,
        estudiante: null
      };
    }
    
    // Crear nuevo estudiante con ID único (inmutable)
    const estudianteConId = Object.freeze({
      ...nuevoEstudiante,
      id: Math.max(...estudiantes.map(e => e.id)) + 1,
      calificaciones: Object.freeze(nuevoEstudiante.calificaciones.map(cal => Object.freeze(cal)))
    });
    
    return {
      exito: true,
      errores: [],
      estudiante: estudianteConId
    };
  },

  // Agregar calificación a estudiante existente (inmutable)
  agregarCalificacion(estudianteId, nuevaCalificacion) {
    const estudianteIndex = estudiantes.findIndex(e => e.id === estudianteId);
    
    if (estudianteIndex === -1) {
      return {
        exito: false,
        errores: ['Estudiante no encontrado'],
        estudiante: null
      };
    }
    
    const validacion = this.validarCalificaciones([nuevaCalificacion]);
    if (!validacion.valido) {
      return {
        exito: false,
        errores: validacion.errores,
        estudiante: null
      };
    }
    
    const estudianteActual = estudiantes[estudianteIndex];
    const calificacionesActualizadas = [...estudianteActual.calificaciones, Object.freeze(nuevaCalificacion)];
    
    // Crear nueva versión del estudiante (inmutable)
    const estudianteActualizado = Object.freeze({
      ...estudianteActual,
      calificaciones: Object.freeze(calificacionesActualizadas)
    });
    
    return {
      exito: true,
      errores: [],
      estudiante: estudianteActualizado
    };
  }
};

// Sistema de cálculo de GPA universitario
const CalculadoraGPA = {
  // Escala de conversión de notas a puntos GPA (sistema 4.0)
  escalaGPA: Object.freeze({
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  }),

  // Convertir nota numérica a letra
  convertirNotaALetra(nota) {
    if (nota >= 9.5) return 'A+';
    if (nota >= 9.0) return 'A';
    if (nota >= 8.5) return 'A-';
    if (nota >= 8.0) return 'B+';
    if (nota >= 7.5) return 'B';
    if (nota >= 7.0) return 'B-';
    if (nota >= 6.5) return 'C+';
    if (nota >= 6.0) return 'C';
    if (nota >= 5.5) return 'C-';
    if (nota >= 5.0) return 'D+';
    if (nota >= 4.5) return 'D';
    return 'F';
  },

  // Calcular GPA para un estudiante
  calcularGPA(estudiante) {
    const { calificaciones } = estudiante;
    
    if (!calificaciones || calificaciones.length === 0) {
      return {
        gpa: 0,
        puntosTotales: 0,
        creditosTotales: 0,
        desglose: []
      };
    }

    const desglose = calificaciones.map(calificacion => {
      const letra = this.convertirNotaALetra(calificacion.nota);
      const puntos = this.escalaGPA[letra] || 0;
      const puntosPonderados = puntos * calificacion.creditos;
      
      return Object.freeze({
        asignatura: calificacion.asignatura,
        nota: calificacion.nota,
        letra,
        puntos,
        creditos: calificacion.creditos,
        puntosPonderados
      });
    });

    const creditosTotales = desglose.reduce((sum, item) => sum + item.creditos, 0);
    const puntosTotales = desglose.reduce((sum, item) => sum + item.puntosPonderados, 0);
    const gpa = creditosTotales > 0 ? puntosTotales / creditosTotales : 0;

    return Object.freeze({
      gpa: Math.round(gpa * 1000) / 1000,
      puntosTotales: Math.round(puntosTotales * 100) / 100,
      creditosTotales,
      desglose
    });
  },

  // Calcular GPA promedio por carrera
  calcularGPAPorCarrera(estudiantes) {
    const porCarrera = estudiantes.reduce((acumulador, estudiante) => {
      const carrera = estudiante.carrera;
      if (!acumulador[carrera]) {
        acumulador[carrera] = {
          estudiantes: [],
          creditosTotales: 0,
          puntosTotales: 0
        };
      }
      
      const gpaEstudiante = this.calcularGPA(estudiante);
      acumulador[carrera].estudiantes.push({
        nombre: estudiante.nombre,
        gpa: gpaEstudiante.gpa
      });
      acumulador[carrera].creditosTotales += gpaEstudiante.creditosTotales;
      acumulador[carrera].puntosTotales += gpaEstudiante.puntosTotales;
      
      return acumulador;
    }, {});

    return Object.freeze(
      Object.entries(porCarrera).map(([carrera, datos]) => ({
        carrera,
        gpaPromedio: datos.creditosTotales > 0 ? datos.puntosTotales / datos.creditosTotales : 0,
        totalEstudiantes: datos.estudiantes.length,
        creditosTotales: datos.creditosTotales,
        estudiantes: datos.estudiantes.sort((a, b) => b.gpa - a.gpa)
      }))
    );
  }
};

// Sistema de predicción de rendimiento
const PredictorRendimiento = {
  // Algoritmo simple de predicción basado en tendencias
  predecirRendimiento(estudiante, proximasAsignaturas = []) {
    const historial = estudiante.calificaciones;
    const gpaActual = CalculadoraGPA.calcularGPA(estudiante);
    
    if (historial.length === 0) {
      return {
        prediccion: 'INSUFICIENTE_DATA',
        confianza: 0,
        recomendaciones: ['Necesita más datos históricos para predicción']
      };
    }

    // Análisis de tendencia
    const notasRecientes = historial.slice(-3).map(cal => cal.nota);
    const tendencia = this.calcularTendencia(notasRecientes);
    const consistencia = this.calcularConsistencia(historial.map(cal => cal.nota));
    
    // Predicción basada en GPA actual y tendencia
    let prediccion, confianza;
    
    if (gpaActual.gpa >= 3.5 && tendencia >= 0) {
      prediccion = 'EXCELENTE';
      confianza = 0.85;
    } else if (gpaActual.gpa >= 3.0 && tendencia >= -0.1) {
      prediccion = 'BUENO';
      confianza = 0.75;
    } else if (gpaActual.gpa >= 2.0 && tendencia >= -0.2) {
      prediccion = 'REGULAR';
      confianza = 0.65;
    } else {
      prediccion = 'RIESGO';
      confianza = 0.55;
    }

    // Generar recomendaciones
    const recomendaciones = this.generarRecomendaciones(prediccion, gpaActual.gpa, consistencia);

    return Object.freeze({
      prediccion,
      confianza: Math.round(confianza * 100) / 100,
      gpaActual: gpaActual.gpa,
      tendencia: Math.round(tendencia * 100) / 100,
      consistencia: Math.round(consistencia * 100) / 100,
      recomendaciones,
      proximasAsignaturas: proximasAsignaturas.map(asig => ({
        asignatura: asig,
        probabilidadAprobacion: this.predecirProbabilidadAprobacion(gpaActual.gpa, tendencia, asig.dificultad)
      }))
    });
  },

  calcularTendencia(notas) {
    if (notas.length < 2) return 0;
    
    const primeraMitad = notas.slice(0, Math.ceil(notas.length / 2));
    const segundaMitad = notas.slice(Math.ceil(notas.length / 2));
    
    const promedioPrimera = primeraMitad.reduce((a, b) => a + b, 0) / primeraMitad.length;
    const promedioSegunda = segundaMitad.reduce((a, b) => a + b, 0) / segundaMitad.length;
    
    return promedioSegunda - promedioPrimera;
  },

  calcularConsistencia(notas) {
    if (notas.length < 2) return 1;
    
    const promedio = notas.reduce((a, b) => a + b, 0) / notas.length;
    const varianza = notas.reduce((sum, nota) => sum + Math.pow(nota - promedio, 2), 0) / notas.length;
    const desviacion = Math.sqrt(varianza);
    
    // Consistencia inversa a la desviación estándar (normalizada)
    return Math.max(0, 1 - (desviacion / 5));
  },

  predecirProbabilidadAprobacion(gpa, tendencia, dificultad = 'media') {
    const factoresDificultad = {
      'baja': 1.2,
      'media': 1.0,
      'alta': 0.8,
      'muy_alta': 0.6
    };
    
    let probabilidadBase = (gpa / 4.0) * 0.8 + 0.2; // Base del GPA
    probabilidadBase += tendencia * 0.1; // Ajuste por tendencia
    probabilidadBase *= factoresDificultad[dificultad] || 1.0;
    
    return Math.min(Math.max(probabilidadBase, 0), 1);
  },

  generarRecomendaciones(prediccion, gpa, consistencia) {
    const recomendaciones = [];
    
    if (prediccion === 'RIESGO') {
      recomendaciones.push('Consultar con asesor académico');
      recomendaciones.push('Participar en tutorías');
      recomendaciones.push('Revisar hábitos de estudio');
    }
    
    if (gpa < 2.5) {
      recomendaciones.push('Enfocarse en asignaturas básicas');
    }
    
    if (consistencia < 0.7) {
      recomendaciones.push('Trabajar en consistencia de rendimiento');
    }
    
    if (recomendaciones.length === 0) {
      recomendaciones.push('Mantener buen rendimiento actual');
    }
    
    return Object.freeze(recomendaciones);
  }
};

// Sistema de generación de reportes PDF simulados
const GeneradorReportes = {
  // Generar reporte académico individual
  generarReporteAcademico(estudiante) {
    const gpa = CalculadoraGPA.calcularGPA(estudiante);
    const prediccion = PredictorRendimiento.predecirRendimiento(estudiante);
    
    const reporte = Object.freeze({
      encabezado: {
        titulo: 'REPORTE ACADÉMICO UNIVERSITARIO',
        fecha: new Date().toISOString().split('T')[0],
        numeroReporte: `RA-${estudiante.id}-${Date.now()}`
      },
      estudiante: {
        id: estudiante.id,
        nombre: estudiante.nombre,
        carrera: estudiante.carrera,
        edad: estudiante.edad,
        estado: estudiante.activo ? 'ACTIVO' : 'INACTIVO'
      },
      desempeno: {
        gpa: gpa.gpa,
        escala: '4.0',
        clasificacion: this.clasificarGPA(gpa.gpa),
        totalCreditos: gpa.creditosTotales,
        asignaturasCursadas: estudiante.calificaciones.length
      },
      calificaciones: gpa.desglose.map(item => ({
        asignatura: item.asignatura,
        notaNumerica: item.nota,
        notaLetra: item.letra,
        puntosGPA: item.puntos,
        creditos: item.creditos,
        estado: item.nota >= 7 ? 'APROBADO' : 'REPROBADO'
      })),
      prediccion: {
        nivel: prediccion.prediccion,
        confianza: `${(prediccion.confianza * 100).toFixed(1)}%`,
        recomendaciones: prediccion.recomendaciones
      },
      resumen: {
        promedioNotas: AnalizadorAcademico.calcularPromedioPonderado(estudiante),
        mejorAsignatura: Math.max(...estudiante.calificaciones.map(c => c.nota)),
        peorAsignatura: Math.min(...estudiante.calificaciones.map(c => c.nota)),
        tasaAprobacion: (estudiante.calificaciones.filter(c => c.nota >= 7).length / estudiante.calificaciones.length * 100).toFixed(1) + '%'
      }
    });

    this.simularDescargaPDF(reporte, `reporte_${estudiante.nombre.replace(/\s+/g, '_')}.pdf`);
    return reporte;
  },

  // Generar reporte comparativo por carrera
  generarReporteCarrera(estudiantes, carrera) {
    const estudiantesCarrera = estudiantes.filter(e => e.carrera === carrera && e.activo);
    const gpasCarrera = CalculadoraGPA.calcularGPAPorCarrera(estudiantesCarrera);
    const datosCarrera = gpasCarrera.find(g => g.carrera === carrera);
    
    const reporte = Object.freeze({
      encabezado: {
        titulo: `REPORTE DE CARRERA: ${carrera}`,
        fecha: new Date().toISOString().split('T')[0],
        totalEstudiantes: datosCarrera.totalEstudiantes
      },
      metricasCarrera: {
        gpaPromedio: Math.round(datosCarrera.gpaPromedio * 1000) / 1000,
        creditosTotales: datosCarrera.creditosTotales,
        clasificacionPromedio: this.clasificarGPA(datosCarrera.gpaPromedio)
      },
      rankingEstudiantes: datosCarrera.estudiantes.map((est, index) => ({
        posicion: index + 1,
        nombre: est.nombre,
        gpa: est.gpa,
        clasificacion: this.clasificarGPA(est.gpa)
      })),
      analisisAsignaturas: AnalizadorAcademico.analizarAsignaturas(estudiantesCarrera)
    });

    this.simularDescargaPDF(reporte, `reporte_carrera_${carrera.replace(/\s+/g, '_')}.pdf`);
    return reporte;
  },

  clasificarGPA(gpa) {
    if (gpa >= 3.7) return 'SOBRESALIENTE';
    if (gpa >= 3.3) return 'MUY BUENO';
    if (gpa >= 3.0) return 'BUENO';
    if (gpa >= 2.7) return 'SATISFACTORIO';
    if (gpa >= 2.0) return 'REGULAR';
    return 'ACADÉMICAMENTE EN RIESGO';
  },

  simularDescargaPDF(reporte, nombreArchivo) {
    console.log(`\n GENERANDO PDF: ${nombreArchivo}`);
    console.log('═'.repeat(50));
    console.log(JSON.stringify(reporte, null, 2));
    console.log('═'.repeat(50));
    console.log(` PDF simulado descargado: ${nombreArchivo}\n`);
  }
};

// Sistema de análisis académico original (extendido)
const AnalizadorAcademico = {
  // ... (mantener todas las funciones originales) ...
  calcularPromedioPonderado(estudiante) {
    const { calificaciones } = estudiante;
    const totalCreditos = calificaciones.reduce((sum, cal) => sum + cal.creditos, 0);
    const sumaPonderada = calificaciones.reduce((sum, cal) => sum + (cal.nota * cal.creditos), 0);
    return totalCreditos > 0 ? sumaPonderada / totalCreditos : 0;
  },

  mejoresPorCarrera(estudiantes, limite = 3) {
    const porCarrera = estudiantes.reduce((grupos, estudiante) => {
      const carrera = estudiante.carrera;
      if (!grupos[carrera]) grupos[carrera] = [];
      grupos[carrera].push({
        ...estudiante,
        promedio: this.calcularPromedioPonderado(estudiante)
      });
      return grupos;
    }, {});

    const resultado = {};
    for (const [carrera, estudiantesCarrera] of Object.entries(porCarrera)) {
      resultado[carrera] = estudiantesCarrera
        .sort((a, b) => b.promedio - a.promedio)
        .slice(0, limite);
    }
    return resultado;
  },

  analizarAsignaturas(estudiantes) {
    const todasCalificaciones = estudiantes.flatMap(estudiante =>
      estudiante.calificaciones.map(cal => ({
        asignatura: cal.asignatura,
        nota: cal.nota,
        estudiante: estudiante.nombre,
        carrera: estudiante.carrera
      }))
    );

    const porAsignatura = todasCalificaciones.reduce((grupos, cal) => {
      const asignatura = cal.asignatura;
      if (!grupos[asignatura]) grupos[asignatura] = [];
      grupos[asignatura].push(cal);
      return grupos;
    }, {});

    return Object.entries(porAsignatura).map(([asignatura, calificaciones]) => {
      const notas = calificaciones.map(c => c.nota);
      const promedio = notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
      return {
        asignatura,
        promedio: Math.round(promedio * 100) / 100,
        estudiantes: calificaciones.length,
        maxNota: Math.max(...notas),
        minNota: Math.min(...notas),
        carreras: [...new Set(calificaciones.map(c => c.carrera))]
      };
    });
  },

  generarReporte(estudiante) {
    const promedio = this.calcularPromedioPonderado(estudiante);
    const { calificaciones } = estudiante;
    const { nombre, edad, carrera, activo, calificaciones: [primeraCalificacion, segundaCalificacion, ...restoCalificaciones] = [] } = estudiante;

    return {
      estudiante: { nombre, edad, carrera, activo },
      rendimiento: {
        promedio,
        totalAsignaturas: calificaciones.length,
        mejorNota: Math.max(...calificaciones.map(c => c.nota)),
        peorNota: Math.min(...calificaciones.map(c => c.nota)),
        asignaturasAprobadas: calificaciones.filter(c => c.nota >= 7).length
      },
      detalle: {
        primeraAsignatura: primeraCalificacion,
        segundaAsignatura: segundaCalificacion,
        otrasAsignaturas: restoCalificaciones.length
      }
    };
  }
};

// DEMOSTRACIÓN COMPLETA DEL SISTEMA
console.log('🎓 SISTEMA ACADÉMICO EXTENDIDO - DEMOSTRACIÓN COMPLETA\n');

// 1. Sistema de Matrícula
console.log('1. SISTEMA DE MATRÍCULA');
console.log('═'.repeat(40));

const nuevoEstudiante = {
  nombre: 'Pedro Martínez',
  edad: 20,
  carrera: 'Ingeniería Civil',
  calificaciones: [
    { asignatura: 'Física', nota: 8.0, creditos: 6 },
    { asignatura: 'Cálculo', nota: 7.5, creditos: 8 }
  ],
  activo: true
};

const resultadoMatricula = SistemaMatricula.matricularEstudiante(nuevoEstudiante);
if (resultadoMatricula.exito) {
  console.log(' Estudiante matriculado exitosamente:');
  console.log(JSON.stringify(resultadoMatricula.estudiante, null, 2));
} else {
  console.log(' Error en matrícula:', resultadoMatricula.errores);
}

// 2. Cálculo de GPA
console.log('\n2. SISTEMA DE CÁLCULO DE GPA');
console.log('═'.repeat(40));

estudiantes.forEach(estudiante => {
  const gpa = CalculadoraGPA.calcularGPA(estudiante);
  console.log(`\n${estudiante.nombre}:`);
  console.log(`  GPA: ${gpa.gpa} (${CalculadoraGPA.convertirNotaALetra(gpa.gpa * 2.5)})`);
  console.log(`  Créditos totales: ${gpa.creditosTotales}`);
});

const gpasCarrera = CalculadoraGPA.calcularGPAPorCarrera(estudiantes);
console.log('\n GPA POR CARRERA:');
gpasCarrera.forEach(({ carrera, gpaPromedio, totalEstudiantes }) => {
  console.log(`  ${carrera}: ${gpaPromedio.toFixed(3)} (${totalEstudiantes} estudiantes)`);
});

// 3. Predicción de Rendimiento
console.log('\n3. SISTEMA DE PREDICCIÓN DE RENDIMIENTO');
console.log('═'.repeat(40));

estudiantes.forEach(estudiante => {
  if (estudiante.activo) {
    const prediccion = PredictorRendimiento.predecirRendimiento(estudiante, [
      { nombre: 'Inteligencia Artificial', dificultad: 'alta' },
      { nombre: 'Sistemas Distribuidos', dificultad: 'media' }
    ]);
    
    console.log(`\n${estudiante.nombre}:`);
    console.log(`  Predicción: ${prediccion.prediccion}`);
    console.log(`  Confianza: ${(prediccion.confianza * 100).toFixed(1)}%`);
    console.log(`  Recomendaciones: ${prediccion.recomendaciones.join(', ')}`);
  }
});

// 4. Generación de Reportes PDF
console.log('\n4. GENERACIÓN DE REPORTES PDF');
console.log('═'.repeat(40));

// Reporte individual
console.log('\n Generando reporte individual...');
GeneradorReportes.generarReporteAcademico(estudiantes[0]);

// Reporte por carrera
console.log('\n Generando reporte por carrera...');
GeneradorReportes.generarReporteCarrera(estudiantes, 'Ingeniería Informática');

// 5. Operaciones Inmutables
console.log('\n5. OPERACIONES INMUTABLES');
console.log('═'.repeat(40));

// Demostrar inmutabilidad
const estudianteOriginal = estudiantes[0];
console.log('Estudiante original es frozen:', Object.isFrozen(estudianteOriginal));
console.log('Calificaciones originales son frozen:', Object.isFrozen(estudianteOriginal.calificaciones));

// Intentar modificar (debería fallar en modo estricto)
try {
  // Esto no debería funcionar debido al Object.freeze()
  estudianteOriginal.nombre = 'Nombre Modificado';
  console.log('Inmutabilidad preservada - no se pudo modificar');
} catch (e) {
  console.log('Inmutabilidad forzada - error al modificar:', e.message);
}

// 6. Estadísticas Avanzadas
console.log('\n6. ESTADÍSTICAS AVANZADAS');
console.log('═'.repeat(40));

const estadisticas = estudiantes.reduce((stats, estudiante) => {
  const gpa = CalculadoraGPA.calcularGPA(estudiante);
  const prediccion = PredictorRendimiento.predecirRendimiento(estudiante);
  
  stats.totalEstudiantes++;
  stats.estudiantesActivos += estudiante.activo ? 1 : 0;
  stats.promedioGPA += gpa.gpa;
  stats.estudiantesRiesgo += prediccion.prediccion === 'RIESGO' ? 1 : 0;
  stats.totalCreditos += gpa.creditosTotales;
  
  return stats;
}, {
  totalEstudiantes: 0,
  estudiantesActivos: 0,
  promedioGPA: 0,
  estudiantesRiesgo: 0,
  totalCreditos: 0
});

estadisticas.promedioGPA /= estadisticas.totalEstudiantes;

console.log(' RESUMEN INSTITUCIONAL:');
console.log(`   Total estudiantes: ${estadisticas.totalEstudiantes}`);
console.log(`   Estudiantes activos: ${estadisticas.estudiantesActivos}`);
console.log(`   GPA promedio: ${estadisticas.promedioGPA.toFixed(3)}`);
console.log(`   Estudiantes en riesgo: ${estadisticas.estudiantesRiesgo}`);
console.log(`   Total créditos cursados: ${estadisticas.totalCreditos}`);

console.log('\n SISTEMA ACADÉMICO EXTENDIDO - DEMOSTRACIÓN COMPLETADA!');