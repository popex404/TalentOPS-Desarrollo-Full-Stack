// Sistema completo de gestión de tareas usando múltiples patrones de diseño

// 1. Singleton para el gestor principal
class GestorTareas {
  constructor() {
    if (GestorTareas.instancia) {
      return GestorTareas.instancia;
    }

    this.tareas = new Map();
    this.siguienteId = 1;
    this.observadores = new Set();
    this.historialComandos = [];
    this.indiceActual = -1;
    this.maxHistorial = 50;
    GestorTareas.instancia = this;
  }

  // Observer Pattern: notificar cambios - CORREGIDO
  suscribir(observador) {
    if (typeof observador.notificar === 'function') {
      this.observadores.add(observador);
    } else {
      console.warn('Observador no válido: debe tener método notificar');
    }
  }

  desuscribir(observador) {
    this.observadores.delete(observador);
  }

  notificar(evento, datos) {
    this.observadores.forEach(observador => {
      try {
        if (observador && typeof observador.notificar === 'function') {
          observador.notificar(evento, datos);
        }
      } catch (error) {
        console.error('Error en observador:', error);
      }
    });
  }

  // Factory Pattern: crear tareas de diferentes tipos
  crearTarea(tipo, datos) {
    const fabrica = new FabricaTareas();
    const tarea = fabrica.crearTarea(tipo, {
      id: this.siguienteId++,
      ...datos,
      fechaCreacion: new Date()
    });

    this.tareas.set(tarea.id, tarea);
    this.notificar('tarea_creada', tarea);
    return tarea;
  }

  obtenerTarea(id) {
    return this.tareas.get(id);
  }

  actualizarTarea(id, cambios) {
    const tarea = this.tareas.get(id);
    if (tarea) {
      Object.assign(tarea, cambios);
      this.notificar('tarea_actualizada', tarea);
      return true;
    }
    return false;
  }

  eliminarTarea(id) {
    const tarea = this.tareas.get(id);
    if (tarea) {
      this.tareas.delete(id);
      this.notificar('tarea_eliminada', tarea);
      return true;
    }
    return false;
  }

  // Strategy Pattern: diferentes algoritmos de filtrado
  obtenerTareas(filtro = {}, estrategiaFiltrado = new FiltroEstandar()) {
    let tareas = Array.from(this.tareas.values());
    return estrategiaFiltrado.filtrar(tareas, filtro);
  }

  obtenerEstadisticas() {
    const tareas = Array.from(this.tareas.values());
    return {
      total: tareas.length,
      completadas: tareas.filter(t => t.completada).length,
      pendientes: tareas.filter(t => !t.completada).length,
      porTipo: tareas.reduce((acc, t) => {
        acc[t.tipo] = (acc[t.tipo] || 0) + 1;
        return acc;
      }, {}),
      porPrioridad: tareas.reduce((acc, t) => {
        acc[t.prioridad] = (acc[t.prioridad] || 0) + 1;
        return acc;
      }, {})
    };
  }

  // Command Pattern: sistema undo/redo
  ejecutarComando(comando) {
    // Limpiar comandos futuros si estamos en medio del historial
    if (this.indiceActual < this.historialComandos.length - 1) {
      this.historialComandos = this.historialComandos.slice(0, this.indiceActual + 1);
    }

    comando.ejecutar();
    this.historialComandos.push(comando);
    
    // Mantener tamaño máximo del historial
    if (this.historialComandos.length > this.maxHistorial) {
      this.historialComandos.shift();
    }
    
    this.indiceActual = this.historialComandos.length - 1;
    this.notificar('comando_ejecutado', comando);
  }

  deshacer() {
    if (this.indiceActual >= 0) {
      const comando = this.historialComandos[this.indiceActual];
      comando.deshacer();
      this.indiceActual--;
      this.notificar('comando_deshacer', comando);
      return true;
    }
    return false;
  }

