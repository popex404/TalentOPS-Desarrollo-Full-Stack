// Sistema de Scraping Web Avanzado
class WebScraper {
    constructor(config = {}) {
        this.config = {
            maxConcurrent: config.maxConcurrent || 5,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            rateLimit: config.rateLimit || 1000, // ms entre requests
            timeout: config.timeout || 10000,
            ...config
        };
        
        this.stats = {
            totalRequests: 0,
            successful: 0,
            failed: 0,
            retries: 0,
            totalTime: 0,
            bytesDownloaded: 0
        };
        
        this.rateLimiter = this.createRateLimiter();
        this.isRunning = false;
    }

    // Rate Limiter usando closures
    createRateLimiter() {
        let lastRequest = 0;
        const queue = [];
        let processing = false;

        const processQueue = () => {
            if (processing || queue.length === 0) return;
            
            processing = true;
            const now = Date.now();
            const timeSinceLastRequest = now - lastRequest;
            const delay = Math.max(0, this.config.rateLimit - timeSinceLastRequest);

            setTimeout(() => {
                const { resolve, reject, fn } = queue.shift();
                lastRequest = Date.now();
                
                try {
                    const result = fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
                
                processing = false;
                processQueue();
            }, delay);
        };

        return (fn) => {
            return new Promise((resolve, reject) => {
                queue.push({ resolve, reject, fn });
                processQueue();
            });
        };
    }

    // Simulador de requests HTTP
    async makeRequest(url, options = {}) {
        return this.rateLimiter(() => {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                this.stats.totalRequests++;

                // Simulación de diferentes tipos de respuestas
                const simulateResponse = () => {
                    const scenarios = [
                        // 70% éxito
                        { probability: 0.7, type: 'success' },
                        // 20% errores temporales
                        { probability: 0.2, type: 'retryable' },
                        // 10% errores permanentes
                        { probability: 0.1, type: 'fatal' }
                    ];

                    const random = Math.random();
                    let cumulative = 0;

                    for (const scenario of scenarios) {
                        cumulative += scenario.probability;
                        if (random <= cumulative) {
                            return scenario.type;
                        }
                    }
                    return 'success';
                };

                const responseType = simulateResponse();

                setTimeout(() => {
                    const responseTime = Date.now() - startTime;

                    switch (responseType) {
                        case 'success':
                            this.stats.successful++;
                            this.stats.totalTime += responseTime;
                            const bytes = Math.floor(Math.random() * 100000) + 50000;
                            this.stats.bytesDownloaded += bytes;
                            
                            resolve({
                                url,
                                status: 200,
                                data: `<!-- Página: ${url} -->\n<div class="content">\n  <h1>Contenido de ${url}</h1>\n  <p>Este es el contenido simulado de la página ${url}</p>\n  <div class="products">\n    ${Array.from({length: 5}, (_, i) => 
                                    `<div class="product" data-id="prod-${i}">Producto ${i + 1}</div>`
                                ).join('\n    ')}\n  </div>\n</div>`,
                                headers: { 'content-type': 'text/html' },
                                responseTime,
                                size: bytes
                            });
                            break;

                        case 'retryable':
                            reject(new Error(`Error temporal en ${url} (503 Service Unavailable)`));
                            break;

                        case 'fatal':
                            reject(new Error(`Error permanente en ${url} (404 Not Found)`));
                            break;
                    }
                }, Math.random() * 300 + 100); // Simular latencia de red
            });
        });
    }

    // Sistema de reintentos automático
    async fetchWithRetry(url, options = {}, attempt = 1) {
        try {
            const response = await this.makeRequest(url, options);
            return response;
        } catch (error) {
            if (attempt >= this.config.retryAttempts) {
                this.stats.failed++;
                throw error;
            }

            // Solo reintentar errores temporales
            if (error.message.includes('temporal') || error.message.includes('503')) {
                this.stats.retries++;
                console.log(`🔄 Reintento ${attempt}/${this.config.retryAttempts} para ${url}`);
                
                await new Promise(resolve => 
                    setTimeout(resolve, this.config.retryDelay * attempt)
                );
                
                return this.fetchWithRetry(url, options, attempt + 1);
            } else {
                this.stats.failed++;
                throw error;
            }
        }
    }

    // Procesador de datos usando async generators - CORREGIDO
    async *processDataStream(responses) {
        for (const response of responses) {
            if (response.status === 'fulfilled' && response.value && response.value.data) {
                yield* this.extractDataFromHTML(response.value);
            } else if (response.status === 'fulfilled' && response.value) {
                // Si no hay data pero la promesa se cumplió, emitir metadatos de error
                yield {
                    type: 'page_error',
                    url: response.value.url || 'unknown',
                    error: 'No data available',
                    timestamp: new Date()
                };
            }
        }
    }

    // Extracción de datos de HTML (simulada) - CORREGIDO
    async *extractDataFromHTML(response) {
        if (!response || !response.data) {
            yield {
                type: 'processing_error',
                error: 'Response data is undefined',
                timestamp: new Date()
            };
            return;
        }

        const { url, data } = response;
        
        // Simular parsing de HTML y extracción de datos
        const products = [];
        const lines = data.split('\n');
        
        for (const line of lines) {
            if (line.includes('class="product"')) {
                const match = line.match(/data-id="([^"]+)">([^<]+)</);
                if (match) {
                    products.push({
                        id: match[1],
                        name: match[2],
                        url: url,
                        price: Math.random() * 100 + 10,
                        category: this.extractCategoryFromURL(url),
                        timestamp: new Date()
                    });
                }
            }
        }

        // Emitir metadatos de la página primero
        yield {
            type: 'page_metadata',
            url: url,
            productCount: products.length,
            size: response.size || 0,
            responseTime: response.responseTime || 0,
            timestamp: new Date()
        };

        // Emitir productos uno por uno en streaming
        for (const product of products) {
            yield {
                type: 'product',
                ...product
            };
        }
    }

    extractCategoryFromURL(url) {
        const categories = ['electronics', 'books', 'clothing', 'home', 'sports'];
        const hash = url.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return categories[Math.abs(hash) % categories.length];
    }

    // Scraping concurrente con Promise.allSettled
    async scrapeUrls(urls, batchSize = this.config.maxConcurrent) {
        this.isRunning = true;
        const allResults = [];
        const startTime = Date.now();

        console.log(`Iniciando scraping de ${urls.length} URLs (concurrentes: ${batchSize})`);

        // Procesar en batches para control de concurrencia
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            console.log(`Procesando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)}`);

            const batchPromises = batch.map(url => 
                this.fetchWithRetry(url).catch(error => ({
                    url,
                    error: error.message,
                    status: 'rejected'
                }))
            );

            const batchResults = await Promise.allSettled(batchPromises);
            allResults.push(...batchResults);

            // Reporte progresivo
            this.printProgressReport(startTime);
        }

        this.isRunning = false;
        return allResults;
    }

    // Async generator para streaming de resultados - CORREGIDO
    async *scrapeWithStreaming(urls) {
        console.log('Iniciando scraping con streaming...');
        const results = await this.scrapeUrls(urls);
        yield* this.processDataStream(results);
    }

    // Generador de reportes de rendimiento
    generatePerformanceReport() {
        const successRate = this.stats.totalRequests > 0 
            ? (this.stats.successful / this.stats.totalRequests * 100).toFixed(2)
            : 0;

        const avgTime = this.stats.totalRequests > 0
            ? (this.stats.totalTime / this.stats.totalRequests).toFixed(2)
            : 0;

        return {
            overview: {
                totalRequests: this.stats.totalRequests,
                successful: this.stats.successful,
                failed: this.stats.failed,
                successRate: `${successRate}%`,
                retries: this.stats.retries,
                bytesDownloaded: this.formatBytes(this.stats.bytesDownloaded)
            },
            performance: {
                averageResponseTime: `${avgTime}ms`,
                totalTime: `${this.stats.totalTime}ms`,
                requestsPerSecond: this.stats.totalTime > 0 
                    ? (this.stats.totalRequests / (this.stats.totalTime / 1000)).toFixed(2)
                    : 0
            },
            configuration: {
                maxConcurrent: this.config.maxConcurrent,
                retryAttempts: this.config.retryAttempts,
                rateLimit: this.config.rateLimit,
                timeout: this.config.timeout
            }
        };
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    printProgressReport(startTime) {
        const elapsed = Date.now() - startTime;
        const successRate = this.stats.totalRequests > 0 
            ? (this.stats.successful / this.stats.totalRequests * 100).toFixed(1)
            : 0;

        console.log(
            `Progreso: ${this.stats.successful}/${this.stats.totalRequests} ` +
            `(${successRate}%) | Reintentos: ${this.stats.retries} | ` +
            `Tiempo: ${elapsed}ms | Datos: ${this.formatBytes(this.stats.bytesDownloaded)}`
        );
    }

    // Limpiar estadísticas
    resetStats() {
        this.stats = {
            totalRequests: 0,
            successful: 0,
            failed: 0,
            retries: 0,
            totalTime: 0,
            bytesDownloaded: 0
        };
    }
}

