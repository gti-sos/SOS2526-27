<script>
    import { onMount } from 'svelte';

    let chartDiv;
    let chartInstance = null;

    async function loadChart() {
        // ?limit=1000 para traer todos los años de todos los países
        const resMy = await fetch('/api/v1/world-hydroelectric-plants?limit=1000');
        const resOther = await fetch('https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years?limit=1000');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const fifaData = await resOther.json();

            // 1. SUMA DE CAPACIDAD (MW)
            const myByCountry = myData.reduce((acc, d) => {
                const country = d.country.toLowerCase().trim();
                acc[country] = (acc[country] || 0) + Number(d.capacity_mw || 0);
                return acc;
            }, {});

            // 2. Agrupamos para calcular la media
            const fifaStats = {};
            fifaData.forEach(d => {
                const country = d.country.toLowerCase().trim();
                const valor = Number(d.total_market_value);
                
                if (!fifaStats[country]) {
                    fifaStats[country] = { suma: 0, contador: 0 };
                }
                fifaStats[country].suma += valor;
                fifaStats[country].contador += 1;
            });

            // 3. CRUZAR DATOS
            const commonCountries = Object.keys(myByCountry).filter(c => fifaStats[c]);

            const finalData = commonCountries.map(c => {
                const mediaCalculada = Number((fifaStats[c].suma / fifaStats[c].contador).toFixed(2));
                
                if (c.includes("argentina")) {
                    console.log(`NUEVO DEBUG ARGENTINA: Suma=${fifaStats[c].suma}, Años=${fifaStats[c].contador}, Media=${mediaCalculada}`);
                }

                return {
                    x: myByCountry[c],
                    value: mediaCalculada,
                    size: mediaCalculada,
                    name: c.toUpperCase()
                };
            });

            await renderBubble(finalData);
        }
    }

    async function renderBubble(data) {
        let attempts = 0;
        while (!window.anychart && attempts < 30) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        const anychart = window.anychart;
        if (!anychart || !chartDiv) return;
        if (chartInstance) chartInstance.dispose();

        // AnyChart - bubble
        
        const chartConfig = {
            chart: {
                type: "bubble", 
                title: "Media de Valor FIFA vs Capacidad Hidroeléctrica",
                series: [{
                    data: data,
                    fill: "#3498db 0.6",
                    stroke: "#3498db",
                    labels: {
                        enabled: true,
                        format: "{%name}",
                        fontColor: "#2c3e50",
                        fontSize: 10
                    },
                    tooltip: {
                        useHtml: true,
                        titleFormat: "<b>{%name}</b>",
                        format: "Capacidad Total: {%x} MW<br/>Media Valor FIFA: {%value} M€"
                    }
                }],
                xAxes: [{ title: "Suma de Capacidad Hidroeléctrica (MW)" }],
                yAxes: [{ title: "Valor Mercado Medio (M€)" }]
            }
        };

        chartInstance = anychart.fromJson(chartConfig);
        chartInstance.container(chartDiv);
        chartInstance.draw();
    }

    onMount(loadChart);
</script>

<svelte:head>
    <script src="https://cdn.anychart.com/releases/8.11.0/js/anychart-bundle.min.js"></script>
    <link rel="stylesheet" href="https://cdn.anychart.com/releases/8.11.0/css/anychart-ui.min.css">
</svelte:head>

<main class="page-container">
    <header class="top-nav">
        <h1 class="page-title">Integración de API SOS: FIFA Squad Value (G26)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>← Volver</button>
    </header>

    <div class="main-card">
        <div bind:this={chartDiv} style="width: 100%; height: 550px;"></div>
    </div>
    
    <div class="analysis-box">
        <p>
            <span class="icon">📊</span> 
            Se promedian los valores de mercado de todos los años disponibles (forzando carga total mediante limit).
        </p>
    </div>
</main>

<style>
    :global(body) { background-color: #f8f9fa; margin: 0; font-family: sans-serif; }
    .page-container { padding: 40px; max-width: 1100px; margin: 0 auto; }
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 16px; }
    .page-title { font-size: 28px; font-weight: bold; }
    .btn-back { background: #64748b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
    .main-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); margin-bottom: 35px; }
    .analysis-box { background: #fff5f5; padding: 25px; border-left: 6px solid #ff4d4d; border-radius: 4px; color: #333; line-height: 1.6; }
    .icon { margin-right: 12px; }
</style>