  rehacer() {
    if (this.indiceActual < this.historialComandos.length - 1) {
      this.indiceActual++;
      const comando = this.historialComandos[this.indiceActual];
      comando.rehacer();
      this.notificar('comando_rehacer', comando);
      return true;
    }
    return false;
  }

  obtenerEstadoUndoRedo() {
    return {
      puedeDeshacer: this.indiceActual >= 0,
      puedeRehacer: this.indiceActual < this.historialComandos.length - 1,
      totalComandos: this.historialComandos.length,
      indiceActual: this.indiceActual
    };
  }
}

// 2. PATTERN COMMAND: Sistema undo/redo
class Comando {
  constructor(gestor) {
    this.gestor = gestor;
    this.nombre = 'ComandoBase';
  }

  ejecutar() {
    throw new Error('Método ejecutar debe ser implementado');
  }

  deshacer() {
    throw new Error('Método deshacer debe ser implementado');
  }

  rehacer() {
    this.ejecutar();
  }
}

class ComandoCrearTarea extends Comando {
  constructor(gestor, tipo, datos) {
    super(gestor);
    this.nombre = 'CrearTarea';
    this.tipo = tipo;
    this.datos = datos;
    this.tareaCreada = null;
  }

  ejecutar() {
    this.tareaCreada = this.gestor.crearTarea(this.tipo, this.datos);
    return this.tareaCreada;
  }

  deshacer() {
    if (this.tareaCreada) {
      this.gestor.eliminarTarea(this.tareaCreada.id);
    }
  }

  rehacer() {
    if (this.tareaCreada) {
      this.tareaCreada = this.gestor.crearTarea(this.tipo, this.datos);
    }
  }
}

class ComandoActualizarTarea extends Comando {
  constructor(gestor, id, cambios) {
    super(gestor);
    this.nombre = 'ActualizarTarea';
    this.id = id;
    this.cambios = cambios;
    this.estadoAnterior = null;
  }

  ejecutar() {
    const tarea = this.gestor.obtenerTarea(this.id);
    if (tarea) {
      this.estadoAnterior = { ...tarea };
      this.gestor.actualizarTarea(this.id, this.cambios);
      return true;
    }
    return false;
  }

  deshacer() {
    if (this.estadoAnterior) {
      this.gestor.actualizarTarea(this.id, this.estadoAnterior);
    }
  }
}

class ComandoEliminarTarea extends Comando {
  constructor(gestor, id) {
    super(gestor);
    this.nombre = 'EliminarTarea';
    this.id = id;
    this.tareaEliminada = null;
  }

  ejecutar() {
    this.tareaEliminada = this.gestor.obtenerTarea(this.id);
    if (this.tareaEliminada) {
      this.gestor.eliminarTarea(this.id);
      return true;
    }
    return false;
  }

  deshacer() {
    if (this.tareaEliminada) {
      this.gestor.tareas.set(this.id, this.tareaEliminada);
      this.gestor.notificar('tarea_creada', this.tareaEliminada);
    }
  }
}

class ComandoCompletarTarea extends Comando {
  constructor(gestor, id) {
    super(gestor);
    this.nombre = 'CompletarTarea';
    this.id = id;
    this.estadoAnterior = null;
  }

  ejecutar() {
    const tarea = this.gestor.obtenerTarea(this.id);
    if (tarea) {
      this.estadoAnterior = tarea.completada;
      this.gestor.actualizarTarea(this.id, { completada: true });
      return true;
    }
    return false;
  }

  deshacer() {
    if (this.estadoAnterior !== null) {
      this.gestor.actualizarTarea(this.id, { completada: this.estadoAnterior });
    }
  }
}

// 3. PATTERN STRATEGY: Diferentes algoritmos de filtrado
class EstrategiaFiltrado {
  filtrar(tareas, filtro) {
    throw new Error('Método filtrar debe ser implementado');
  }
}

