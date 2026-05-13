<script>
    import { onMount } from 'svelte';
    let chartDiv;

    async function loadData() {
    const MY_API_URL = "/api/v1/world-hydroelectric-plants";
    const PROXY_URL = "/api/v1/proxy-universities";

    try {
        const resMy = await fetch(MY_API_URL);
        const myData = await resMy.json();

        const grouped = myData.reduce((acc, current) => {
            const country = current.country;
            if (!acc[country]) acc[country] = 0;
            acc[country] += current.capacity_mw;
            return acc;
        }, {});

        const sortedCountries = Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .slice(0, 10);

        const heatmapSeries = [];

        for (const country of sortedCountries) {
            try {
                // LLAMADA A PROXY
                const resUni = await fetch(`${PROXY_URL}?country=${country}`);
                const uniData = await resUni.json();
                
                heatmapSeries.push({
                    name: country,
                    data: [
                        { x: 'Capacidad (MW)', y: parseFloat(grouped[country].toFixed(2)) },
                        { x: 'Nº Universidades', y: uniData.length }
                    ]
                });
            } catch (e) { 
                console.log("Error en " + country + ": " + e.message); 
            }
        }

        renderHeatmap(heatmapSeries);
    } catch (e) {
        console.error("Error general:", e.message);
    }
}

    // ApexCharts - heat map

    function renderHeatmap(series) {
        if (!window.ApexCharts || !chartDiv) return;

        const options = {
            chart: {
                height: 450,
                type: 'heatmap',
                toolbar: { show: false }
            },
            dataLabels: { 
                enabled: true, 
                style: { colors: ['#fff'], fontSize: '14px' } 
            },
            series: series,
            title: {
                text: 'Capacidad Total vs Diversidad Educativa por País',
                align: 'center',
                style: { fontSize: '18px', color: '#444' }
            },
            colors: ["#3b82f6"], 
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    colorScale: {
                        ranges: [
                            { from: 0, to: 500, name: 'Bajo', color: '#93c5fd' },
                            { from: 501, to: 2000, name: 'Medio', color: '#3b82f6' },
                            { from: 2001, to: 1000000, name: 'Alto', color: '#1e40af' }
                        ]
                    }
                }
            }
        };

        new window.ApexCharts(chartDiv, options).render();
    }

    onMount(loadData);
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<main class="page-container">
    <div class="top-header">
        <h1 class="title">Integración Externa con uso de Proxy: Education & Energy Stats</h1>
        <button class="btn-back" on:click={() => window.location.href = "/integrations"}>
            ← Volver
        </button>
    </div>

    <div class="main-card">
        <div class="chart-content">
            <div bind:this={chartDiv}></div>
        </div>
    </div>

    <div class="analysis-box">
        <p>
            <span class="icon">📊</span> 
            <strong>Análisis de los datos:</strong> Esta gráfica agrupa la <strong>Capacidad Hidroeléctrica Total</strong> 
            de cada país y la compara directamente con el <strong>Número de Universidades</strong> obtenidas de la API de Hipolabs. 
            Los datos están ordenados alfabéticamente por país para facilitar la localización de la información y la lectura 
            de la infraestructura energética frente al volumen educativo nacional.
        </p>
    </div>
</main>

<style>
    :global(body) {
        background-color: #f8f9fa;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .page-container {
        padding: 40px;
        max-width: 1100px;
        margin: 0 auto;
    }

    .top-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .title {
        font-size: 28px;
        font-weight: bold;
        margin: 0;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    }

    .main-card {
        background: white;
        border-radius: 10px;
        padding: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 30px;
    }

    .chart-content {
        min-height: 450px;
    }

    .analysis-box {
        background-color: #fff5f5;
        border-left: 6px solid #ff4d4d;
        padding: 25px;
        border-radius: 4px;
        color: #333;
        font-size: 15px;
        line-height: 1.6;
    }

    .icon {
        margin-right: 8px;
    }
</style>