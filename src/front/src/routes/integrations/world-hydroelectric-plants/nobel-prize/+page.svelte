<script>
    import { onMount } from 'svelte';

    let chartDiv;
    let chartInstance = null;

    async function loadData() {
        const API_MY = "/api/v1/world-hydroelectric-plants";
        const API_PROXY = "/api/v1/nobel-prize";

        try {
            const resMy = await fetch(API_MY);
            const myData = await resMy.json();
            const resNobel = await fetch(API_PROXY);
            const nobelData = await resNobel.json();

            if (!myData.length || !nobelData.laureates) return;

            // 1. Agrupar Capacidad MW por país
            const groupedMW = myData.reduce((acc, current) => {
                const country = current.country.trim();
                if (!acc[country]) acc[country] = 0;
                acc[country] += current.capacity_mw;
                return acc;
            }, {});

            const sortedCountries = Object.keys(groupedMW).sort().slice(0, 8); 

            // 2. Preparar los datos
            const finalData = sortedCountries.map(country => {
                const nCount = nobelData.laureates.filter(l => 
                    l.bornCountry && l.bornCountry.toLowerCase().includes(country.toLowerCase())
                ).length;

                return {
                    x: country.toUpperCase(),
                    energy: Math.round(groupedMW[country]),
                    nobel: nCount
                };
            });

            render3DColumn(finalData);
        } catch (e) {
            console.error("Error cargando datos:", e);
        }
    }

    // Anychart - column-3d

    async function render3DColumn(data) {
        let attempts = 0;

        // Espera a que la librería cargue correctamente
        while (!window.anychart && attempts < 30) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        const anychart = window.anychart;
        if (!anychart || !chartDiv) return;
        if (chartInstance) chartInstance.dispose();

        const chartConfig = {
            chart: {
                type: "column-3d", 
                title: "Comparativa 3D: Potencia Industrial vs Capital Intelectual",
                series: [
                    {
                        seriesType: "column",
                        name: "Capacidad Hidroeléctrica",
                        data: data.map(d => ({x: d.x, value: d.energy})),
                        fill: "#3498db",
                        tooltip: { format: "Capacidad: {%Value} MW" }
                    },
                    {
                        seriesType: "column",
                        name: "Premios Nobel",
                        data: data.map(d => ({x: d.x, value: d.nobel})),
                        fill: "#f1c40f",
                        yScale: 1, 
                        tooltip: { format: "Premios Nobel: {%Value}" }
                    }
                ],
                yAxes: [
                    { title: "Capacidad (MW)" },
                    { 
                        title: "Cantidad de Premios Nobel",
                        orientation: "right",
                        enabled: true
                    }
                ],
                legend: { enabled: true, padding: [0, 0, 20, 0] }
            }
        };

        // Creamos el gráfico
        chartInstance = anychart.fromJson(chartConfig);

        const nobelScale = anychart.scales.linear();
        
        // Evitamos que salgan decimales 
        nobelScale.ticks().allowFractional(false);
        nobelScale.minimum(0); // Aseguramos que empiece en 0

        chartInstance.getSeries(1).yScale(nobelScale);
        chartInstance.yAxis(1).scale(nobelScale);

        chartInstance.container(chartDiv);
        chartInstance.draw();
    }

    onMount(loadData);
</script>

<svelte:head>
    <script src="https://cdn.anychart.com/releases/8.11.0/js/anychart-bundle.min.js"></script>
    <link rel="stylesheet" href="https://cdn.anychart.com/releases/8.11.0/css/anychart-ui.min.css">
</svelte:head>

<main class="page-container">
    <header class="top-header">
        <h1 class="main-title">Integración Externa con uso de Proxy: Nobel & Energy Stats</h1>
        <button class="back-btn" onclick={() => window.history.back()}>← Volver</button>
    </header>

    <div class="main-card">
        <div bind:this={chartDiv} style="width: 100%; height: 550px;"></div>
    </div>

    <div class="analysis-box">
        <p>
            <span class="icon">🏛️</span> 
            Las columnas <b>Azules</b> muestran la capacidad hidroeléctrica (MW) en el eje izquierdo. 
            Las columnas <b>Doradas</b> muestran los Premios Nobel en el eje derecho, utilizando escalas independientes 
            para una visualización precisa de ambas magnitudes.
        </p>
    </div>
</main>

<style>
    :global(body) { background-color: #f8f9fa; margin: 0; font-family: sans-serif; }
    .page-container { padding: 40px; max-width: 1100px; margin: 0 auto; }
    .top-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; }
    .main-title { font-size: 28px; font-weight: bold; color: #1e293b; }
    .back-btn { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .main-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin-bottom: 35px; }
    .analysis-box { background: #fff5f5; border-left: 6px solid #ff4d4d; padding: 25px; border-radius: 4px; color: #333; line-height: 1.6; }
    .icon { margin-right: 12px; }
</style>