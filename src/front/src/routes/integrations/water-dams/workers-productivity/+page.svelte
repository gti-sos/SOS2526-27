<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    // 1. Configuración de rutas
    let myAPI = '/api/v1/water-dams';
    if (dev) {
        myAPI = 'http://localhost:10000' + myAPI;
    }

    const g19API = 'https://sos2526-19.onrender.com/api/v1/workers-productivity';

    // 2. Estados con Runas de Svelte 5
    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES').format(value);
    }

    function normalizeCountry(name) {
        if (!name) return '';
        let country = name.toString().trim();
        const replacements = {
            'United States of America': 'United States',
            'USA': 'United States',
            'Spain': 'España',
            'Germany': 'Alemania'
        };
        return replacements[country] || country;
    }

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';

            const [resMine, resG19] = await Promise.all([ fetch(myAPI), fetch(g19API) ]);
            if (!resMine.ok || !resG19.ok) throw new Error('Error en la comunicación con las APIs.');

            const myRawData = await resMine.json();
            const g19RawData = await resG19.json();

            // Agregamos por país (Sumatorio)
            const myGrouped = {};
            myRawData.forEach(item => {
                const c = normalizeCountry(item.country);
                myGrouped[c] = (myGrouped[c] || 0) + (Number(item.cap_mcm) || 0);
            });

            const g19Grouped = {};
            g19RawData.forEach(item => {
                const c = normalizeCountry(item.country || item.entity);
                // Supongamos que el campo es 'productivity' o 'value'
                g19Grouped[c] = (g19Grouped[c] || 0) + (Number(item.productivity) || Number(item.value) || 0);
            });

            // Cruzamos datos
            tablaDatos = Object.keys(myGrouped)
                .filter(c => g19Grouped[c])
                .map(c => ({
                    country: c,
                    dams: myGrouped[c],
                    prod: g19Grouped[c]
                }));

            if (tablaDatos.length === 0) {
                mensajeError = 'No se han encontrado países comunes entre Presas y Productividad.';
            } else {
                renderChart();
            }
        } catch (error) {
            mensajeError = 'Fallo al cargar la integración G19.';
        } finally {
            cargando = false;
        }
    }

    async function renderChart() {
        const c3 = (await import('c3')).default;
        
        chart = c3.generate({
            bindto: '#c3-chart',
            data: {
                columns: [
                    ['Capacidad Presas (mcm)', ...tablaDatos.map(i => i.dams)],
                    ['Productividad Trabajadores', ...tablaDatos.map(i => i.prod)]
                ],
                type: 'area-spline' // Tipo ÁREA (diferente a los anteriores)
            },
            axis: {
                x: {
                    type: 'category',
                    categories: tablaDatos.map(i => i.country)
                }
            },
            color: {
                pattern: ['#2ca02c', '#ff7f0e']
            }
        });
    }

    onMount(loadIntegration);
</script>

<svelte:head>
    <!-- Necesitamos el CSS de C3 para que se vea bien -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/c3/0.7.20/c3.min.css">
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración G19: Workers Productivity</h1>
            <p class="subtitle">Comparativa hídrica y productividad laboral (C3.js Area Chart)</p>
        </div>
        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>⬅ Volver</button>
    </header>

    <section class="info-box">
        <p>Integración realizada mediante <strong>fetch</strong> a la API G19. Los datos se visualizan usando la librería <strong>C3.js</strong> con un gráfico de <strong>Área Suavizada</strong>.</p>
    </section>

    {#if cargando}
        <div class="loading">Cruzando datos de productividad...</div>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    <div class="chart-container" style="display: {cargando || mensajeError ? 'none' : 'block'}">
        <div id="c3-chart"></div>
    </div>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <h2>Tabla de Datos Integrados</h2>
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Sumatorio Presas (mcm)</th>
                        <th>Suma Productividad</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tablaDatos as item}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.dams)}</td>
                            <td>{formatNumber(item.prod)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    /* Mantengo tus estilos de grupo */
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
    .info-box { background: #f6ffed; border: 1px solid #b7eb8f; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #135200; }
    .chart-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px; }
    .btn-back { background-color: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .loading { text-align: center; font-weight: bold; padding: 20px; color: #52c41a; }
    .table-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
    th { background: #f6f6f6; }
</style>