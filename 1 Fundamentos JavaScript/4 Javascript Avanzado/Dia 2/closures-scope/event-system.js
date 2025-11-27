// Sistema de Event Bus usando closures y module pattern
const EventBus = (function() {
  // Almacenamiento privado de listeners
  const listeners = new Map();

  // Función privada para validar tipos
  function validarTipo(evento, callback) {
    if (typeof evento !== 'string' || evento.trim().length === 0) {
      throw new Error('El nombre del evento debe ser un string no vacío');
    }
    if (typeof callback !== 'function') {
      throw new Error('El callback debe ser una función');
    }
  }

  // API pública
  return {
    // Suscribir listener a un evento
    on: function(evento, callback) {
      validarTipo(evento, callback);

      if (!listeners.has(evento)) {
        listeners.set(evento, new Set());
      }

      listeners.get(evento).add(callback);

      // Retornar función para remover listener (closure)
      return function() {
        listeners.get(evento).delete(callback);
      };
    },

    // Remover listener específico
    off: function(evento, callback) {
      if (listeners.has(evento)) {
        listeners.get(evento).delete(callback);
      }
    },

    // Emitir evento con datos
    emit: function(evento, ...datos) {
      if (typeof evento !== 'string') {
        throw new Error('El nombre del evento debe ser un string');
      }

      if (listeners.has(evento)) {
        const callbacks = listeners.get(evento);
        callbacks.forEach(callback => {
          try {
            callback(...datos);
          } catch (error) {
            console.error(`Error en callback para evento '${evento}':`, error);
          }
        });
      }
    },

    // Emitir evento una sola vez
    once: function(evento, callback) {
      validarTipo(evento, callback);

      const remover = this.on(evento, function(...datos) {
        callback(...datos);
        remover(); // Se remueve automáticamente después de la primera ejecución
      });
    },

    // Obtener información de debugging
    debug: function() {
      const info = {};
      for (const [evento, callbacks] of listeners) {
        info[evento] = callbacks.size;
      }
      return info;
    },

    // Limpiar todos los listeners
    clear: function() {
      listeners.clear();
    }
  };
})();

