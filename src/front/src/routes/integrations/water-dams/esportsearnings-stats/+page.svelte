<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    // 1. Configuración de rutas
    let myAPI = '/api/v1/water-dams';
    if (dev) {
        myAPI = 'http://localhost:10000' + myAPI;
    }

    const g30API = 'https://sos2526-30.onrender.com/api/v1/esportsearnings-stats';

    // 2. Estados con Runas de Svelte 5
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
    }

    function normalizeCountry(name) {
        if (!name) return '';
        let country = name.toString().trim();
        const replacements = {
            'United States of America': 'United States',
            'USA': 'United States',
            'UK': 'United Kingdom'
        };
        return replacements[country] || country;
    }

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';

            const [resMine, resG30] = await Promise.all([ fetch(myAPI), fetch(g30API) ]);
            if (!resMine.ok || !resG30.ok) throw new Error('Error en las APIs.');

            const myRawData = await resMine.json();
            const g30RawData = await resG30.json();

            // Agrupación y sumatorio para evitar repetidos
            const myGrouped = {};
            myRawData.forEach(item => {
                const c = normalizeCountry(item.country);
                myGrouped[c] = (myGrouped[c] || 0) + (Number(item.cap_mcm) || 0);
            });

            const g30Grouped = {};
            g30RawData.forEach(item => {
                const c = normalizeCountry(item.country);
                g30Grouped[c] = (g30Grouped[c] || 0) + (Number(item.total_money) || 0);
            });

            // Cruzar datos
            tablaDatos = Object.keys(myGrouped)
                .filter(c => g30Grouped[c])
                .map(c => ({
                    country: c,
                    x: myGrouped[c], // Capacidad Presas
                    y: g30Grouped[c] // Premios eSports
                }));

            if (tablaDatos.length === 0) {
                mensajeError = 'No hay países coincidentes.';
            } else {
                renderChart();
            }
        } catch (error) {
            mensajeError = 'Error al procesar los datos.';
        } finally {
            cargando = false;
        }
    }

    async function renderChart() {
        const Highcharts = (await import('highcharts')).default;
        
        Highcharts.chart('highcharts-container', {
            chart: { type: 'scatter', zoomType: 'xy' },
            title: { text: 'Relación: Capacidad Hídrica vs Premios eSports' },
            xAxis: {
                title: { enabled: true, text: 'Capacidad Total Presas (mcm)' },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: { text: 'Total Premios eSports ($)' }
            },
            legend: { enabled: false },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 8,
                        states: { hover: { enabled: true, lineColor: 'rgb(100,100,100)' } }
                    },
                    tooltip: {
                        headerFormat: '<b>{point.key}</b><br>',
                        pointFormat: 'Agua: {point.x} mcm, Premios: {point.y} $'
                    }
                }
            },
            series: [{
                name: 'Países',
                color: 'rgba(223, 83, 83, .5)',
                data: tablaDatos.map(i => ({ x: i.x, y: i.y, name: i.country }))
            }]
        });
    }

    onMount(loadIntegration);
</script>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración G30: Highcharts Scatter</h1>
            <p class="subtitle">Análisis de correlación entre recursos hídricos y ganancias en eSports.</p>
        </div>
        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>⬅ Volver</button>
    </header>

    <section class="info-box">
        <p>Utilizamos <strong>Highcharts</strong> con un <strong>Scatter Plot</strong>. Esta visualización permite observar cómo se distribuyen los países según su sumatorio de capacidad de presas (eje X) y premios de eSports (eje Y).</p>
    </section>

    {#if cargando}
        <div class="loading">Sincronizando sumatorios...</div>
    {/if}

    <div id="highcharts-container" style="width: 100%; height: 500px; margin-bottom: 30px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);"></div>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <h2>Datos Agrupados (HTML)</h2>
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Suma Presas (mcm)</th>
                        <th>Suma Premios ($)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tablaDatos as item}
                        <tr>
                            <td>{item.country}</td>
                            <td>{formatNumber(item.x)}</td>
                            <td>{formatNumber(item.y)} $</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 15px; }
    .info-box { background: #f0f7ff; border: 1px solid #cce3ff; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #004085; }
    .loading { color: #007bff; text-align: center; font-weight: bold; }
    .btn-back { background-color: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .table-section { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
    th { background: #f8f9fa; }
</style>