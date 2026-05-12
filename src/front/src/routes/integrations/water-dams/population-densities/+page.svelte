<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment';

    // 1. Configuración de rutas (siguiendo el patrón de tu compañero)
    let myAPI = '/api/v1/water-dams';
    if (dev) {
        myAPI = 'http://localhost:10000' + myAPI;
    }

    const g15API = '/api/v1/proxy-g15'; // Usando tu proxy

    // 2. Estados con Runas de Svelte 5
    let chart = null;
    let mensajeError = $state('');
    let cargando = $state(true);
    let tablaDatos = $state([]);

    // 3. Funciones auxiliares
    function formatNumber(value) {
        return new Intl.NumberFormat('es-ES', {
            maximumFractionDigits: 2
        }).format(value);
    }

    const clean = (str) => 
        str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";

    async function loadIntegration() {
        try {
            cargando = true;
            mensajeError = '';
            tablaDatos = [];

            const [resMine, resG15] = await Promise.all([
                fetch(myAPI),
                fetch(g15API)
            ]);

            if (!resMine.ok || !resG15.ok) {
                throw new Error('No se pudieron descargar los datos de una o ambas APIs.');
            }

            const myData = await resMine.json();
            const g15Data = await resG15.json();

            // 4. Procesamiento de datos (Cruzando por país)
            const uniqueMyCountries = [...new Set(myData.map(d => d.country))].slice(0, 15);

            tablaDatos = uniqueMyCountries.map(c => {
                const itemMy = myData.find(d => d.country === c);
                const itemG15 = g15Data.find(g => clean(g.country) === clean(c));

                return {
                    country: c,
                    cap_mcm: itemMy ? itemMy.cap_mcm : 0,
                    density: itemG15 ? itemG15.density : 0,
                    year: itemMy ? itemMy.year : 'N/A'
                };
            }).filter(item => item.density > 0); // Solo los que tengan coincidencia

            if (tablaDatos.length === 0) {
                mensajeError = 'No hay países coincidentes para integrar.';
                cargando = false;
                return;
            }

            await renderChart();
            cargando = false;
        } catch (error) {
            console.error('Error cargando la integración:', error);
            mensajeError = 'Error al cargar la integración. Verifica las APIs.';
            cargando = false;
        }
    }

    async function renderChart() {
        const ApexCharts = (await import('apexcharts')).default;

        const options = {
            series: [{
                name: 'Capacidad Presas (mcm)',
                data: tablaDatos.map(i => i.cap_mcm)
            }, {
                name: 'Densidad Población (escalada)',
                data: tablaDatos.map(i => i.density * 10) // Escalado para que se vea en el Radar
            }],
            chart: {
                type: 'radar',
                height: 540,
                toolbar: { show: true }
            },
            title: {
                text: 'Integración: Presas vs Densidad Población',
                align: 'center'
            },
            xaxis: {
                categories: tablaDatos.map(i => i.country)
            },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: '#e8e8e8',
                        fill: { colors: ['#f8f8f8', '#fff'] }
                    }
                }
            },
            colors: ['#FF6384', '#36A2EB'],
            markers: { size: 4 },
            tooltip: {
                y: {
                    formatter: function(val, { seriesIndex }) {
                        return seriesIndex === 0 ? formatNumber(val) + " mcm" : formatNumber(val/10) + " hab/km²";
                    }
                }
            }
        };

        const divChart = document.getElementById('apex-chart');
        if (chart) chart.destroy();
        chart = new ApexCharts(divChart, options);
        chart.render();
    }

    onMount(() => {
        loadIntegration();
        return () => { if (chart) chart.destroy(); };
    });
</script>

<svelte:head>
    <title>Integración G15 - Water Dams</title>
</svelte:head>

<main class="container">
    <header class="header">
        <div>
            <h1>Integración: Presas y Densidad de Población</h1>
            <p class="subtitle">
                Comparación entre <strong>water-dams</strong> y la API del <strong>Grupo 15</strong>.
            </p>
        </div>
        <button class="btn-back" onclick={() => window.location.href = '/'}>
            ⬅ Volver a la página principal
        </button>
    </header>

    <section class="info-box">
        <h2>Descripción de la integración</h2>
        <p>
            Esta vista utiliza <strong>ApexCharts</strong> para comparar la capacidad de las presas (mcm) 
            con la densidad de población obtenida mediante un <strong>Proxy</strong>.
        </p>
    </section>

    {#if cargando}
        <p class="loading-msg">Procesando datos de las APIs...</p>
    {/if}

    {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
    {/if}

    <section class="chart-container" style={cargando || mensajeError ? 'display: none;' : ''}>
        <div id="apex-chart"></div>
    </section>

    {#if tablaDatos.length > 0}
        <section class="table-section">
            <h2>Datos integrados (Tabla)</h2>
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Año</th>
                        <th>Capacidad Presas (mcm)</th>
                        <th>Densidad (hab/km²)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tablaDatos as item}
                        <tr>
                            <td>{item.country}</td>
                            <td>{item.year}</td>
                            <td>{formatNumber(item.cap_mcm)}</td>
                            <td>{formatNumber(item.density)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}

    <p class="footer-text">
        Integración realizada con <strong>ApexCharts (Radar)</strong> y Svelte 5.
    </p>
</main>

<style>
    /* He copiado exactamente los estilos de tu compañero para que sean iguales */
    .container {
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
        font-family: sans-serif;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 20px;
        border-bottom: 2px solid #eee;
        padding-bottom: 15px;
    }

    h1 { color: #333; margin: 0; font-size: 1.5rem; }
    h2 { margin-top: 0; color: #333; font-size: 1.2rem; }
    .subtitle { margin: 8px 0 0; color: #666; }

    .info-box {
        background: #e6f7ff;
        border: 1px solid #91d5ff;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #003a8c;
    }

    .chart-container {
        width: 100%;
        min-height: 580px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        margin-bottom: 25px;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
    }

    .loading-msg { color: #007bff; font-weight: bold; }

    .error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        padding: 12px;
        margin-bottom: 20px;
    }

    .table-section {
        margin-top: 25px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th, td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
    }

    th { background: #f5f5f5; }

    .footer-text {
        color: #777;
        font-size: 0.9rem;
        text-align: center;
        margin-top: 20px;
    }
</style>