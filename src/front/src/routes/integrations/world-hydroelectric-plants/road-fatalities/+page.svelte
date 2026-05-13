<script>
    import { onMount } from 'svelte';

    let chartDiv;

    async function loadIntegration() {
        const resMy = await fetch('/api/v1/world-hydroelectric-plants');
        const resOther = await fetch('https://sos2526-11.onrender.com/api/v2/road-fatalities');

        if (resMy.ok && resOther.ok) {
            const myData = await resMy.json();
            const otherData = await resOther.json();

            // 1. Agrupamos TU capacidad MW por país (Sumamos)
            const myByCountry = myData.reduce((acc, d) => {
                const c = d.country.toLowerCase().trim();
                acc[c] = (acc[c] || 0) + Number(d.capacity_mw);
                return acc;
            }, {});

            // 2. Agrupamos Muertes (Nation)
            const otherByCountry = otherData.reduce((acc, d) => {
                const c = d.nation.toLowerCase().trim();
                acc[c] = (acc[c] || 0) + Number(d.total_death);
                return acc;
            }, {});

            // 3. Cruzamos datos (Top 8 para legibilidad)
            const commonCountries = Object.keys(myByCountry)
                .filter(c => otherByCountry[c])
                .sort()
                .slice(0, 8);

            const categories = commonCountries.map(c => c.toUpperCase());
            const energyValues = commonCountries.map(c => myByCountry[c]);
            const roadValues = commonCountries.map(c => otherByCountry[c]);

            renderEcharts(categories, energyValues, roadValues);
        }
    }

    function renderEcharts(categories, energy, road) {
        // @ts-ignore
        if (!window.echarts || !chartDiv) return;
        // @ts-ignore
        const myChart = window.echarts.init(chartDiv);

        const option = {
            title: {
                text: 'Capacidad Industrial vs Seguridad Vial',
                left: 'center',
                textStyle: { fontSize: 20 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['Capacidad MW', 'Muertes Tráfico'],
                top: 'bottom'
            },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            // DOBLE EJE X: Para que las dos escalas se vean bien
            xAxis: [
                {
                    type: 'value',
                    name: 'Potencia (MW)',
                    position: 'top',
                    axisLine: { lineStyle: { color: '#3498db' } }
                },
                {
                    type: 'value',
                    name: 'Muertes',
                    position: 'bottom',
                    axisLine: { lineStyle: { color: '#ff4d4d' } }
                }
            ],
            yAxis: {
                type: 'category',
                data: categories,
                axisLabel: { fontWeight: 'bold' }
            },
            series: [
                {
                    name: 'Capacidad MW',
                    type: 'bar',
                    xAxisIndex: 0,
                    data: energy,
                    itemStyle: { color: '#3498db' }
                },
                {
                    name: 'Muertes Tráfico',
                    type: 'bar',
                    xAxisIndex: 1,
                    data: road,
                    itemStyle: { color: '#ff4d4d' }
                }
            ]
        };

        myChart.setOption(option);
    }

    onMount(loadIntegration);
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
</svelte:head>

<main class="page-container">
    <header class="header-nav">
        <h1 class="page-title">Integración SOS: Road Fatalities (G11)</h1>
        <button class="btn-back" onclick={() => window.history.back()}>
            ← Volver
        </button>
    </header>

    <div class="main-card">
        <div bind:this={chartDiv} style="width: 100%; height: 550px;"></div>
    </div>
    
    <div class="analysis-box">
        <p>
            <span class="icon">🔍</span> 
            <strong>Identificación de los campos:</strong> En este gráfico <strong>Echarts - Bar</strong>, 
            utilizamos una disposición horizontal con <strong>doble eje de valores</strong>. 
            Las barras <b>Azules</b> representan la capacidad hidroeléctrica acumulada (MW) y se rigen por el eje superior. 
            Las barras <b>Rojas</b> representan las muertes totales por tráfico y se rigen por el eje inferior. 
            Esta estructura agrupada por país permite analizar el balance entre el potencial energético nacional 
            y su seguridad vial de forma independiente y clara.
        </p>
    </div>
</main>

<style>
    /* ESTILO WINE-STATS CALCADO AL 100% */
    :global(body) {
        background-color: #f8f9fa;
        margin: 0;
        font-family: -apple-system, system-ui, sans-serif;
    }

    .page-container {
        padding: 40px;
        max-width: 1150px;
        margin: 0 auto;
    }

    .header-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #16a34a; /* Línea verde del header original */
        padding-bottom: 16px;
    }

    .page-title {
        font-size: 28px;
        font-weight: bold;
        color: #000;
        margin: 0;
    }

    .btn-back { 
        background: #64748b; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 8px; 
        cursor: pointer;
        font-weight: bold;
    }

    .main-card { 
        background: white; 
        padding: 40px; 
        border-radius: 12px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        margin-bottom: 35px;
    }

    /* EL CUADRO ROSADO CON BORDE ROJO DE 6PX */
    .analysis-box { 
        background: #fff5f5; 
        padding: 25px; 
        border-left: 6px solid #ff4d4d; 
        border-radius: 4px;
        color: #333;
        font-size: 16px;
        line-height: 1.6;
    }

    .icon { margin-right: 12px; }
</style>