class FiltroEstandar extends EstrategiaFiltrado {
  filtrar(tareas, filtro) {
    let resultado = tareas;

    if (filtro.completada !== undefined) {
      resultado = resultado.filter(t => t.completada === filtro.completada);
    }

    if (filtro.prioridad) {
      resultado = resultado.filter(t => t.prioridad === filtro.prioridad);
    }

    if (filtro.tipo) {
      resultado = resultado.filter(t => t.tipo === filtro.tipo);
    }

    if (filtro.texto) {
      const texto = filtro.texto.toLowerCase();
      resultado = resultado.filter(t => 
        t.titulo.toLowerCase().includes(texto) || 
        t.descripcion.toLowerCase().includes(texto)
      );
    }

    return resultado;
  }
}

class FiltroAvanzado extends EstrategiaFiltrado {
  filtrar(tareas, filtro) {
    let resultado = tareas;

    // Filtro por rango de fechas
    if (filtro.fechaDesde || filtro.fechaHasta) {
      resultado = resultado.filter(t => {
        const fechaCreacion = new Date(t.fechaCreacion);
        if (filtro.fechaDesde && fechaCreacion < new Date(filtro.fechaDesde)) return false;
        if (filtro.fechaHasta && fechaCreacion > new Date(filtro.fechaHasta)) return false;
        return true;
      });
    }

    // Filtro por prioridad múltiple
    if (filtro.prioridades && Array.isArray(filtro.prioridades)) {
      resultado = resultado.filter(t => filtro.prioridades.includes(t.prioridad));
    }

    // Filtro por tipos múltiples
    if (filtro.tipos && Array.isArray(filtro.tipos)) {
      resultado = resultado.filter(t => filtro.tipos.includes(t.tipo));
    }

    // Ordenamiento personalizado
    if (filtro.ordenarPor) {
      resultado.sort((a, b) => {
        switch (filtro.ordenarPor) {
          case 'prioridad':
            const prioridades = { 'alta': 3, 'media': 2, 'baja': 1 };
            return prioridades[b.prioridad] - prioridades[a.prioridad];
          case 'fecha':
            return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
          case 'titulo':
            return a.titulo.localeCompare(b.titulo);
          default:
            return 0;
        }
      });
    }

    return resultado;
  }
}

class FiltroInteligente extends EstrategiaFiltrado {
  filtrar(tareas, filtro) {
    let resultado = tareas;

    // Filtro por urgencia (tareas vencidas o próximas a vencer)
    if (filtro.urgentes) {
      resultado = resultado.filter(t => {
        if (t.estaVencida && t.estaVencida()) return true;
        if (t.diasRestantes && t.diasRestantes() <= 2) return true;
        return t.prioridad === 'alta' && !t.completada;
      });
    }

    // Filtro por productividad (tareas que llevan mucho tiempo pendientes)
    if (filtro.estancadas) {
      const unaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      resultado = resultado.filter(t => 
        !t.completada && new Date(t.fechaCreacion) < unaSemanaAtras
      );
    }

    // Filtro por progreso (para tareas con subtareas)
    if (filtro.progresoMinimo !== undefined) {
      resultado = resultado.filter(t => {
        if (t.subtareas && t.subtareas.length > 0) {
          const completadas = t.subtareas.filter(st => st.completada).length;
          const progreso = (completadas / t.subtareas.length) * 100;
          return progreso >= filtro.progresoMinimo;
        }
        return true;
      });
    }

    return resultado;
  }
}

// 4. PATTERN DECORATOR: Funcionalidades adicionales para tareas
class DecoradorTarea {
  constructor(tarea) {
    this.tarea = tarea;
  }

  obtenerInformacion() {
    return this.tarea.obtenerInformacion();
  }

  completar() {
    return this.tarea.completar();
  }
}

class DecoradorNotificacionEmail extends DecoradorTarea {
  constructor(tarea, servicioEmail) {
    super(tarea);
    this.servicioEmail = servicioEmail;
  }