// Sistema de Cache Avanzado usando closures
const CacheSystem = (function(eventBus) {
  // Almacenamiento privado del cache
  let cache = new Map();
  let stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalGets: 0,
    totalSets: 0
  };
  
  let evictionStrategy = 'LRU'; // Por defecto: LRU
  let defaultTTL = 300000; // 5 minutos por defecto (en milisegundos)
  let maxSize = null;
  
  // Estructura para almacenar información adicional de cada item
  function CacheItem(valor, ttl, timestamp, accessCount = 0) {
    this.valor = valor;
    this.ttl = ttl;
    this.timestamp = timestamp;
    this.lastAccessed = timestamp;
    this.accessCount = accessCount;
  }

  // Estrategias de evicción
  const evictionStrategies = {
    LRU: function() {
      let lruKey = null;
      let lruTime = Date.now();
      
      for (const [key, item] of cache.entries()) {
        if (item.lastAccessed < lruTime) {
          lruTime = item.lastAccessed;
          lruKey = key;
        }
      }
      return lruKey;
    },
    
    FIFO: function() {
      let fifoKey = null;
      let fifoTime = Date.now();
      
      for (const [key, item] of cache.entries()) {
        if (item.timestamp < fifoTime) {
          fifoTime = item.timestamp;
          fifoKey = key;
        }
      }
      return fifoKey;
    },
    
    LFU: function() {
      let lfuKey = null;
      let lfuCount = Infinity;
      
      for (const [key, item] of cache.entries()) {
        if (item.accessCount < lfuCount) {
          lfuCount = item.accessCount;
          lfuKey = key;
        }
      }
      return lfuKey;
    }
  };

  // Función para limpiar elementos expirados
  function limpiarExpirados() {
    const ahora = Date.now();
    let eliminados = 0;
    
    for (const [key, item] of cache.entries()) {
      if (ahora - item.timestamp > item.ttl) {
        cache.delete(key);
        eliminados++;
        eventBus.emit('cache:eviction', key, 'TTL_EXPIRED', item.valor);
      }
    }
    
    if (eliminados > 0) {
      stats.evictions += eliminados;
      eventBus.emit('cache:cleanup', eliminados);
    }
    
    return eliminados;
  }

  // Función para aplicar política de evicción cuando sea necesario
  function aplicarEviccionSiNecesario() {
    if (maxSize && cache.size >= maxSize) {
      const keyAEliminar = evictionStrategies[evictionStrategy]();
      if (keyAEliminar) {
        const itemEliminado = cache.get(keyAEliminar);
        cache.delete(keyAEliminar);
        stats.evictions++;
        eventBus.emit('cache:eviction', keyAEliminar, evictionStrategy, itemEliminado.valor);
        return true;
      }
    }
    return false;
  }

  // API pública del CacheSystem
  return {
    // Configurar el cache
    configurar: function(config = {}) {
      if (config.evictionStrategy && evictionStrategies[config.evictionStrategy]) {
        evictionStrategy = config.evictionStrategy;
        console.log(`Estrategia de evicción cambiada a: ${evictionStrategy}`);
      }
      if (config.defaultTTL && typeof config.defaultTTL === 'number') {
        defaultTTL = config.defaultTTL;
        console.log(`TTL por defecto cambiado a: ${defaultTTL}ms`);
      }
      if (config.maxSize && typeof config.maxSize === 'number') {
        maxSize = config.maxSize;
        console.log(`Tamaño máximo del cache: ${maxSize} elementos`);
      }
    },

    // Almacenar un valor en el cache
    set: function(clave, valor, ttl = defaultTTL) {
      if (typeof clave !== 'string' || clave.trim().length === 0) {
        throw new Error('La clave debe ser un string no vacío');
      }

      // Limpiar elementos expirados antes de agregar
      limpiarExpirados();

      const timestamp = Date.now();
      const cacheItem = new CacheItem(valor, ttl, timestamp);

      // Aplicar evicción si se excede el tamaño máximo
      aplicarEviccionSiNecesario();

      cache.set(clave, cacheItem);
      stats.totalSets++;
      
      eventBus.emit('cache:set', clave, valor, ttl);
      return true;
    },

    // Obtener un valor del cache
    get: function(clave) {
      if (typeof clave !== 'string') {
        throw new Error('La clave debe ser un string');
      }

      stats.totalGets++;

      // Limpiar elementos expirados antes de buscar
      limpiarExpirados();

      if (cache.has(clave)) {
        const item = cache.get(clave);
        
        // Actualizar información de acceso
        item.lastAccessed = Date.now();
        item.accessCount++;
        
        stats.hits++;
        eventBus.emit('cache:hit', clave, item.valor);
        return item.valor;
      } else {
        stats.misses++;
        eventBus.emit('cache:miss', clave);
        return null;
      }
    },

    // Verificar si una clave existe (sin contar como acceso)
    has: function(clave) {
      limpiarExpirados();
      return cache.has(clave);
    },

    // Eliminar una clave específica
    delete: function(clave) {
      if (cache.has(clave)) {
        const valor = cache.get(clave).valor;
        cache.delete(clave);
        eventBus.emit('cache:delete', clave, valor);
        return true;
      }
      return false;
    },

    // Limpiar todo el cache
    clear: function() {
      const size = cache.size;
      cache.clear();
      eventBus.emit('cache:clear', size);
    },

    // Obtener estadísticas
    getStats: function() {
      return {
        ...stats,
        size: cache.size,
        hitRate: stats.totalGets > 0 ? (stats.hits / stats.totalGets * 100).toFixed(2) + '%' : '0%',
        evictionStrategy: evictionStrategy,
        defaultTTL: defaultTTL,
        maxSize: maxSize
      };
    },

    // Resetear estadísticas
    resetStats: function() {
      stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalGets: 0,
        totalSets: 0
      };
      console.log('Estadísticas del cache reseteadas');
    },

    // Obtener todas las claves (útil para debugging)
    keys: function() {
      return Array.from(cache.keys());
    },

    // Obtener información detallada de los items (debugging)
    debug: function() {
      const ahora = Date.now();
      const info = {};
      
      for (const [key, item] of cache.entries()) {
        info[key] = {
          value: item.valor,
          ttl: item.ttl,
          age: ahora - item.timestamp,
          expiresIn: Math.max(0, item.ttl - (ahora - item.timestamp)),
          lastAccessed: item.lastAccessed,
          accessCount: item.accessCount,
          isExpired: (ahora - item.timestamp) > item.ttl
        };
      }
      
      return info;
    }
  };
})(EventBus);

