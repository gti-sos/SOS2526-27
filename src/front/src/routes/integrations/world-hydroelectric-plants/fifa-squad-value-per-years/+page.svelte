<script>
    import { onMount } from 'svelte';

    let chartDiv;

    async function loadChart() {
        console.log("Cargando datos...");
        const resMy = await fetch('/api/v1/world-hydroelectric-plants');
        const resOther = await fetch('https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const fifaData = await resOther.json();

            console.log("Datos recibidos:", { misPlantas: myData.length, datosFifa: fifaData.length });

            // 1. Procesamiento: Capacidad MW por país
            const myByCountry = myData.reduce((acc, d) => {
                if (d.country && d.capacity_mw) {
                    const country = d.country.toLowerCase().trim();
                    acc[country] = (acc[country] || 0) + Number(d.capacity_mw);
                }
                return acc;
            }, {});

            // 2. Procesamiento: Valor FIFA
            const otherStats = fifaData.reduce((acc, d) => {
                if (d.country && d.total_market_value) {
                    const country = d.country.toLowerCase().trim();
                    if (!acc[country]) acc[country] = { total: 0, count: 0 };
                    acc[country].total += Number(d.total_market_value);
                    acc[country].count += 1;
                }
                return acc;
            }, {});

            console.log("Mis países procesados:", Object.keys(myByCountry));
            console.log("Países FIFA procesados:", Object.keys(otherStats));

            // 3. Cruzar datos
            const commonCountries = Object.keys(myByCountry).filter(c => otherStats[c]);
            
            console.log("Países comunes encontrados:", commonCountries);

            if (commonCountries.length === 0) {
                console.error("ERROR: No hay países en común. Revisa si una API usa nombres en inglés y la otra en español.");
                return;
            }

            const chartData = commonCountries.map(c => [
                c.toUpperCase(),
                myByCountry[c],
                Number((otherStats[c].total / otherStats[c].count).toFixed(2))
            ]);

            renderBipolar(chartData);
        } else {
            console.error("Error al obtener datos de las APIs");
        }
    }

    function renderBipolar(data) {
        // @ts-ignore
        const anychart = window.anychart;
        if (!anychart || !anychart.bipolar || !chartDiv) {
            console.error("AnyChart no está cargado o falta el div");
            return;
        }

        const chart = anychart.bipolar();

        // Serie Izquierda: Energía (Azul)
        const series1 = chart.column(data.map(d => [d[0], d[1]]));
        series1.name('Capacidad Hidroeléctrica (MW)');
        series1.fill('#3498db');

        // Serie Derecha: Valor FIFA (Dorado)
        const series2 = chart.column(data.map(d => [d[0], d[2]]));
        series2.name('Valor Mercado FIFA (M€)');
        series2.fill('#f1c40f');

        chart.title('Relación: Infraestructura Energética vs Potencia Futbolística');
        chart.legend(true);
        chart.yAxis(0).title('Potencia (MW)');
        chart.yAxis(1).title('Valor FIFA (M€)');

        chart.container(chartDiv);
        chart.draw();
        console.log("Gráfica dibujada con éxito");
    }

    onMount(loadChart);
</script>

<svelte:head>
    <script src="https://cdn.anychart.com/releases/8.11.0/js/anychart-bundle.min.js"></script>
    <link rel="stylesheet" href="https://cdn.anychart.com/releases/8.11.0/css/anychart-ui.min.css">
</svelte:head>

<main class="page-container">
    <header class="top-nav">
        <h1 class="page-title">Integración SOS: FIFA Squad Value (G26)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>
            ← Volver
        </button>
    </header>

    <div class="main-card">
        <div id="chart-container" bind:this={chartDiv} style="width: 100%; height: 500px;"></div>
    </div>
    
    <div class="analysis-box">
        <p>
            <span class="icon">⚽</span> 
            <strong>Identificación de campos:</strong> En este gráfico <strong>Bipolar</strong>, separamos la 
            <b>Capacidad Hidroeléctrica (MW)</b> a la izquierda y el <b>Valor Mercado FIFA (M€)</b> a la derecha. 
            Si la gráfica aparece vacía, abre la consola (F12) para ver la depuración de datos.
        </p>
    </div>
</main>

<style>
    /* Estilo Wine-stats */
    :global(body) { background-color: #f8f9fa; margin: 0; font-family: sans-serif; }
    .page-container { padding: 40px; max-width: 1100px; margin: 0 auto; }
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; }
    .page-title { font-size: 28px; font-weight: bold; color: #1e293b; }
    .btn-back { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .main-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 35px; }
    .analysis-box { background: #fff5f5; padding: 25px; border-left: 6px solid #ff4d4d; border-radius: 4px; color: #333; line-height: 1.6; }
</style>