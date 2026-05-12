<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    let myAPI = '/api/v1/water-dams';
    if (dev) myAPI = 'http://localhost:10000' + myAPI;
    const g19API = 'https://sos2526-19.onrender.com/api/v1/workers-productivity';

    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
    }

    function normalizeCountry(name) {
        if (!name) return '';
        let country = name.toString().trim().toLowerCase();
        if (country === 'spain' || country === 'españa') return 'España';
        if (country === 'italy' || country === 'italia') return 'Italia';
        return country.charAt(0).toUpperCase() + country.slice(1);
    }

    async function loadIntegration() {
        try {
            cargando = true;
            const [resMine, resG19] = await Promise.all([ fetch(myAPI), fetch(g19API) ]);
            if (!resMine.ok || !resG19.ok) throw new Error('Error en las APIs.');

            const myRawData = await resMine.json();
            const g19RawData = await resG19.json();

            const myGrouped = {};
            myRawData.forEach(item => {
                const c = normalizeCountry(item.country);
                myGrouped[c] = (myGrouped[c] || 0) + (Number(item.cap_mcm) || 0);
            });

            const g19Grouped = {};
            g19RawData.forEach(item => {
                const c = normalizeCountry(item.country);
                g19Grouped[c] = (g19Grouped[c] || 0) + (Number(item.productivity_hour) || 0);
            });

            tablaDatos = Object.keys(myGrouped)
                .filter(c => g19Grouped[c])
                .map(c => ({ country: c, dams: myGrouped[c], prod: g19Grouped[c] }));

            if (tablaDatos.length === 0) {
                mensajeError = 'Sin coincidencias.';
            } else {
                renderChart();
            }
        } catch (error) {
            mensajeError = 'Fallo en la carga.';
        } finally {
            cargando = false;
        }
    }

    function renderChart() {
        // AnyChart se carga vía script para máxima compatibilidad
        anychart.onDocumentReady(function () {
            // Limpiamos el contenedor por si acaso
            const container = document.getElementById('chart-container');
            container.innerHTML = '';

            const data = tablaDatos.map(i => [i.country, i.dams, i.prod]);
            const dataSet = anychart.data.set(data);

            const firstSeriesData = dataSet.mapAs({ x: 0, value: 1 });
            const secondSeriesData = dataSet.mapAs({ x: 0, value: 2 });

            const chart = anychart.bar(); // Gráfico de barras horizontales (Side-by-side)
            chart.animation(true);
            chart.title('Comparativa: Presas (mcm) vs Productividad/h');

            const series1 = chart.bar(firstSeriesData);
            series1.name('Capacidad Presas (mcm)').color('#4285f4');

            const series2 = chart.bar(secondSeriesData);
            series2.name('Productividad/h').color('#db4437');

            chart.legend().enabled(true).fontSize(13).padding([0, 0, 20, 0]);
            chart.container('chart-container');
            chart.draw();
        });
    }

    onMount(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.anychart.com/releases/8.11.0/js/anychart-base.min.js";
        script.onload = loadIntegration;
        document.head.appendChild(script);
    });
</script>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración G19: Productividad</h1>
            <p class="subtitle">Gráfico comparativo horizontal con <strong>AnyChart</strong>.</p>
        </div>
        <button class="btn-back" onclick={() => window.location.href = '/integrations'}>⬅ Volver</button>
    </header>

    <section class="info-box">
        <p>Esta visualización utiliza <strong>AnyChart</strong> para mostrar una comparativa directa entre el sumatorio de capacidad hídrica y la productividad laboral acumulada.</p>
    </section>

    {#if cargando}
        <p class="loading-msg">Cargando AnyChart y procesando datos...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    <section class="chart-box" style="display: {cargando || mensajeError ? 'none' : 'block'}">
        <div id="chart-container" style="width: 100%; height: 500px;"></div>
    </section>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Suma Presas (mcm)</th>
                        <th>Suma Productividad/h</th>
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
    .container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
    .chart-box { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .btn-back { background-color: #6c757d; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
    .info-box { background: #eef2ff; border: 1px solid #c3dafe; padding: 16px; border-radius: 8px; margin-bottom: 20px; color: #1e40af; }
    .table-section { margin-top: 25px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
</style>