// Módulo de integración con EventBus
const CacheEventManager = (function(eventBus, cacheSystem) {
  
  // Configurar listeners para eventos del cache
  const setupEventListeners = function() {
    // Evento de cache hit
    eventBus.on('cache:hit', function(clave, valor) {
      console.log(`CACHE HIT: clave "${clave}"`);
    });

    // Evento de cache miss
    eventBus.on('cache:miss', function(clave) {
      console.log(`CACHE MISS: clave "${clave}"`);
    });

    // Evento de cache set
    eventBus.on('cache:set', function(clave, valor, ttl) {
      console.log(`CACHE SET: clave "${clave}" con TTL ${ttl}ms`);
    });

    // Evento de cache eviction
    eventBus.on('cache:eviction', function(clave, razon, valor) {
      console.log(`CACHE EVICTION: clave "${clave}" (${razon})`);
    });

    // Evento de cache delete
    eventBus.on('cache:delete', function(clave, valor) {
      console.log(`CACHE DELETE: clave "${clave}"`);
    });

    // Evento de cache clear
    eventBus.on('cache:clear', function(tamañoAnterior) {
      console.log(`CACHE CLEAR: se eliminaron ${tamañoAnterior} elementos`);
    });

    // Evento de cleanup automático
    eventBus.on('cache:cleanup', function(elementosEliminados) {
      console.log(`CLEANUP: se eliminaron ${elementosEliminados} elementos expirados`);
    });
  };

  return {
    init: function() {
      setupEventListeners();
      console.log('Cache Event Manager inicializado');
    },
    
    // Método para agregar listener personalizado
    on: function(evento, callback) {
      eventBus.on(evento, callback);
    },
    
    // Método para remover listener
    off: function(evento, callback) {
      eventBus.off(evento, callback);
    }
  };
})(EventBus, CacheSystem);

// Demostración del sistema completo
console.log('DEMOSTRACIÓN: SISTEMA DE CACHE AVANZADO CON EVENT BUS\n');

// Inicializar el Event Manager del Cache
CacheEventManager.init();

// Configurar el cache
console.log('\n  Configurando el cache...');
CacheSystem.configurar({
  evictionStrategy: 'LRU',
  defaultTTL: 10000, // 10 segundos
  maxSize: 5
});

// Función simulada que tarda en ejecutarse (para demostrar cache)
function operacionCostosa(id) {
  console.log(`Ejecutando operación costosa para id: ${id}`);
  return `Resultado para ${id} - ${Date.now()}`;
}

// Demostración de uso del cache
console.log('\nDEMOSTRACIÓN DE CACHE CON TTL:\n');

// Simular múltiples operaciones
setTimeout(() => {
  console.log('\n1. Almacenando datos en cache...');
  CacheSystem.set('usuario:1', { id: 1, nombre: 'Juan' }, 5000);
  CacheSystem.set('usuario:2', { id: 2, nombre: 'Maria' });
  CacheSystem.set('config:app', { tema: 'oscuro', idioma: 'es' }, 15000);
  console.log('Claves en cache:', CacheSystem.keys());
}, 100);