  completar() {
    const resultado = super.completar();
    if (resultado) {
      this.servicioEmail.enviar(
        'tarea-completada',
        `Tarea "${this.tarea.titulo}" completada`,
        `La tarea "${this.tarea.titulo}" ha sido marcada como completada.`
      );
    }
    return resultado;
  }

  obtenerInformacion() {
    const info = super.obtenerInformacion();
    info.notificaciones = {
      email: true,
      servicio: this.servicioEmail.nombre
    };
    return info;
  }
}

class DecoradorIntegracionCalendario extends DecoradorTarea {
  constructor(tarea, servicioCalendario) {
    super(tarea);
    this.servicioCalendario = servicioCalendario;
    this.eventoId = null;
    
    // Crear evento en el calendario si hay fecha límite
    if (tarea.fechaLimite) {
      this.eventoId = this.servicioCalendario.crearEvento(
        tarea.titulo,
        tarea.descripcion,
        tarea.fechaLimite
      );
    }
  }

  completar() {
    const resultado = super.completar();
    if (resultado && this.eventoId) {
      this.servicioCalendario.marcarCompletado(this.eventoId);
    }
    return resultado;
  }

  obtenerInformacion() {
    const info = super.obtenerInformacion();
    info.integracionCalendario = {
      integrado: true,
      eventoId: this.eventoId,
      servicio: this.servicioCalendario.nombre
    };
    return info;
  }
}

class DecoradorRecordatorio extends DecoradorTarea {
  constructor(tarea, servicioRecordatorios) {
    super(tarea);
    this.servicioRecordatorios = servicioRecordatorios;
    this.recordatorioId = null;

    // Configurar recordatorios basados en prioridad
    const recordatorioConfig = this.obtenerConfiguracionRecordatorio();
    if (recordatorioConfig) {
      this.recordatorioId = this.servicioRecordatorios.programar(
        tarea.titulo,
        recordatorioConfig.mensaje,
        recordatorioConfig.intervalo
      );
    }
  }

  obtenerConfiguracionRecordatorio() {
    const configs = {
      'alta': { mensaje: 'Tarea de alta prioridad pendiente', intervalo: 2 * 60 * 60 * 1000 }, // 2 horas
      'media': { mensaje: 'Tarea pendiente', intervalo: 24 * 60 * 60 * 1000 }, // 24 horas
      'baja': { mensaje: 'Tarea pendiente de baja prioridad', intervalo: 3 * 24 * 60 * 60 * 1000 } // 3 días
    };
    return configs[this.tarea.prioridad];
  }

  completar() {
    const resultado = super.completar();
    if (resultado && this.recordatorioId) {
      this.servicioRecordatorios.cancelar(this.recordatorioId);
    }
    return resultado;
  }

  obtenerInformacion() {
    const info = super.obtenerInformacion();
    info.recordatorios = {
      activos: !!this.recordatorioId,
      recordatorioId: this.recordatorioId,
      servicio: this.servicioRecordatorios.nombre
    };
    return info;
  }
}

// 5. Servicios simulados para los decoradores
class ServicioEmail {
  constructor() {
    this.nombre = 'SistemaEmail';
  }

  enviar(tipo, asunto, mensaje) {
    console.log(` EMAIL ENVIADO [${tipo}]: ${asunto}`);
    console.log(`   Mensaje: ${mensaje}`);
  }
}

class ServicioCalendario {
  constructor() {
    this.nombre = 'GoogleCalendar';
    this.eventos = new Map();
    this.siguienteId = 1;
  }

  crearEvento(titulo, descripcion, fecha) {
    const eventoId = this.siguienteId++;
    this.eventos.set(eventoId, {
      id: eventoId,
      titulo,
      descripcion,
      fecha,
      completado: false
    });
    console.log(` EVENTO CREADO: "${titulo}" para ${fecha.toLocaleDateString()}`);
    return eventoId;
  }