// Módulo de reportes avanzados
class ScrapingReporter {
    constructor() {
        this.reports = [];
    }

    generateDetailedReport(scrapingResults, performanceReport) {
        const report = {
            timestamp: new Date(),
            summary: performanceReport.overview,
            performance: performanceReport.performance,
            configuration: performanceReport.configuration,
            detailedResults: this.analyzeResults(scrapingResults),
            recommendations: this.generateRecommendations(performanceReport)
        };

        this.reports.push(report);
        return report;
    }

    analyzeResults(results) {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value && !r.value.error);
        const failed = results.filter(r => r.status === 'rejected' || r.value?.error);
        
        const errorTypes = {};
        failed.forEach(result => {
            const errorMsg = result.reason?.message || result.value?.error || 'Unknown error';
            errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
        });

        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            successRate: ((successful.length / results.length) * 100).toFixed(2) + '%',
            errorBreakdown: errorTypes,
            sampleData: successful.slice(0, 3).map(r => r.value?.url || 'Unknown')
        };
    }

    generateRecommendations(performanceReport) {
        const recommendations = [];
        const successRate = parseFloat(performanceReport.overview.successRate);

        if (successRate < 80) {
            recommendations.push('Considera aumentar los reintentos o el delay entre requests');
        }

        if (performanceReport.performance.requestsPerSecond < 2) {
            recommendations.push('Podrías aumentar el límite de requests concurrentes');
        }

        if (performanceReport.overview.retries > performanceReport.overview.totalRequests * 0.3) {
            recommendations.push('Muchos reintentos, considera aumentar el rate limiting');
        }

        return recommendations.length > 0 ? recommendations : ['Configuración óptima'];
    }

    printReport(report) {
        console.log('\n' + '='.repeat(60));
        console.log('REPORTE DETALLADO DE SCRAPING');
        console.log('='.repeat(60));
        
        console.log('\n RESUMEN EJECUTIVO:');
        console.log(`   Total de URLs: ${report.summary.totalRequests}`);
        console.log(`   Exitosos: ${report.summary.successful}`);
        console.log(`   Fallidos: ${report.summary.failed}`);
        console.log(`   Tasa de éxito: ${report.summary.successRate}`);
        console.log(`   Reintentos: ${report.summary.retries}`);
        console.log(`   Datos descargados: ${report.summary.bytesDownloaded}`);

        console.log('\n RENDIMIENTO:');
        console.log(`   Tiempo promedio: ${report.performance.averageResponseTime}`);
        console.log(`   Tiempo total: ${report.performance.totalTime}`);
        console.log(`   Requests/segundo: ${report.performance.requestsPerSecond}`);

        console.log('\n CONFIGURACIÓN:');
        console.log(`   Concurrentes: ${report.configuration.maxConcurrent}`);
        console.log(`   Reintentos: ${report.configuration.retryAttempts}`);
        console.log(`   Rate Limit: ${report.configuration.rateLimit}ms`);

        console.log('\n RESULTADOS DETALLADOS:');
        console.log(`   Tasa de éxito: ${report.detailedResults.successRate}`);
        if (Object.keys(report.detailedResults.errorBreakdown).length > 0) {
            console.log('   Desglose de errores:');
            Object.entries(report.detailedResults.errorBreakdown).forEach(([error, count]) => {
                console.log(`     - ${error}: ${count}`);
            });
        } else {
            console.log('   Desglose de errores: No hay errores');
        }

        console.log('\n RECOMENDACIONES:');
        report.recommendations.forEach(rec => console.log(`   • ${rec}`));
        
        console.log('\n' + '='.repeat(60));
    }
}

