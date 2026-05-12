<script>
    import { onMount } from 'svelte';

    let chartDiv;
    // Variables de estado para los datos (usadas para evitar errores de linter)
    let countries = [];
    let energyValues = [];
    let nobelValues = [];

    async function loadData() {
        const API_MY = "/api/v1/world-hydroelectric-plants";
        const API_PROXY = "/api/v1/nobel-prize";

        try {
            const resMy = await fetch(API_MY);
            const myData = await resMy.json();

            const resNobel = await fetch(API_PROXY);
            const nobelData = await resNobel.json();

            if (!myData.length || !nobelData.laureates) return;

            // 1. AGRUPAR POR PAÍS Y SUMAR MW
            const grouped = myData.reduce((acc, current) => {
                const country = current.country.trim();
                if (!acc[country]) acc[country] = 0;
                acc[country] += current.capacity_mw;
                return acc;
            }, {});

            // 2. ORDENAR ALFABÉTICAMENTE Y CRUZAR
            countries = Object.keys(grouped).sort((a, b) => a.localeCompare(b)).slice(0, 10);
            
            energyValues = countries.map(c => Math.round(grouped[c]));
            nobelValues = countries.map(c => {
                return nobelData.laureates.filter(l => 
                    l.bornCountry && l.bornCountry.toLowerCase().includes(c.toLowerCase())
                ).length;
            });

            renderMixedChart();
        } catch (e) {
            console.error("Error cargando integración:", e);
        }
    }

    function renderMixedChart() {
        if (!window.ApexCharts || !chartDiv) return;

        const options = {
            series: [
                { name: 'Potencia Hidroeléctrica (MW)', type: 'area', data: energyValues },
                { name: 'Total Premios Nobel', type: 'column', data: nobelValues }
            ],
            chart: {
                height: 500,
                type: 'line', // Tipo base para gráficos mixtos
                toolbar: { show: false },
                stacked: false
            },
            stroke: { width: [3, 0], curve: 'smooth' },
            fill: {
                type: 'gradient',
                gradient: {
                    inverseColors: false,
                    shade: 'light',
                    type: "vertical",
                    opacityFrom: 0.85,
                    opacityTo: 0.55
                }
            },
            colors: ['#008FFB', '#FEB019'], // Azul (Energía) y Dorado (Nobel)
            labels: countries,
            // DOBLE EJE Y: Distingue los campos perfectamente
            yaxis: [
                {
                    title: { text: 'Capacidad MW (Área Azul)', style: { color: '#008FFB' } },
                    labels: { style: { colors: '#008FFB' } }
                },
                {
                    opposite: true,
                    title: { text: 'Laureados Nobel (Columnas)', style: { color: '#FEB019' } },
                    labels: { style: { colors: '#FEB019' } }
                }
            ],
            // ARREGLO LINTER: Solo pasamos dataPointIndex que es el que usamos
            tooltip: {
                custom: function({ dataPointIndex }) {
                    const c = countries[dataPointIndex];
                    const mw = energyValues[dataPointIndex];
                    const nb = nobelValues[dataPointIndex];
                    return `<div style="padding:15px; background:#fff; border:1px solid #ddd; border-radius:5px;">
                        <b style="font-size:15px; color:#333;">${c}</b><hr/>
                        <span style="color:#008FFB;">⚡ Potencia: <b>${mw.toLocaleString()} MW</b></span><br/>
                        <span style="color:#FEB019;">🏆 Premios Nobel: <b>${nb}</b></span>
                    </div>`;
                }
            },
            legend: { position: 'top' },
            title: {
                text: 'Músculo Industrial vs Excelencia Intelectual',
                align: 'center',
                style: { fontSize: '20px', fontWeight: 'bold' }
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
        <h1 class="page-title">Uso de Proxy: Nobel & Energy Stats</h1>
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
            <span class="icon">🏛️</span> 
            <strong>Identificación de campos:</strong> Esta visualización mixta separa las unidades de medida mediante un 
            <strong>doble eje vertical</strong>. El <strong>Área Azul</strong> del fondo cuantifica el volumen de capacidad 
            energética (MW), mientras que las <strong>Columnas Doradas</strong> del primer plano resaltan los hitos individuales 
            en forma de Premios Nobel. Los países están agrupados y ordenados alfabéticamente para facilitar la comparación 
            directa entre el potencial industrial y el capital intelectual nacional.
        </p>
    </div>
</main>

<style>
    /* ESTILO WINE-STATS AL 100% */
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

    .page-title {
        font-size: 28px;
        font-weight: bold;
        color: #000;
        margin: 0;
    }

    .btn-back {
        background-color: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
    }

    .main-card {
        background: white;
        border-radius: 10px;
        padding: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 35px;
    }

    .chart-content {
        min-height: 500px;
    }

    /* EL CUADRO DE ANÁLISIS ESPECÍFICO (ROSADO/ROJO) */
    .analysis-box {
        background-color: #fff5f5; /* Rosado */
        border-left: 6px solid #ff4d4d; /* Borde rojo de 6px */
        padding: 25px;
        border-radius: 4px;
        color: #333;
        font-size: 16px;
        line-height: 1.6;
    }

    .icon {
        margin-right: 10px;
    }
</style>