  marcarCompletado(eventoId) {
    const evento = this.eventos.get(eventoId);
    if (evento) {
      evento.completado = true;
      console.log(` EVENTO COMPLETADO: "${evento.titulo}"`);
    }
  }
}

class ServicioRecordatorios {
  constructor() {
    this.nombre = 'SistemaRecordatorios';
    this.recordatorios = new Map();
  }

  programar(titulo, mensaje, intervalo) {
    const recordatorioId = Date.now();
    this.recordatorios.set(recordatorioId, {
      titulo,
      mensaje,
      intervalo,
      activo: true
    });
    console.log(` RECORDATORIO PROGRAMADO: "${titulo}" cada ${intervalo / (60 * 60 * 1000)} horas`);
    return recordatorioId;
  }

  cancelar(recordatorioId) {
    if (this.recordatorios.has(recordatorioId)) {
      this.recordatorios.delete(recordatorioId);
      console.log(` RECORDATORIO CANCELADO: ID ${recordatorioId}`);
    }
  }
}

// 6. Factory Pattern para crear diferentes tipos de tareas
class FabricaTareas {
  crearTarea(tipo, datosBase) {
    switch (tipo.toLowerCase()) {
      case 'basica':
        return new TareaBasica(datosBase);
      case 'con-fecha-limite':
        return new TareaConFechaLimite(datosBase);
      case 'recurrente':
        return new TareaRecurrente(datosBase);
      case 'con-subtareas':
        return new TareaConSubtareas(datosBase);
      default:
        throw new Error(`Tipo de tarea '${tipo}' no soportado`);
    }
  }
}

// 7. Clases base de tareas
class TareaBasica {
  constructor({ id, titulo, descripcion = '', prioridad = 'media' }) {
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.prioridad = prioridad;
    this.completada = false;
    this.fechaCreacion = new Date();
    this.tipo = 'basica';
  }

  completar() {
    this.completada = true;
    return true;
  }

  obtenerInformacion() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      prioridad: this.prioridad,
      completada: this.completada,
      tipo: this.tipo,
      fechaCreacion: this.fechaCreacion
    };
  }
}

class TareaConFechaLimite extends TareaBasica {
  constructor(datos) {
    super(datos);
    this.fechaLimite = datos.fechaLimite;
    this.tipo = 'con-fecha-limite';
  }

  estaVencida() {
    return new Date() > this.fechaLimite && !this.completada;
  }

  diasRestantes() {
    const diferencia = this.fechaLimite - new Date();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  obtenerInformacion() {
    return {
      ...super.obtenerInformacion(),
      fechaLimite: this.fechaLimite,
      estaVencida: this.estaVencida(),
      diasRestantes: this.diasRestantes()
    };
  }
}

class TareaRecurrente extends TareaBasica {
  constructor(datos) {
    super(datos);
    this.intervalo = datos.intervalo || 'diario';
    this.ocurrencias = datos.ocurrencias || 1;
    this.ocurrenciaActual = 1;
    this.tipo = 'recurrente';
  }

  completar() {
    this.ocurrenciaActual++;
    if (this.ocurrenciaActual > this.ocurrencias) {
      this.completada = true;
    }
    return this.ocurrenciaActual <= this.ocurrencias;
  }

  obtenerInformacion() {
    return {
      ...super.obtenerInformacion(),
      intervalo: this.intervalo,
      ocurrencias: this.ocurrencias,
      ocurrenciaActual: this.ocurrenciaActual,
      progreso: `${this.ocurrenciaActual}/${this.ocurrencias}`
    };
  }
}

class TareaConSubtareas extends TareaBasica {
  constructor(datos) {
    super(datos);
    this.subtareas = datos.subtareas || [];
    this.tipo = 'con-subtareas';
  }

  agregarSubtarea(titulo, descripcion = '') {
    this.subtareas.push({
      id: Date.now(),
      titulo,
      descripcion,
      completada: false
    });
  }