setTimeout(() => {
  console.log('\n2. Accesos al cache (primer intento):');
  console.log('Usuario 1:', CacheSystem.get('usuario:1'));
  console.log('Usuario 3:', CacheSystem.get('usuario:3')); // No existe
}, 500);

setTimeout(() => {
  console.log('\n3. Accesos al cache (segundo intento - debería haber hits):');
  console.log('Usuario 1:', CacheSystem.get('usuario:1'));
  console.log('Config App:', CacheSystem.get('config:app'));
}, 1000);

setTimeout(() => {
  console.log('\n4. Después de 6 segundos (algunos elementos expirados):');
  console.log('Usuario 1:', CacheSystem.get('usuario:1')); // Debería estar expirado
  console.log('Usuario 2:', CacheSystem.get('usuario:2'));
  console.log('Config App:', CacheSystem.get('config:app'));
}, 6000);

setTimeout(() => {
  console.log('\n5. Probando diferentes estrategias de evicción:');
  
  // Cambiar a estrategia FIFO
  CacheSystem.configurar({ evictionStrategy: 'FIFO', maxSize: 3 });
  
  // Llenar el cache
  CacheSystem.set('item1', 'valor1');
  CacheSystem.set('item2', 'valor2');
  CacheSystem.set('item3', 'valor3');
  CacheSystem.set('item4', 'valor4'); // Debería evictar el más antiguo
  
  console.log('Claves en cache:', CacheSystem.keys());
}, 8000);

setTimeout(() => {
  console.log('\n6. Estadísticas del cache:');
  console.log(CacheSystem.getStats());
}, 9000);

setTimeout(() => {
  console.log('\n7. Información de debugging:');
  const debugInfo = CacheSystem.debug();
  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
}, 9500);

setTimeout(() => {
  console.log('\n8. Simulando operaciones costosas con cache:');
  
  function obtenerDatosConCache(id) {
    const cacheKey = `datos:${id}`;
    const cached = CacheSystem.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Si no está en cache, ejecutar operación costosa
    const resultado = operacionCostosa(id);
    CacheSystem.set(cacheKey, resultado, 8000);
    return resultado;
  }
  
  console.log('Primera llamada (debería ser miss):', obtenerDatosConCache(100));
  console.log('Segunda llamada (debería ser hit):', obtenerDatosConCache(100));
  console.log('Tercera llamada (debería ser hit):', obtenerDatosConCache(100));
}, 11000);

setTimeout(() => {
  console.log('\n9. Probando estrategia LFU:');
  CacheSystem.configurar({ evictionStrategy: 'LFU', maxSize: 2 });
  
  // Crear elementos con diferentes frecuencias de acceso
  CacheSystem.set('A', 'valorA');
  CacheSystem.set('B', 'valorB');
  
  // Acceder múltiples veces a A
  CacheSystem.get('A');
  CacheSystem.get('A');
  CacheSystem.get('A');
  
  // Acceder menos veces a B
  CacheSystem.get('B');
  
  // Agregar nuevo elemento - debería evictar B (menos frecuente)
  CacheSystem.set('C', 'valorC');
  
  console.log('Claves finales con LFU:', CacheSystem.keys());
}, 13000);

setTimeout(() => {
  console.log('\n10. Estadísticas finales:');
  const stats = CacheSystem.getStats();
  console.log('ESTADÍSTICAS FINALES:');
  console.log(`   Total Gets: ${stats.totalGets}`);
  console.log(`   Hits: ${stats.hits}`);
  console.log(`   Misses: ${stats.misses}`);
  console.log(`   Hit Rate: ${stats.hitRate}`);
  console.log(`   Evictions: ${stats.evictions}`);
  console.log(`   Tamaño actual: ${stats.size}`);
  console.log(`   Estrategia final: ${stats.evictionStrategy}`);
  
  console.log('\n ¡Demostración completada!');
  console.log('\n Estado final del EventBus:', EventBus.debug());
}, 15000);