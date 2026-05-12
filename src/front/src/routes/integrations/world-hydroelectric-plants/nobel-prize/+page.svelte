<script>
    import { onMount } from 'svelte';

    let chartDiv;
    let API_MY = "";
    let API_PROXY = "";

    async function loadData() {
        // URLs automáticas para Localhost y Render
        API_MY = window.location.origin + "/api/v1/world-hydroelectric-plants";
        API_PROXY = window.location.origin + "/api/v1/nobel-prize";

        try {
            // 1. Datos de tus plantas
            const resMy = await fetch(API_MY);
            const myData = await resMy.json();

            // 2. Datos del Nobel mediante TU PROXY
            const resNobel = await fetch(API_PROXY);
            const nobelData = await resNobel.json();

            // 3. AGRUPAR POR PAÍS Y SUMAR CAPACIDAD
            const grouped = myData.reduce((acc, current) => {
                const country = current.country;
                if (!acc[country]) acc[country] = 0;
                acc[country] += current.capacity_mw;
                return acc;
            }, {});

            // 4. ORDENAR ALFABÉTICAMENTE
            const sortedCountries = Object.keys(grouped)
                .sort((a, b) => a.localeCompare(b))
                .slice(0, 10);

            const energySeries = [];
            const nobelSeries = [];

            for (const country of sortedCountries) {
                // Contamos laureados en el JSON que vino del proxy
                const laureates = nobelData.laureates.filter(l => 
                    l.bornCountry && l.bornCountry.toLowerCase().includes(country.toLowerCase())
                ).length;

                energySeries.push(Math.round(grouped[country]));
                nobelSeries.push(laureates);
            }

            renderMixedChart(sortedCountries, energySeries, nobelSeries);
        } catch (e) {
            console.log("Error en la integración: " + e.message);
        }
    }

    function renderMixedChart(categories, energy, nobels) {
        if (!window.ApexCharts || !chartDiv) return;

        const options = {
            series: [
                { name: 'Potencia Hidro (MW)', type: 'column', data: energy },
                { name: 'Nº Premios Nobel', type: 'line', data: nobels }
            ],
            chart: { height: 450, type: 'line', toolbar: { show: false } },
            stroke: { width: [0, 4], curve: 'smooth' },
            title: {
                text: 'Músculo Industrial vs Excelencia Intelectual',
                align: 'center'
            },
            dataLabels: {
                enabled: true,
                enabledOnSeries: [0, 1],
                style: { fontSize: '10px' }
            },
            labels: categories,
            // DOBLE EJE: Para distinguir los campos perfectamente
            yaxis: [
                {
                    title: { text: 'Potencia (MW)', style: { color: '#008FFB' } },
                    labels: { style: { colors: '#008FFB' } }
                },
                {
                    opposite: true,
                    title: { text: 'Laureados Nobel', style: { color: '#FEB019' } },
                    labels: { style: { colors: '#FEB019' } }
                }
            ],
            colors: ['#008FFB', '#FEB019'],
            legend: { position: 'top' }
        };

        new window.ApexCharts(chartDiv, options).render();
    }

    onMount(loadData);
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<main class="page-container">
    <div class="top-nav">
        <h1 class="page-title">Uso de Proxy: Nobel & Energy Stats</h1>
        <button class="btn-volver" on:click={() => window.location.href = "/integrations"}>
            ← Volver
        </button>
    </div>

    <div class="main-card">
        <div class="chart-box">
            <div bind:this={chartDiv}></div>
        </div>
    </div>

    <div class="analysis-box">
        <p>
            <span class="icon">🏆</span> 
            <strong>Análisis de los datos:</strong> Esta integración utiliza un <strong>proxy en el backend</strong> 
            para cruzar los datos de potencia industrial con la base de datos de la Fundación Nobel. 
            Mediante un gráfico mixto, se distinguen los <strong>Megavatios</strong> (columnas azules) de los 
            <strong>Premios Nobel</strong> (línea dorada). La información se presenta agrupada por país y 
            ordenada alfabéticamente, permitiendo comparar la capacidad técnica frente a la excelencia académica.
        </p>
    </div>
</main>

<style>
    /* CLONACIÓN EXACTA DEL ESTILO WINE-STATS */
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

    .top-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
    }

    .page-title {
        font-size: 28px;
        font-weight: bold;
        color: #000;
    }

    .btn-volver {
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    }

    .main-card {
        background: white;
        border-radius: 10px;
        padding: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 35px;
    }

    .chart-box {
        min-height: 450px;
    }

    /* EL CUADRO DE ANÁLISIS ESPECÍFICO (ROSADO/ROJO) */
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
        margin-right: 10px;
    }
</style>