// Demostración del sistema completo - CORREGIDA
async function demostrarSistemaScraping() {
    console.log('DEMOSTRACIÓN: SISTEMA AVANZADO DE SCRAPING WEB\n');

    // Generar URLs de ejemplo
    const urls = Array.from({ length: 10 }, (_, i) => 
        `https://ejemplo.com/categoria-${i % 5}/productos-pagina-${Math.floor(i / 5) + 1}`
    );

    // Configurar scraper
    const scraper = new WebScraper({
        maxConcurrent: 3,
        retryAttempts: 2,
        retryDelay: 1000,
        rateLimit: 300,
        timeout: 5000
    });

    const reporter = new ScrapingReporter();

    // Demo 1: Scraping tradicional con reportes
    console.log('1. SCRAPING TRADICIONAL CON REPORTES:\n');
    const results = await scraper.scrapeUrls(urls);
    const performanceReport = scraper.generatePerformanceReport();
    const detailedReport = reporter.generateDetailedReport(results, performanceReport);
    reporter.printReport(detailedReport);

    // Demo 2: Scraping con streaming usando async generators - CORREGIDO
    console.log('\n2. SCRAPING CON STREAMING (ASYNC GENERATORS):\n');
    
    // Resetear stats para la demo de streaming
    scraper.resetStats();
    
    let processedItems = 0;
    let totalProducts = 0;
    let totalPages = 0;
    
    console.log('Iniciando procesamiento en streaming...\n');
    
    try {
        // Usar el async generator para procesar datos en tiempo real
        for await (const item of scraper.scrapeWithStreaming(urls.slice(0, 5))) {
            processedItems++;
            
            if (item.type === 'page_metadata') {
                console.log(` Página: ${item.url} | Productos: ${item.productCount} | Tiempo: ${item.responseTime}ms`);
                totalPages++;
                totalProducts += item.productCount;
            } else if (item.type === 'product') {
                console.log(`    ${item.name} | $${item.price.toFixed(2)} | ${item.category}`);
            } else if (item.type === 'page_error' || item.type === 'processing_error') {
                console.log(`     Error: ${item.error} - ${item.url || ''}`);
            }
            
            // Simular procesamiento adicional más rápido
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        console.log(`\n Procesamiento completado: ${processedItems} items, ${totalPages} páginas, ${totalProducts} productos`);
    } catch (error) {
        console.log(`Error en streaming: ${error.message}`);
    }

    // Demo 3: Manejo de errores graceful con allSettled
    console.log('\n3. MANEJO GRACEFUL DE ERRORES:\n');
    
    const problematicUrls = [
        'https://ejemplo.com/error-temporal',
        'https://ejemplo.com/error-permanente', 
        'https://ejemplo.com/pagina-normal-1',
        'https://ejemplo.com/pagina-normal-2'
    ];

    scraper.resetStats();
    const errorResults = await scraper.scrapeUrls(problematicUrls, 2);
    
    console.log('Resultados con manejo graceful:');
    errorResults.forEach((result, index) => {
        const url = problematicUrls[index];
        if (result.status === 'fulfilled' && result.value && !result.value.error) {
            console.log(`   ${url}: Éxito`);
        } else {
            const error = result.reason?.message || result.value?.error || 'Error desconocido';
            console.log(`   ${url}: ${error}`);
        }
    });

    // Reporte final comparativo
    console.log('\n4. COMPARATIVO FINAL:\n');
    const finalReport = scraper.generatePerformanceReport();
    console.log('Estadísticas acumuladas:');
    console.log(`   Total requests: ${finalReport.overview.totalRequests}`);
    console.log(`   Tasa de éxito: ${finalReport.overview.successRate}`);
    console.log(`   Datos totales: ${finalReport.overview.bytesDownloaded}`);
    console.log(`   Efficiency: ${finalReport.performance.requestsPerSecond} req/segundo`);
}

// Ejecutar demostración
demostrarSistemaScraping().catch(console.error);