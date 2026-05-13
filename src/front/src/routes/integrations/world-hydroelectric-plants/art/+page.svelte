<script>
    import { onMount } from 'svelte';

    let chartDiv;
    let API_URL = "";

    async function loadData() {
        // DETECCIÓN AUTOMÁTICA (Local o Render)
        API_URL = window.location.origin + "/api/v1/world-hydroelectric-plants";

        try {
            const resMy = await fetch(API_URL);
            const myData = await resMy.json();

            // 1. AGRUPAR POR PAÍS Y SUMAR CAPACIDAD
            const grouped = myData.reduce((acc, current) => {
                const country = current.country;
                if (!acc[country]) acc[country] = 0;
                acc[country] += current.capacity_mw;
                return acc;
            }, {});

            // 2. ORDENAR ALFABÉTICAMENTE
            const sortedCountries = Object.keys(grouped)
                .sort((a, b) => a.localeCompare(b))
                .slice(0, 8); 

            const energyData = [];
            const artData = [];

            // 3. CONSULTAR API DEL MET MUSEUM
            for (const country of sortedCountries) {
                try {
                    const resMet = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/search?q=${country}`);
                    const metData = await resMet.json();
                    
                    // Lado izquierdo (negativo para el efecto espejo): Energía
                    energyData.push(-Math.round(grouped[country])); 
                    // Lado derecho (positivo): Arte
                    artData.push(metData.total || 0);
                } catch (e) { console.log("Error en " + country+e); }
            }

            renderMirrorChart(sortedCountries, energyData, artData);
        } catch (e) {
            "Error: " + e.message;
        }
    }

    //ApexCharts.js - bar

    function renderMirrorChart(categories, energy, art) {
        if (!window.ApexCharts || !chartDiv) return;

        const options = {
            series: [
                { name: 'Potencia Hidroeléctrica (MW)', data: energy },
                { name: 'Patrimonio Artístico (Objetos MET)', data: art }
            ],
            chart: {
                type: 'bar',
                height: 500,
                stacked: true, 
                toolbar: { show: false }
            },
            colors: ['#3b82f6', '#ef4444'], // Azul para Energía, Rojo para Arte
            plotOptions: {
                bar: {
                    horizontal: true,
                    barHeight: '75%',
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function (val) {
                    return Math.abs(val).toLocaleString(); // Mostramos el número real sin el menos
                },
                style: { fontSize: '12px' }
            },
            title: {
                text: 'Comparativa en Espejo: Músculo Industrial vs Legado Cultural',
                align: 'center',
                style: { fontSize: '20px', color: '#1e293b' }
            },
            xaxis: {
                categories: categories,
                labels: {
                    formatter: function (val) {
                        return Math.abs(val);
                    }
                },
                title: { text: '← Potencia MW | Piezas de Arte →' }
            },
            yaxis: {
                labels: { style: { fontWeight: 'bold', fontSize: '14px' } }
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return Math.abs(val).toLocaleString() + " unidades";
                    }
                }
            },
            legend: { position: 'top', horizontalAlign: 'center' }
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
        <h1 class="page-title">Integración API Externa: Art & Energy Stats</h1>
        <button class="btn-back" on:click={() => window.location.href = "/integrations"}>
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
            <span class="icon">🔍</span> 
            <strong>Guía de visualización:</strong> Este gráfico de <strong>Espejo (Mirror Chart)</strong> separa físicamente los dos campos de estudio para evitar confusión. 
            A la <strong>izquierda (Azul)</strong> se detalla la capacidad hidroeléctrica total agrupada, mientras que a la 
            <strong>derecha (Rojo)</strong> se muestra el volumen de patrimonio cultural en el MET. 
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
        max-width: 1150px;
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
        padding: 10px 18px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: background 0.2s;
    }

    .btn-back:hover {
        background-color: #5a6268;
    }

    .main-card {
        background: white;
        border-radius: 10px;
        padding: 40px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 35px;
    }

    .chart-box {
        min-height: 500px;
    }

    .analysis-box {
        background-color: #fff5f5; 
        border-left: 6px solid #ff4d4d; 
        padding: 25px;
        border-radius: 4px;
        color: #2d3436;
        font-size: 16px;
        line-height: 1.6;
    }

    .icon {
        margin-right: 10px;
    }
</style>