  completarSubtarea(idSubtarea) {
    const subtarea = this.subtareas.find(st => st.id === idSubtarea);
    if (subtarea) {
      subtarea.completada = true;
      const todasCompletas = this.subtareas.every(st => st.completada);
      if (todasCompletas) {
        this.completada = true;
      }
      return true;
    }
    return false;
  }

  obtenerInformacion() {
    const subtareasCompletas = this.subtareas.filter(st => st.completada).length;
    return {
      ...super.obtenerInformacion(),
      subtareas: this.subtareas,
      progresoSubtareas: `${subtareasCompletas}/${this.subtareas.length}`
    };
  }
}

// 8. Observadores CORREGIDOS
class ObservadorConsola {
  notificar(evento, datos) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${evento}:`, datos.titulo || datos.nombre || datos.id);
  }
}

class ObservadorEstadisticas {
  constructor() {
    this.eventos = [];
  }

  notificar(evento, datos) {
    this.eventos.push({ evento, datos, timestamp: new Date() });
  }

  obtenerEstadisticas() {
    return {
      totalEventos: this.eventos.length,
      eventosPorTipo: this.eventos.reduce((acc, e) => {
        acc[e.evento] = (acc[e.evento] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// DEMOSTRACIÓN COMPLETA DEL SISTEMA EXTENDIDO
console.log(' DEMOSTRACIÓN: SISTEMA EXTENDIDO DE GESTIÓN DE TAREAS\n');

// Crear instancia singleton
const gestor = new GestorTareas();

// Configurar observadores CORREGIDOS
const observadorConsola = new ObservadorConsola();
const observadorEstadisticas = new ObservadorEstadisticas();

gestor.suscribir(observadorConsola);
gestor.suscribir(observadorEstadisticas);

// Servicios para decoradores
const servicioEmail = new ServicioEmail();
const servicioCalendario = new ServicioCalendario();
const servicioRecordatorios = new ServicioRecordatorios();

console.log('1. PATTERN COMMAND: Sistema Undo/Redo');
console.log('═'.repeat(50));

// Crear tareas usando comandos
const comandoCrear1 = new ComandoCrearTarea(gestor, 'con-fecha-limite', {
  titulo: 'Preparar presentación importante',
  descripcion: 'Presentación para junta directiva',
  prioridad: 'alta',
  fechaLimite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
});

const comandoCrear2 = new ComandoCrearTarea(gestor, 'basica', {
  titulo: 'Revisar documentación',
  descripcion: 'Revisar documentos del proyecto',
  prioridad: 'media'
});

gestor.ejecutarComando(comandoCrear1);
gestor.ejecutarComando(comandoCrear2);

console.log('\nTareas después de crear:');
console.log(gestor.obtenerEstadisticas());

// Completar tarea usando comando
const comandoCompletar = new ComandoCompletarTarea(gestor, comandoCrear1.tareaCreada.id);
gestor.ejecutarComando(comandoCompletar);

console.log('\nDespués de completar tarea:');
console.log(gestor.obtenerEstadisticas());

// Deshacer operaciones
console.log('\n Deshaciendo operaciones...');
gestor.deshacer(); // Deshacer completar
gestor.deshacer(); // Deshacer creación segunda tarea

console.log('Después de deshacer 2 veces:');
console.log(gestor.obtenerEstadisticas());

// Rehacer operaciones
console.log('\n Rehaciendo operaciones...');
gestor.rehacer(); // Rehacer creación segunda tarea
gestor.rehacer(); // Rehacer completar tarea

console.log('Después de rehacer 2 veces:');
console.log(gestor.obtenerEstadisticas());

console.log('\n2. PATTERN STRATEGY: Diferentes algoritmos de filtrado');
console.log('═'.repeat(50));

// Crear más tareas para demostración
gestor.ejecutarComando(new ComandoCrearTarea(gestor, 'basica', {
  titulo: 'Tarea de baja prioridad',
  descripcion: 'Esta es una tarea menos importante',
  prioridad: 'baja'
}));

gestor.ejecutarComando(new ComandoCrearTarea(gestor, 'con-fecha-limite', {
  titulo: 'Reunión con cliente urgente',
  descripcion: 'Preparar materiales para reunión',
  prioridad: 'alta',
  fechaLimite: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
}));

// Filtro estándar
console.log('\n Filtro Estándar - Tareas de alta prioridad:');
const filtroEstandar = new FiltroEstandar();
const tareasAltaPrioridad = gestor.obtenerTareas({ prioridad: 'alta' }, filtroEstandar);
tareasAltaPrioridad.forEach(t => console.log(` - ${t.titulo} (${t.prioridad})`));

// Filtro avanzado
console.log('\n Filtro Avanzado - Tareas altas y media, ordenadas por prioridad:');
const filtroAvanzado = new FiltroAvanzado();
const tareasFiltradas = gestor.obtenerTareas({ 
  prioridades: ['alta', 'media'],
  ordenarPor: 'prioridad'
}, filtroAvanzado);
tareasFiltradas.forEach(t => console.log(` - ${t.titulo} (${t.prioridad})`));

// Filtro inteligente
console.log('\n Filtro Inteligente - Tareas urgentes:');
const filtroInteligente = new FiltroInteligente();
const tareasUrgentes = gestor.obtenerTareas({ urgentes: true }, filtroInteligente);
tareasUrgentes.forEach(t => console.log(` - ${t.titulo} (${t.prioridad})`));

console.log('\n3. PATTERN DECORATOR: Funcionalidades adicionales');
console.log('═'.repeat(50));

// Crear tarea base
const tareaBase = gestor.crearTarea('con-fecha-limite', {
  titulo: 'Entrega de reporte final',
  descripcion: 'Completar y entregar reporte del proyecto',
  prioridad: 'alta',
  fechaLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
});

console.log('\n Tarea Base:');
console.log(tareaBase.obtenerInformacion());

// Decorar con notificación por email
const tareaConEmail = new DecoradorNotificacionEmail(tareaBase, servicioEmail);
console.log('\n Tarea con Notificación Email:');
console.log(tareaConEmail.obtenerInformacion());

// Decorar con integración de calendario
const tareaConCalendario = new DecoradorIntegracionCalendario(tareaBase, servicioCalendario);
console.log('\n Tarea con Integración Calendario:');
console.log(tareaConCalendario.obtenerInformacion());

// Decorar con recordatorios
const tareaConRecordatorio = new DecoradorRecordatorio(tareaBase, servicioRecordatorios);
console.log('\n Tarea con Recordatorios:');
console.log(tareaConRecordatorio.obtenerInformacion());

// Combinar múltiples decoradores
console.log('\n Tarea con Múltiples Decoradores:');
const tareaSuperDecorada = new DecoradorRecordatorio(
  new DecoradorIntegracionCalendario(
    new DecoradorNotificacionEmail(tareaBase, servicioEmail),
    servicioCalendario
  ),
  servicioRecordatorios
);
console.log(tareaSuperDecorada.obtenerInformacion());

// Demostrar funcionalidad de decoradores
console.log('\n Completando tarea decorada (debería activar todas las funcionalidades):');
tareaSuperDecorada.completar();

console.log('\n4. ESTADÍSTICAS FINALES Y ESTADO');
console.log('═'.repeat(50));

console.log('Estadísticas del gestor:');
console.log(gestor.obtenerEstadisticas());

console.log('\nEstado del sistema undo/redo:');
console.log(gestor.obtenerEstadoUndoRedo());

console.log('\nEstadísticas de eventos:');
console.log(observadorEstadisticas.obtenerEstadisticas());

console.log('\n SISTEMA EXTENDIDO COMPLETADO EXITOSAMENTE!');