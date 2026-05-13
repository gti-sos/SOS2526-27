<script>
    import { onMount } from 'svelte';

    let chartDiv;
    let chartInstance = null;

    async function loadChart() {
        const resMy = await fetch('/api/v1/world-hydroelectric-plants');
        const resOther = await fetch('https://sos2526-26.onrender.com/api/v2/fifa-squad-value-per-years');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const fifaData = await resOther.json();

            // 1. Procesamiento: Sumamos TU capacidad (MW) por país
            const myByCountry = myData.reduce((acc, d) => {
                const country = d.country.toLowerCase().trim();
                acc[country] = (acc[country] || 0) + Number(d.capacity_mw);
                return acc;
            }, {});

            // 2. Procesamiento: Media del Valor FIFA por país (Unificamos años)
            const fifaStats = fifaData.reduce((acc, d) => {
                const country = d.country.toLowerCase().trim();
                if (!acc[country]) acc[country] = { total: 0, count: 0 };
                acc[country].total += Number(d.total_market_value);
                acc[country].count += 1;
                return acc;
            }, {});

            // 3. Cruzamos datos
            const commonCountries = Object.keys(myByCountry).filter(c => fifaStats[c]);

            const bubbleData = commonCountries.map(c => {
                const avgFifa = Number((fifaStats[c].total / fifaStats[c].count).toFixed(2));
                return {
                    x: myByCountry[c],
                    value: avgFifa,
                    size: avgFifa,
                    name: c.toUpperCase()
                };
            });

            await renderBubble(bubbleData);
        }
    }

    async function renderBubble(data) {
        let attempts = 0;
        while ((!window.anychart || typeof window.anychart.bubble !== 'function') && attempts < 30) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        const anychart = window.anychart;
        if (!anychart || !chartDiv) return;

        if (chartInstance) chartInstance.dispose();

        chartInstance = anychart.bubble(data);

        // --- PERSONALIZACIÓN DEL TOOLTIP (Lo que pedías) ---
        const tooltip = chartInstance.tooltip();
        tooltip.useHtml(true);
        // Título del tooltip: Nombre del país
        tooltip.titleFormat("<b>{%name}</b>");
        // Contenido: Nombres descriptivos y unidades, sin 'size' ni 'x/y'
        tooltip.format(
            "<span><b>Capacidad:</b> {%x} MW</span><br/>" +
            "<span><b>Valor de Mercado:</b> {%value} M€</span>"
        );

        // Configuración de los Ejes
        chartInstance.xAxis().title("Capacidad Hidroeléctrica (MW)");
        chartInstance.yAxis().title("Valor Mercado FIFA (Media M€)");
        
        // Estilo de las burbujas
        const series = chartInstance.getSeries(0);
        if (series) {
            series.fill("#3498db 0.6");
            series.stroke("#3498db");
            // Etiqueta sobre la burbuja: Solo nombre del país
            series.labels().enabled(true).format("{%name}").fontColor("#2c3e50").fontSize(10);
        }

        chartInstance.title("Relación: Potencia Industrial vs Valor Deportivo Medio");
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
        <h1 class="page-title">Integración SOS: FIFA Squad Value (G26)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>← Volver</button>
    </header>

    <div class="main-card">
        <div bind:this={chartDiv} style="width: 100%; height: 550px;"></div>
    </div>
    
    <div class="analysis-box">
        <p>
            <span class="icon">📊</span> 
            <strong>Lógica de unificación:</strong> En este gráfico de burbujas, los datos de mercado de la API externa se han 
            <strong>promediado por país</strong> para unificar registros de distintos años. 
            El <b>tamaño y posición vertical</b> indican el valor económico medio de la plantilla, 
            mientras que la <b>posición horizontal</b> representa la capacidad hidroeléctrica total instalada.
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