console.log("=== SISTEMA DE SINCRONIZACIÓN DE DATOS ===\n");

// Utilidad de timeout
function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout excedido")), ms)
  );
}

// API simulada
const apiSync = {
  descargarUsuarios() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() < 0.8
          ? resolve([{ id: 1, nombre: "Ana" }, { id: 2, nombre: "Carlos" }])
          : reject(new Error("Fallo al descargar usuarios"));
      }, 300);
    });
  },

  descargarProductos() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() < 0.7
          ? resolve([{ id: "A", stock: 20 }, { id: "B", stock: 33 }])
          : reject(new Error("Fallo al descargar productos"));
      }, 400);
    });
  },

  guardarLocalmente(nombre, datos) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`💾 Guardado local: ${nombre} (${datos.length} registros)`);
        resolve(true);
      }, 200);
    });
  }
};

// Reintentos automáticos
async function reintentar(fn, intentos = 3, delay = 500) {
  for (let i = 1; i <= intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      console.log(`Reintento ${i}/${intentos}: ${e.message}`);
      if (i === intentos) throw e;
      await new Promise(res => setTimeout(res, delay * i)); // Backoff
    }
  }
}

// Ejemplo de como seria implementar callbacks para el ejercicio
// Este codigo muestra como seria utilizar Callback para compararlo con los otros metodos
function sincronizarConCallbacks(callback) {
  console.log("\n=== CALLBACKS ===");

  apiSync.descargarUsuarios()
    .then(usuarios => {
      apiSync.descargarProductos()
        .then(productos => {
          apiSync.guardarLocalmente("usuarios", usuarios)
            .then(() => {
              apiSync.guardarLocalmente("productos", productos)
                .then(() => callback(null, "Sincronización completada (callbacks)"))
                .catch(err => callback(err));
            })
            .catch(err => callback(err));
        })
        .catch(err => callback(err));
    })
    .catch(err => callback(err));
}

function sincronizarConPromises() {
  console.log("\n=== PROMISES ===");

  return Promise.race([
    Promise.all([
      reintentar(() => apiSync.descargarUsuarios()),
      reintentar(() => apiSync.descargarProductos())
    ])
      .then(([usuarios, productos]) => {
        return Promise.all([
          apiSync.guardarLocalmente("usuarios", usuarios),
          apiSync.guardarLocalmente("productos", productos)
        ]);
      })
      .then(() => ({ ok: true, mensaje: "Sincronizado con Promises" })),
    timeout(2000) // Manejo de timeout
  ])
  .catch(err => ({ ok: false, error: err.message }));
}

async function sincronizarAsyncAwait() {
  console.log("\n=== ASYNC / AWAIT ===");

  try {
    const resultado = await Promise.race([
      (async () => {
        console.log("Descargando datos...");

        const [usuarios, productos] = await Promise.all([
          reintentar(() => apiSync.descargarUsuarios()),
          reintentar(() => apiSync.descargarProductos())
        ]);

        console.log("Procesando datos...");
        const totalRegistros = usuarios.length + productos.length;

        console.log("Guardando localmente...");
        await apiSync.guardarLocalmente("usuarios", usuarios);
        await apiSync.guardarLocalmente("productos", productos);

        return {
          ok: true,
          registros: totalRegistros,
          mensaje: "Sincronizado con Async/Await"
        };
      })(),
      timeout(2500)
    ]);

    return resultado;

  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function demo() {
  // Callbacks
  sincronizarConCallbacks((err, res) => {
    if (err) console.log("Error (callbacks):", err.message);
    else console.log("Exito", res);
  });

  // Promises
  const prom = await sincronizarConPromises();
  console.log("Resultado Promises:", prom);

  // Async/Await
  const asyncRes = await sincronizarAsyncAwait();
  console.log("Resultado Async/Await:", asyncRes);
}

demo();